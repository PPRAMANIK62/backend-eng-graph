---
id: azure-circuit-breaker-pattern
title: Circuit Breaker pattern (Azure Architecture Center)
author: Microsoft
url: https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker
kind: docs
primary: false
---

## Summary

Microsoft's write-up of the circuit breaker as a design pattern: the
three states, what each counter does, and a long list of things to get
right (which errors count, recovery timing, shards, manual override).
Not a library, so not primary for any implementation.

## Key claims

- A breaker fails fast on operations likely to fail, and notices when they work again. "The Circuit Breaker pattern helps prevent an application from repeatedly trying to run an operation that's likely to fail." (Solution)
- It's different from retry, and retries should stop when the breaker says so. "However, the retry logic should be sensitive to any exceptions that the circuit breaker returns and stop retry attempts if the circuit breaker indicates that a fault isn't transient." (Solution, note)
- Closed: calls go through and recent failures are counted; past a threshold in a time period, it opens and starts a timer. "If the number of recent failures exceeds a specified threshold within a given time period, the proxy is placed into the Open state and starts a time-out timer." (Solution, Closed)
- Open: calls fail at once. "Open: The request from the application fails immediately and an exception is returned to the application." (Solution)
- Half-Open: a limited number of calls go through; any failure reopens it. "Half-Open: A limited number of requests from the application are allowed to pass through and invoke the operation." (Solution)
- Half-open protects a recovering service from a flood. "The Half-Open state helps prevent a recovering service from suddenly being flooded with requests." (Solution, note)
- The closed-state failure counter resets on a schedule, so occasional failures don't trip it. "The failure counter for the Closed state is time based. It automatically resets at periodic intervals." (Solution)
- Back to closed after a number of consecutive successes. "The circuit breaker reverts to the Closed state after a specified number of successful, consecutive operation invocations." (Solution)
- The open timeout can grow, from seconds to minutes. "For example, you can apply an increasing time-out timer to a circuit breaker." (Solution)
- The open state can return a default value instead of an error. "In some cases, rather than returning a failure and raising an exception, the Open state can return a default value that's meaningful to the application." (Solution)
- Different errors, different thresholds: more timeouts than "unavailable" errors before tripping. "For example, it might require a larger number of time-out exceptions to trigger the circuit breaker to the Open state compared to the number of failures caused by the unavailable service." (Problems and considerations, Types of exceptions)
- Opening to half-open too quickly makes it flap. "Similarly, a circuit breaker can fluctuate and reduce the response times of applications if it switches from the Open state to the Half-Open state too quickly." (Problems and considerations, Recoverability)
- Instead of a timer, the breaker can ping the service or a health endpoint. "In the Open state, rather than using a timer to determine when to switch to the Half-Open state, a circuit breaker can periodically ping the remote service or resource to determine whether it's available." (Problems and considerations, Failed operations testing)
- One breaker over several shards can block healthy shards. "Be careful when you use a single circuit breaker for one type of resource if there might be multiple underlying independent providers." (Problems and considerations, Resource differentiation)
- An error response can trip it immediately (accelerated breaking). "Sometimes a failure response can contain enough information for the circuit breaker to trip immediately and stay tripped for a minimum amount of time." (Problems and considerations, Accelerated circuit breaking)
- Long timeouts undercut the breaker: threads stay blocked before it notices. "If the time-out is too long, a thread that runs a circuit breaker might be blocked for an extended period before the circuit breaker indicates that the operation failed." (Problems and considerations, Inappropriate time-outs)
- Not useful when the platform already handles it. "Failure recovery is managed at the infrastructure or platform level, such as with health checks in global load balancers or service meshes." (When to use this pattern)
- Example of accelerated breaking: an overloaded resource says to try again in a few minutes, e.g. with 429 or 503. "the error response from a shared resource that's overloaded can indicate that the application should instead try again in a few minutes, instead of immediately retrying." / "A service can return HTTP 429 (too many requests) if it's throttling the client or HTTP 503 (service unavailable) if the service isn't available." (Problems and considerations, Accelerated circuit breaking)

## Visuals worth redrawing

- The state diagram with counters per state (closed: failure counter,
  half-open: success counter, open: timer).

## My notes

- The page also talks about AI-tuned thresholds; not used.
