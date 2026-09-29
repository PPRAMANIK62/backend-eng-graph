---
id: brandur-rate-limiting-gcra-2015
title: Rate Limiting, Cells, and GCRA
author: Brandur Leach
url: https://brandur.org/rate-limiting
kind: blog
primary: true
---

## Summary

A 2015 post by an engineer who maintains the Go rate-limiting library
Throttled (used at Stripe). It goes from a naive expiring counter, to the
leaky bucket, to GCRA, a leaky bucket that stores one timestamp per key
and needs no background "drip".

## Key claims

- Uses of rate limiting: sharing limited resources, security (password and second-factor attempts), and revenue tiers. (intro list)
- A naive expiring bucket lets a buggy script burn the whole limit at once and then locks the user out. "it allows a buggy or rogue script to burn an account's entire rate limit immediately, and force them to wait for the bucket's expiry to get access back." (Time bucketed, Downsides)
- It also forces the server to absorb bursts each time the window resets. "In this scenario the server always needs enough extra capacity to handle these short intense bursts and which will likely go to waste during the rest of the hour." (Time bucketed, Downsides)
- Leaky bucket: a bucket of capacity τ leaking at rate T; actions add water, and are refused when it's full. "Actions are disallowed if the bucket is full." (Leaky bucket)
- The naive leaky bucket needs a background process to drain buckets, which can fall behind. "The naive leaky bucket's greatest weakness is its “drip” process." (Leaky bucket, Downsides)
- GCRA comes from ATM networks. "GCRA was the algorithm recommended by the ATM Forum for use in an ATM network's scheduler so that it could either delay or drop cells that came in over their rate limit." (GCRA)
- If the drip process stops or falls behind, requests get refused wrongly. "If it goes offline or gets to a capacity limit where it can’t drip all the buckets that need to be dripped, then new incoming requests might be limited incorrectly." (Leaky bucket, Downsides)
- ATM cells are small fixed-size packets. "encoded data into small packets of fixed size called “cells”" (GCRA)
- GCRA tracks a "theoretical arrival time" (TAT) and compares it with now. "GCRA works by tracking remaining limit through a time called the “theoretical arrival time” (TAT)" (GCRA)
- Allowed if TAT minus the burst allowance is in the past; otherwise refused. "If it's in the past, we allow the incoming request, and if it's in the future, we don't." (GCRA)
- Clocks matter when several machines share the limit; use the store's clock. "Clock drift between machines could throw off the algorithm and lead to false positives (i.e. users locked out of their accounts)." (GCRA)
- Use the store's clock to avoid drift between machines. "One easy strategy here is to use the store’s time for synchronization (for example, by accessing the TIME command in Redis)." (GCRA)

## Visuals worth redrawing

- The two GCRA timelines (allowed and denied request, with TAT,
  τ + T and t₀ marked). Redrawn in `rate-limiting-algorithms`.

## My notes

- His GitHub example (5,000 per hour and an hour-long lockout) was
  GitHub's API in 2015; don't present it as current.
- The exact arithmetic is clearer in the Throttled source
  (`throttled-rate-go`).
