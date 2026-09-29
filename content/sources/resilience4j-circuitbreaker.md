---
id: resilience4j-circuitbreaker
title: CircuitBreaker (resilience4j docs)
author: resilience4j authors
url: https://resilience4j.readme.io/docs/circuitbreaker
kind: docs
primary: true
---

## Summary

The resilience4j docs for its circuit breaker, a Java library that
followed Hystrix. How the state machine works, the sliding windows it
measures with, the slow-call rule, and every setting with its default.

## Key claims

- Three normal states and three special ones. "The CircuitBreaker is implemented via a finite state machine with three normal states: CLOSED, OPEN and HALF_OPEN and three special states METRICS_ONLY, DISABLED and FORCED_OPEN." (Introduction)
- Outcomes go into a count-based or time-based sliding window. "The count-based sliding window aggregrates the outcome of the last N calls. The time-based sliding window aggregrates the outcome of the calls of the last N seconds." (Introduction)
- It opens when the failure rate reaches a threshold. "The state of the CircuitBreaker changes from CLOSED to OPEN when the failure rate is equal or greater than a configurable threshold." (Failure rate and slow call rate thresholds)
- By default every exception counts as a failure; you can choose which count and which are ignored. "By default all exceptions count as a failure." (Failure rate and slow call rate thresholds)
- It can also open on slow calls, before the dependency stops answering. "This helps to reduce the load on an external system before it is actually unresponsive." (Failure rate and slow call rate thresholds)
- Nothing is decided below a minimum number of calls. "If only 9 calls have been evaluated the CircuitBreaker will not trip open even if all 9 calls have failed." (Failure rate and slow call rate thresholds)
- When open it rejects calls; after a wait it goes half-open and lets a set number through. "After a wait time duration has elapsed, the CircuitBreaker state changes from OPEN to HALF_OPEN and permits a configurable number of calls to see if the backend is still unavailable or has become available again." (Failure rate and slow call rate thresholds)
- The half-open calls decide: above the threshold it reopens, below it closes. "If the failure rate and slow call rate is below the threshold, the state changes back to CLOSED." (Failure rate and slow call rate thresholds)
- The breaker doesn't limit concurrency; use a bulkhead for that. "If you want to restrict the number of concurrent threads, please use a Bulkhead." (thread safety)
- Defaults: failure rate threshold 50%, sliding window 100 calls, minimum 100 calls, 60,000 ms in open, 10 permitted calls in half-open, slow call duration 60,000 ms with a slow-call rate threshold of 100%. (Create and configure a CircuitBreaker, table)
- Open to half-open happens only on the next call unless automatic transition is on. "Whereas, if set to false the transition to HALF_OPEN only happens if a call is made, even after waitDurationInOpenState is passed." (automaticTransitionFromOpenToHalfOpenEnabled)
- METRICS_ONLY records like CLOSED but never opens. "similar to CLOSED state but the only difference being, the circuit does not open when any of the thresholds are breached." (Introduction)

## Visuals worth redrawing

- The state machine image (closed, open, half-open with the special
  states).

## My notes

- Hystrix waits for 20 requests and opens at 50%; resilience4j waits
  for 100 calls by default. Defaults differ a lot between libraries.
