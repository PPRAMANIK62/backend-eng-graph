---
id: stripe-rate-limiters-2017
title: Scaling your API with rate limiters
author: Paul Tarjan, Stripe
url: https://stripe.com/blog/rate-limiters
kind: blog
primary: true
---

## Summary

Stripe's engineering post (2017) on the four limiters it runs in front
of its API: a per-user request rate limiter, a per-user concurrency
limiter, and two load shedders that look at the whole system. Also how
it implements them (token bucket in Redis) and how to roll them out
safely.

## Key claims

- Why limit: one user's spike, runaway scripts, low-priority traffic crowding out important traffic, and internal trouble. "One of your users has a misbehaving script which is accidentally sending you a lot of requests." (intro list)
- A rate limiter only fits when clients can slow down without changing the result. "If your users can afford to change the pace at which they hit your API endpoints without affecting the outcome of their requests, then a rate limiter is appropriate." (Rate limiters and load shedders)
- A load shedder decides from the state of the whole system, not the user. "A load shedder makes its decisions based on the whole state of the system rather than the user who is making the request." (Rate limiters and load shedders)
- The request rate limiter (N requests per second per user) is the one to build first. "This rate limiter restricts each user to N requests per second." (Request rate limiter)
- It allows short bursts above the cap. "we added the ability to briefly burst above the cap for sudden spikes in usage during real-time events (e.g. a flash sale.)" (Request rate limiter)
- The concurrent request limiter caps requests in flight, not per second. "You can only have 20 API requests in progress at the same time" (Concurrent requests limiter)
- Retries pile onto slow endpoints, which the concurrency limit stops. "These retries add more demand to the already overloaded resource, slowing things down even more." (Concurrent requests limiter)
- The fleet usage load shedder reserves a share for critical requests and rejects the rest with 503. "If our reservation number is 20%, then any non-critical request over their 80% allocation would be rejected with status code 503." (Fleet usage load shedder)
- Algorithm: a token bucket per user. "We use the token bucket algorithm to do rate limiting." (Building rate limiters in practice)
- "In our case, every Stripe user has a bucket, and every time they make a request we remove a token from that bucket." (Building rate limiters in practice)
- Implemented in Redis. "We implement our rate limiters using Redis." (Building rate limiters in practice)
- Fail open: a broken limiter must not take the API down. "This means catching exceptions at all levels so that any coding or operational errors would fail open and the API would still stay functional." (Building rate limiters in practice)
- Choose between 429 and 503, and make the message actionable. "In practice, you should decide if you want HTTP 429 (Too Many Requests) or HTTP 503 (Service Unavailable) and what is the most accurate depending on the situation." (Building rate limiters in practice)
- The request rate limiter fires all the time. "Our rate limits for requests is constantly triggered." (Request rate limiter)
- The concurrency limiter protects the most expensive endpoints. "Before we started using a concurrent requests limiter, we regularly dealt with resource contention on our most expensive endpoints caused by users making too many requests at one time." (Concurrent requests limiter)
- Critical vs non-critical examples. "critical API methods (e.g. creating charges) and non-critical methods (e.g. listing charges.)" (Fleet usage load shedder)
- Load shedders fire rarely, during incidents. "This one gets triggered very rarely, only during major incidents." (Worker utilization load shedder)
- Error messages should be actionable. "The message you return should also be actionable." (Building rate limiters in practice)
- Kill switches and dark launches. "Dark launch each rate limiter to watch the traffic they would block." (Building rate limiters in practice)

## Visuals worth redrawing

- The post's diagrams of each limiter (buckets per user, a pie of
  critical vs non-critical capacity) could be redrawn, but the article
  doesn't need them.

## My notes

- The monthly counts in the post ("millions", "12,000", "100") are for
  one month at Stripe when it was written; not useful as numbers.
