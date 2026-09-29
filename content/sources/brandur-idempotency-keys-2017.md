---
id: brandur-idempotency-keys-2017
title: Implementing Stripe-like Idempotency Keys in Postgres
author: Brandur Leach
url: https://brandur.org/idempotency-keys
kind: blog
primary: true
---

## Summary

A worked design (2017, by a Stripe engineer) for idempotency keys on
an API that calls other systems: a Postgres table of keys, a lock so
only one request works a key at a time, "atomic phases" of local
changes between each call to a foreign system, recovery points to
resume a retried request, and background processes that finish
abandoned requests and delete old keys.

## Key claims

- Definition used. "An idempotent endpoint is one that can be called any number of times while guaranteeing that the side effects will occur only once." (intro)
- If an endpoint only changes local state in an ACID database, mapping the request to one transaction is simpler, and preferred. "This approach is far easier and less complicated than what’s described here, and I’d suggest that anyone who can get away with it take that path." (intro)
- An idempotency key is a client-generated unique value; on failure the client retries with it and the server resumes. "If a request should fail partway through, the client retries with the same idempotency key value, and the server uses it to look up the request’s state and continue from where it left off." (Idempotency with keys)
- The name comes from Stripe. "The name “idempotency key” comes from Stripe’s API." (Idempotency with keys)
- Once finished, the result is stored and replayed. "If a client makes another request with the same key, the server simply short circuits and returns the stored results." (Idempotency with keys)
- Keys are for near-term correctness, not an archive; recycle after about 24 hours. "Servers should recycle them out of the system beyond a horizon where they won’t be of much use – say 24 hours or so." (Idempotency with keys)
- Three kinds of foreign calls: idempotent by nature, made idempotent with a key, and not idempotent at all. "some are not idempotent but can be made idempotent with the help of an idempotency key (e.g. charge on Stripe, sending an email), and some operations are not idempotent" (Foreign state mutations)
- Once you change a foreign system you can't roll it back with your database. "once we make our first foreign state mutation, we’re committed one way or another" (Foreign state mutations)
- Writing to Kafka counts as a foreign call too. "They’re not, and should be treated like any other fallible foreign state mutation." (Between any two systems)
- Atomic phase: local changes in one transaction between foreign calls. "An atomic phase is a set of local state mutations that occur in transactions between foreign state mutations." (Atomic phases)
- A recovery point lets a retry jump back to just before the last failure. "Its purpose is to allow a request that’s being retried to jump back to the point in the lifecycle just before the last attempt failed." (Recovery points)
- Schema: key unique per user, with locked_at, request params, stored response code and body, and recovery_point. `CREATE UNIQUE INDEX idempotency_keys_user_id_idempotency_key ON idempotency_keys (user_id, idempotency_key);` (The idempotency key relation, code listing)
- locked_at marks a key being worked on. "locked_at: A field that indicates whether this idempotency key is actively being worked." (The idempotency key relation)
- Params are stored to reject the same key with different parameters. "This is stored mostly so that we can error if the user sends two requests with the same idempotency key but with different parameters" (The idempotency key relation)
- A locked key gets 409 Conflict. "If the key was already locked, return a 409 Conflict to indicate that to the user." (Idempotency key upsert)
- The upsert runs in a SERIALIZABLE transaction, so two requests can't both lock one key. "If two different transactions both try to lock any one key, one of them will be aborted by Postgres." (Idempotency key upsert)
- Two requests creating the same key at once: a UNIQUE constraint lets one win, the other gets 409. "A UNIQUE constraint in the database guarantees that only one request can succeed. One goes through, and the other gets a 409 Conflict." (Murphy in action)
- A completer pushes abandoned requests to completion. "Its only job is to find requests that look like they never finished to satisfaction and which it looks like clients have dropped, and push through to completion." (The completer)
- A reaper deletes old keys; suggests about 72 hours so a weekend bug can still be fixed and completed. "I’d suggest a threshold of about 72 hours" (The reaper)
- Requests that can't be finished or cleaned up go on a list for a human. "If cleanup is difficult or impossible, it should put them in a list somewhere so that a human can find out what failed." (The reaper)
- A server that dies while waiting on Stripe is safe because the Stripe call carried its own key. "Luckily, the call to Stripe was also made with its own idempotency key." (Murphy in action)
- With a non-idempotent foreign call, a timeout or reset must be marked failed. "Indeterminate errors like a connection reset or timeout will have to be marked as failed." (Complications)
- Not possible on a store without transactions. "It’s worth mentioning that none of this is possible on a non-ACID store like MongoDB." (Complications)
- Double form submission: a hidden field carries a key. "When rendering the form initially, we can add a <input type="hidden"> to it that contains an idempotency key." (Beyond APIs)
- Results are stored only once the request has definitely finished, by succeeding or failing unrecoverably. "Once the server knows that a request has definitively finished by either succeeding or failing in a way that’s not recoverable, it stores the request’s results and associates them with the idempotency key." (Idempotency with keys)
- The 72 hours covers a bug deployed on Friday and fixed on Monday. "so that even if a bug is deployed on Friday that errors a large number of valid requests, an app could still keep a record of them throughout the weekend and onto Monday" (The reaper)
- On an error the handler tries to unlock the key at once. "If we're leaving under an error condition, try to unlock the idempotency key right away so that another request can try again." (code listing, comment)
- The table has a created_at column. `created_at TIMESTAMPTZ NOT NULL DEFAULT now(),` (The idempotency key relation, code listing)

## Visuals worth redrawing

- The request lifecycle split into atomic phases (tx1 to tx4) around
  the foreign Stripe call, with recovery points started, ride_created,
  charge_created, finished.

## My notes

- The MongoDB claim is from 2017; MongoDB has had multi-document
  transactions since 4.0 (not checked here, so don't repeat the claim).
