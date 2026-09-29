---
id: netflix-hystrix-configuration
title: Configuration (Hystrix wiki)
author: Netflix (Hystrix authors)
url: https://github.com/Netflix/Hystrix/wiki/Configuration
kind: docs
primary: true
---

## Summary

The Hystrix wiki's reference for every command and thread-pool
property, with defaults (Hystrix 1.5). Read for the circuit breaker
defaults and the thread vs semaphore isolation setting.

## Key claims

- Two isolation strategies: a thread from a pool, or the caller's thread limited by a semaphore. "THREAD — it executes on a separate thread and concurrent requests are limited by the number of threads in the thread-pool" (execution.isolation.strategy)
- Thread isolation is the default for HystrixCommand. "The default, and the recommended setting, is to run HystrixCommands using thread isolation (THREAD) and HystrixObservableCommands using semaphore isolation (SEMAPHORE)." (execution.isolation.strategy)
- Semaphores are for very high-volume, usually non-network calls. "Generally the only time you should use semaphore isolation for HystrixCommands is when the call is so high volume (hundreds per second, per instance) that the overhead of separate threads is too high; this typically only applies to non-network calls." (execution.isolation.strategy)
- Default command timeout: 1,000 ms. (execution.isolation.thread.timeoutInMilliseconds, Default Value 1000)
- Minimum volume before tripping, default 20: 19 failures out of 19 don't trip. "For example, if the value is 20, then if only 19 requests are received in the rolling window (say a window of 10 seconds) the circuit will not trip open even if all 19 failed." (circuitBreaker.requestVolumeThreshold)
- Sleep window before trying again, default 5,000 ms. "This property sets the amount of time, after tripping the circuit, to reject requests before allowing attempts again to determine if the circuit should again be closed." (circuitBreaker.sleepWindowInMilliseconds, Default Value 5000)
- Error percentage to trip, default 50. "This property sets the error percentage at or above which the circuit should trip open and start short-circuiting requests to fallback logic." (circuitBreaker.errorThresholdPercentage, Default Value 50)
- Default thread pool size per dependency: 10. (coreSize, Default Value 10)

## Visuals worth redrawing

None.

## My notes

- Defaults are Hystrix's, not universal; resilience4j's are different
  (see `resilience4j-circuitbreaker`).
