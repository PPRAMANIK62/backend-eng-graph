---
id: brooker-retries-token-buckets-2022
title: Fixing retries with token buckets and circuit breakers
author: Marc Brooker
url: https://brooker.co.za/blog/2022/02/28/retries.html
kind: blog
primary: false
---

## Summary

A follow-up post (2022) that simulates four retry strategies against a
service failing at a set rate: no retries, N retries, a retry token
bucket, and a circuit breaker that only stops retries. It compares the
success rate clients see with the load the server gets, and shows how
the number of clients changes the result.

## Key claims

- The token bucket strategy: successes add part of a token, retries spend whole tokens. "If it succeeds, it drops part of a token into a limited-size token bucket. If the call fails, retry up to N times as long as there are (whole) tokens in the bucket." (the players)
- Example numbers. "For example, each success could deposit 0.1 tokens, and each retry could consume 1 token." (the players)
- The retry breaker: retry only while the recent failure rate is below a threshold. "If that failure rate is below a threshold, it retries up to N times. If it’s above the threshold, it doesn’t retry at all." (the players)
- N retries at 100% failure does 1+N times the work. "At 100% failure rate, the system does 1+N times as much work." (Think it through)
- The bucket acts like N retries at low failure rates and like a fraction of a retry at high ones. "For example, if each successful calls puts 10% of a token into the bucket, adaptive behaves like N retries a lot below 10% failure rate, and like “0.1 retries” much above 10% failure rate." (Think it through)
- Simulation setup: one service failing calls at random, 100 independent clients. "The service is called by 100 independent clients, each starting new attempts at some rate¹." (Simulating Performance)
- The retry breaker tripped at about half the expected failure rate, because each client decides on its own. "The first interesting observation is that the breaker strategy starts tripping a little early: around half the expected rate. That’s because each client is breaking independently." (Simulating Performance)
- Many small clients estimate the failure rate badly. "With larger numbers of clients sending small volumes of traffic, estimates will vary more widely." (The effect of client count)
- With many clients the breaker trips too early and the bucket drains too slowly. "The circuit breaker strategy is tripping too early, and approaching the performance of the no retries approach. The token bucket strategy (starting with a full bucket) doesn’t deplete its bucket fast enough, converging on the behavior of n retries." (The effect of client count)
- The client-count simulation keeps total traffic fixed and splits it among 10, 100 and 1,000 clients. "Here, we’ve got the same total number of requests divided among 10, 100, and 1000 clients" (The effect of client count)
- Shared state between clients would change the results, but costs complexity. "A model with state shared between clients would change these results, but also significantly increase the complexity of the system (because clients would need to discover and talk to each other)." (The effect of client count)
- The retry breaker adds no load at high failure rates. "The circuit breaker approach gives no additional load at high failure rates, which is great." (Which one is better?)
- The breaker is modal; the bucket isn't, but adds some load at high failure rates. "The adaptive strategy isn’t modal in the same way, and seems to perform better at lower failure rates, but does give some (tunable) additional load at higher rates." (Which one is better?)

## Visuals worth redrawing

- Success rate and server load against failure rate for the four
  strategies (the numbers are the simulation's; no table given).

## My notes

- A simulation, not production data; the post gives the model
  (Poisson arrivals, no overload modelled) but no numeric table.
