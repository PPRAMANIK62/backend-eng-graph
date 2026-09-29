---
id: netflix-hystrix-how-it-works
title: How it Works (Hystrix wiki)
author: Netflix (Hystrix authors)
url: https://github.com/Netflix/Hystrix/wiki/How-it-Works
kind: docs
primary: true
---

## Summary

The Hystrix wiki page on how a command runs: the circuit breaker's
open and close rules, and isolation with a thread pool per dependency
(or a semaphore). Written for Hystrix 1.5 by the Netflix team that
built it. Hystrix is now in maintenance mode (see
`netflix-hystrix-readme`).

## Key claims

- The breaker trips only if both the request volume and the error percentage cross their thresholds. "Assuming the volume across a circuit meets a certain threshold (HystrixCommandProperties.circuitBreakerRequestVolumeThreshold())..." (Circuit Breaker, step 1)
- Then it goes from closed to open and short-circuits every request. "While it is open, it short-circuits all requests made against that circuit-breaker." (Circuit Breaker, step 4)
- After the sleep window one request is let through (half-open); its result decides. "After some amount of time (HystrixCommandProperties.circuitBreakerSleepWindowInMilliseconds()), the next single request is let through (this is the HALF-OPEN state)." (Circuit Breaker, step 5)
- Hystrix uses bulkheads to isolate dependencies. "Hystrix employs the bulkhead pattern to isolate dependencies from each other and to limit concurrent access to any one of them." (Isolation)
- A thread pool per dependency, so a slow one fills only its own pool. "Hystrix uses separate, per-dependency thread pools as a way of constraining any given dependency so latency on the underlying executions will saturate the available threads only in that pool." (Threads & Thread Pools)
- Running on a separate thread lets the caller walk away from a slow call. "This isolates them from the calling thread (Tomcat thread pool) so that the caller may “walk away” from a dependency call that is taking too long." (Threads & Thread Pools)
- Why threads: many client libraries, owned by other teams, that change and hide their behaviour. "Client libraries tend to be “black boxes” — opaque to their users about implementation details, network access patterns, configuration defaults, etc." (Threads & Thread Pools)
- A full pool for one library doesn't hurt the rest. "The pool for a given dependency library can fill up without impacting the rest of the application." (Benefits of Thread Pools)
- The client code still needs its own timeouts. "Note: Despite the isolation a separate thread provides, your underlying client code should also have timeouts and/or respond to Thread interrupts so it can not block indefinitely and saturate the Hystrix thread pool." (Benefits of Thread Pools)
- The cost of a thread per call: queueing, scheduling and context switching. "Each command execution involves the queueing, scheduling, and context switching involved in running a command on a separate thread." (Drawbacks of Thread Pools)
- Netflix's scale: 40+ pools per API instance, 5 to 20 threads each, most set to 10. "Each API instance has 40+ thread-pools with 5–20 threads in each (most are set to 10)." (Cost of Threads)
- Measured thread overhead for one command at 60 requests a second: none at the median, 3 ms at p90, 9 ms at p99. "At the 99^(th) percentile there is a cost of 9ms for having a separate thread." (Cost of Threads)
- Semaphores limit concurrency without a thread, but can't time out the call. "This allows Hystrix to shed load without using thread pools but it does not allow for timing out and walking away." (Semaphores)
- With a semaphore, a slow dependency still blocks the callers' own threads. "Note: if a dependency is isolated with a semaphore and then becomes latent, the parent threads will remain blocked until the underlying network calls timeout." (Semaphores)

## Visuals worth redrawing

- The request flow through a command and its breaker (flow chart).
- The per-dependency thread pools diagram (one Tomcat pool fanning out
  to separate pools per dependency).

## My notes

- The p90/p99 overhead numbers are from Netflix's own production
  instance, as shown on the page; no setup beyond "single API instance".
