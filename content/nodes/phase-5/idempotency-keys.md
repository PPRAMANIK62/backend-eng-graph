---
id: idempotency-keys
title: Idempotency keys
depth: deep
phase: 5
note: >-
  The client sends a unique key, and the server stores the result under
  it, including for a duplicate that arrives while the first is still
  running.
needs: [idempotency]
leads_to: [durable-execution, long-running-operations]
compare_with: [idempotent-producers, transactional-outbox, exactly-once-processing]
---

# Idempotency keys

An idempotency key is a unique ID the client makes up for one operation
and sends with every attempt at it. The server records what happened
under that key, and when the same key comes back it answers from the
record instead of doing the work again. It's how you make a `POST` that
charges a card or creates a server safe to retry, which HTTP alone
doesn't give you.

## One charge, four requests

[[idempotency|Idempotency]] means a repeated request has the same
effect as the first. `PUT` and `DELETE` get that from what they mean.
`POST /charges` doesn't: every call is a new charge. The fix is to give
the operation a name.

Before the first attempt, the client generates a random ID, usually a
UUID, and sends it in a header:

```
POST /charges
Idempotency-Key: "8e03978e-40d5-43e8-bc93-6894a57f9324"
```

Then this can happen:

![Sequence diagram between a client and a server that keeps a table of keys. Request 1 with key k1 arrives; the server inserts k1 as locked and starts the charge. The client times out and sends request 2 with k1 while the first is still running; the server sees k1 is locked and answers 409 Conflict. The first request finishes, the server stores 201 and the response body under k1, but that response is lost. The client sends request 3 with k1; the server finds k1 finished and returns the stored 201 without charging again.](img/idempotency-keys-sequence.svg)

*One key, three attempts, one charge. Our own drawing, following the flow in the IETF Idempotency-Key draft and Brandur Leach's Postgres design.*

1. **First attempt.** The server has never seen the key. It records it
   as "in progress", runs the charge, and stores the response under the
   key.
2. **A retry while the first is still running.** The key exists and is
   marked in progress. The server can't return a result it doesn't
   have yet, and it mustn't start a second charge. It answers
   `409 Conflict`: try again later.
3. **The first response is lost.** The charge happened; the client
   doesn't know.
4. **A retry after it finished.** The server finds the key with a
   stored response and sends that back. No second charge.

The same idea goes by other names. EC2 calls it a `ClientToken`, and
the AWS SDKs make one up for you when you don't pass one, then reuse it
on their own retries. Stripe accepts an `Idempotency-Key` header on
every `POST`. An IETF draft (version 07, 2025) proposes making
`Idempotency-Key` a standard HTTP header, and lists payment APIs such as
Stripe, Adyen and WorldPay that already use it.

## What the server stores

A row per key, roughly:

| Field | Why |
|---|---|
| the key, scoped to the account | so two customers can use the same key without clashing |
| the request's parameters, or a hash of them | to catch the same key sent with a different request |
| a lock or "in progress" mark | so only one request works on a key at a time |
| how far the work got | so a retry can resume after a crash |
| the response status and body | to replay to later retries |
| when it was created | to delete old keys |

The key alone isn't enough to look up. If it were global, one client
could send another client's key and read back their stored response.
Scope it to the account, or to something else the server knows about
the caller, and put a unique index on the pair.

## The duplicate that arrives while the first is running

This is the case that makes idempotency keys harder than a cache of
responses. Two copies of a request can arrive close together: a client
with a short timeout, a user who double-clicks, a client library that
retries on its own.
If both check "have I seen this key?" before either has written it,
both see "no", and both charge the card.

So the "seen it" check and the claim have to be one atomic step. With a
database, that's an insert under a unique constraint, or a
[[transaction]] strict enough that two of them can't both take the key:
one wins, the other gets a conflict and answers `409`. The IETF draft
suggests `409` for exactly this case. Stripe doesn't store anything for
a request that lost this race, so the client can simply retry it.

## Same key, different request

A key names one operation. If a client reuses a key with a different
amount, it's almost certainly a bug, and replaying the old response
would hide it. Every design compares the new request with the stored
one and refuses a mismatch: Stripe returns an error, EC2 a validation
error, and the IETF draft suggests `422`. The draft also allows a
"fingerprint", such as a checksum of the body, instead of storing every
parameter.

