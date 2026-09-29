---
id: stripe-idempotency-2017
title: Designing robust and predictable APIs with idempotency
author: Brandur Leach, Stripe
url: https://stripe.com/blog/idempotency
kind: blog
primary: true
---

## Summary

Stripe's 2017 post on why clients of an API over an unreliable network
need to retry, why retries need idempotent endpoints, how Stripe's
Idempotency-Key header makes POST requests safe to retry, and why
retries should use exponential backoff with jitter.

## Key claims

- Three ways a call between two nodes can fail. "The initial connection could fail as the client tries to connect to a server." / "The call could fail midway while the server is fulfilling the operation, leaving the work in limbo." / "The call could succeed, but the connection break before the server can tell its client about it." (Planning for failure)
- A connection failure is clearly safe to retry; a connection cut mid-exchange is ambiguous. "A connection terminating midway through message exchange is an example of this case." (Planning for failure)
- Two computers passing messages is already a distributed system. "as few as two computers connecting via a network that are passing each other messages." (Planning for failure)
- Idempotent endpoints: called any number of times, side effects once. "which means that they can be called any number of times while guaranteeing that side effects only occur once." (Making liberal use of idempotency)
- With idempotent endpoints, the client can retry any error until it succeeds. "When a client sees any kind of error, it can ensure the convergence of its own state with the server’s by retrying, and can continue to retry until it verifiably succeeds." (Making liberal use of idempotency)
- Example: a PUT that creates a DNS record is safe to repeat; a duplicate is ignored and answered with success. "If the server receives a call that it realizes is a duplicate because the domain already exists, it simply ignores the request and responds with a successful status code." (Making liberal use of idempotency)
- Charging money twice is the case that needs more. "accidentally calling it twice would lead to the customer being double-charged, which is very bad." (Guaranteeing “exactly once” semantics)
- Idempotency key: the client makes a unique ID per operation and sends it along. "When performing a request, a client generates a unique ID to identify just that operation and sends it up to the server along with the normal payload." (Guaranteeing “exactly once” semantics)
- Failure midway: if an ACID database rolled the work back, retry it whole; otherwise recover state and continue. "if the previous operation was successfully rolled back by way of an ACID database, it’ll be safe to retry it wholesale." (Guaranteeing “exactly once” semantics)
- Response lost: the server replies with the cached result. "the server simply replies with a cached result of the successful operation." (Guaranteeing “exactly once” semantics)
- Stripe accepts keys on mutating (POST) endpoints through the Idempotency-Key header. "The Stripe API implements idempotency keys on mutating endpoints (i.e. anything under POST in our case) by allowing clients to pass a unique value in with the special Idempotency-Key header" (Guaranteeing “exactly once” semantics)
- Retries against a server in hard downtime can make things worse. "Not only will retries of the operation not go through, but they may contribute to further degradation." (Being a good distributed citizen)
- Exponential backoff: wait proportional to 2^n after n failures. "it waits proportionally to 2^n, where n is the number of failures that have occurred." (Being a good distributed citizen)
- Without randomness, clients that failed together retry together: the thundering herd. "This is known as the thundering herd problem." (Being a good distributed citizen)
- Jitter spaces requests out. "We can address thundering herd by adding some amount of random “jitter” to each client’s wait time." (Being a good distributed citizen)
- Stripe's Ruby library retries automatically with an idempotency key, backoff and jitter. "The Stripe Ruby library retries on failure automatically with an idempotency key using increasing backoff times and jitter." (Being a good distributed citizen)

## Visuals worth redrawing

- The three failure points of a call (before the server, during, after
  the response is sent). Redrawn as a sequence diagram.

## My notes

- The heading says "exactly once" but the mechanism is at-least-once
  retries plus server-side deduplication. See treat-exactly-once-2015.
