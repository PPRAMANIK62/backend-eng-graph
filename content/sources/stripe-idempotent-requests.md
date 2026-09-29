---
id: stripe-idempotent-requests
title: Idempotent requests (Stripe API reference)
author: Stripe
url: https://docs.stripe.com/api/idempotent_requests
kind: docs
primary: true
---

## Summary

The Stripe API reference section on idempotency keys, as published when
this was written: what gets saved under a key, how long, which
requests accept keys, and what isn't saved.

## Key claims

- Use a key when creating or updating, then repeat safely after a connection error. "Then, if a connection error occurs, you can safely repeat the request without risk of creating a second object or performing the update twice." (Idempotent requests)
- Stripe saves the status code and body of the first request, success or failure, and replays it, 500s included. "Stripe’s idempotency works by saving the resulting status code and body of the first request made for any given idempotency key, regardless of whether it succeeds or fails. Subsequent requests with the same key return the same result, including 500 errors." (Idempotent requests)
- Keys should be V4 UUIDs or similar random strings. "we suggest using V4 UUIDs, or another random string with enough entropy to avoid collisions." (Idempotent requests)
- Keys are up to 255 characters. "Idempotency keys are up to 255 characters long." (Idempotent requests)
- Don't put sensitive data in keys. "Avoid using sensitive data (for example, email addresses or personal identifiers) as idempotency keys." (Idempotent requests)
- Keys may be pruned once they're at least 24 hours old; after that a reused key is a new request. "You can remove keys from the system automatically after they’re at least 24 hours old. We generate a new request if a key is reused after the original is pruned." (Idempotent requests)
- Incoming parameters are compared with the original's; a mismatch is an error. "The idempotency layer compares incoming parameters to those of the original request and errors if they’re not the same to prevent accidental misuse." (Idempotent requests)
- Results are saved only once an endpoint starts executing; validation failures and conflicts with a concurrent request aren't saved and can be retried. "If incoming parameters fail validation, or the request conflicts with another request that’s executing concurrently, we don’t save the idempotent result because no API endpoint initiates the execution." (Idempotent requests)
- All POST requests accept keys; GET and DELETE don't need them. "All POST requests accept idempotency keys. Don’t send idempotency keys in GET and DELETE requests because it has no effect. These requests are idempotent by definition." (Idempotent requests)

## Visuals worth redrawing

None.

## My notes

- "Including 500 errors" is a design choice worth pointing out: a retry
  with the same key won't get a second chance at a request that failed
  inside the endpoint. The client needs a new key for that.