## Which result to store

Here the designs differ.

**Store the first result, whatever it was.** Stripe saves the status
and body of the first request once the endpoint starts running, success
or failure, and replays them, `500` errors included. Requests that fail
validation, or lose the race above, aren't saved, since no work
started.

**Store only final results, and resume the rest.** Brandur Leach's
Postgres design, written while he worked at Stripe, stores a response
only when the request has definitely finished, by succeeding or by
failing in a way a retry can't fix. Until then, the row records how far
the request got. The handler is split into steps: local database
changes grouped into transactions, and each call to another system on
its own. After each step the row gets a new "recovery point". A retry
jumps to the last recovery point instead of starting over. The call to
the payment provider carries its own idempotency key, so even if the
server died waiting for it, redoing that step can't charge twice. A
background "completer" finishes requests whose clients gave up.

**Return the same meaning, not the same bytes.** EC2 answers every
retry with the same instance, in its current state. A retry a few
minutes later says "running" where the first said "pending".

## How long to keep keys

Keys are for recovering from recent failures, not an archive:

- Stripe may delete a key once it's at least 24 hours old. After that,
  the same key is treated as a new request.
- Brandur's design suggests about 72 hours, so requests broken by a
  bug deployed on a Friday can still be completed after a fix on
  Monday.
- EC2 keeps a token for the life of the instance plus a margin for
  late retries.
- The IETF draft leaves it to the server, but asks that the policy be
  published.

## Where it gets tricky

**The client has to get it right too.** The key must be created once
per operation, before the first attempt, and reused on every retry. A
client that makes a fresh key per attempt has no protection at all.
The same goes for forms: a web page can put a key in a hidden field
when it renders the form, so a double-click on "Submit" sends the same
key twice.

**Keys must be hard to guess.** Use a UUID or another random value.
With guessable keys and a lookup that isn't scoped to the caller, an
attacker can fetch other clients' stored responses. Don't build keys
from personal data such as email addresses either.

**Replaying failures has a cost.** If the server stores a `500` and
replays it, a retry with the same key can never succeed. That's
consistent, but the client needs to know it, and needs a new key to
try again. An API should document which results it stores.

**It's still a draft.** When this was written, the IETF draft (version
07) had expired without becoming an RFC. The header name is common, but
status codes, expiry and what gets stored all vary by API. Read each
provider's docs.

**Recording the key and doing the work must commit together.** If they
can't, the key can be saved while the work is lost, or the work done
while the key is lost. This needs a store with transactions.

**A lock needs a way out.** A process can die while holding a key's
lock. Brandur's design stores when the lock was taken, and tries to
release it on errors, but a crashed process releases nothing. How long
to wait before another request may take over is a choice each
implementation has to make, and the sources here don't settle it.

## What this means when you build

- Accept an idempotency key on every endpoint that creates or charges
  something, and say in your docs how long you keep keys.
- Scope keys to the caller and put a unique constraint on
  (caller, key).
- Claim the key atomically, and answer `409` to a duplicate that
  arrives while the first is running.
- Store the request's parameters and reject a reused key with
  different ones.
- When your handler calls another system, pass a key to that system
  too.
- On the client, generate the key once and reuse it for every retry.
- Message brokers solve the same problem for producers with sequence
  numbers; see [[idempotent-producers]]. Workflow engines take the
  "record each step and resume" idea much further; see
  [[durable-execution]].

## Further reading

- [The Idempotency-Key HTTP Header Field](https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-idempotency-key-header-07), Jayadeba Jena, Sanjay Dalal, IETF HTTPAPI working group, draft 07, 2025. The proposed header, the responses for duplicates, conflicts and mismatches, and the security notes.
- [Idempotent requests](https://docs.stripe.com/api/idempotent_requests), Stripe API reference. What Stripe stores under a key, for how long, and what it doesn't store.
- [Implementing Stripe-like Idempotency Keys in Postgres](https://brandur.org/idempotency-keys), Brandur Leach, 2017. A full design: the table, locking, recovery points, and the completer and reaper processes.
- [Making retries safe with idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/), Malcolm Featonby, Amazon Builders' Library. EC2's ClientToken, equivalent responses, late retries and how long tokens live.
