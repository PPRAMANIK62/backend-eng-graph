---
id: fowler-circuit-breaker-2014
title: CircuitBreaker
author: Martin Fowler
url: https://martinfowler.com/bliki/CircuitBreaker.html
kind: blog
primary: false
---

## Summary

Martin Fowler's short explanation of the circuit breaker pattern (2014),
with a small Ruby implementation that grows from two states (closed and
open) to three (adding half open). He credits Michael Nygard's book
*Release It!* with making the pattern popular.

## Key claims

- The problem: remote calls can hang, and many callers waiting on one unresponsive supplier run out of resources. "What's worse if you have many callers on a unresponsive supplier, then you can run out of critical resources leading to cascading failures across multiple systems." (opening)
- Nygard's book popularised the pattern. "In his excellent book Release It, Michael Nygard popularized the Circuit Breaker pattern to prevent this kind of catastrophic cascade." (opening)
- The basic idea: count failures, trip at a threshold, then fail without making the call. "Once the failures reach a certain threshold, the circuit breaker trips, and all further calls to the circuit breaker return with an error, without the protected call being made at all." (opening)
- You'll usually want an alert when it trips. "Usually you'll also want some kind of monitor alert if the circuit breaker trips." (opening)
- The example uses a failure threshold of 5 and counts timeouts; a success resets the count. "Should we get a timeout, we increment the failure counter, successful calls reset it back to zero." (example)
- A breaker can reset itself by trying the call again after an interval. "We can implement this self-resetting behavior by trying the protected call again after a suitable interval, and resetting the breaker should it succeed." (self-resetting)
- Half open is the third state, a trial call. "There is now a third state present - half open - meaning the circuit is ready to make a real call as trial to see if the problem is fixed." (self-resetting)
- A trial call either resets the breaker or restarts the timeout. "Asked to call in the half-open state results in a trial call, which will either reset the breaker if successful or restart the timeout if not." (self-resetting)
- Not every error should count. "Not all errors should trip the circuit, some should reflect normal failures and be dealt with as part of regular logic." (after the example)
- Error rate instead of a count, and different thresholds per error type. "A more sophisticated approach might look at frequency of errors, tripping once you get, say, a 50% failure rate." (after the example)
- A breaker can trip when a thread pool is exhausted. "By drawing these threads from a thread pool, you can arrange for the circuit to break when the thread pool is exhausted." (after the example)
- For asynchronous work, the breaker can trip when a queue fills. "In this case the circuit breaks when the queue fills up." (after the example)
- Two benefits: no waiting on timeouts, and no load on a struggling server. "You avoid waiting on timeouts for the client, and a broken circuit avoids putting load on a struggling server." (after the example)
- Log state changes and let operators trip or reset. "Operations staff should be able to trip or reset breakers." (after the example)
- Clients must decide what to do when the breaker refuses. "A credit card authorization could be put on a queue to deal with later, failure to get some data may be mitigated by showing some stale data that's good enough to display." (after the example)
- The name is borrowed from electrical breakers in buildings. "This is a reasonable approach with electrical circuit breakers in buildings, but for software circuit breakers we can have the breaker itself detect if the underlying calls are working again." (self-resetting)

## Visuals worth redrawing

- The two state diagrams: closed/open, then closed/open/half-open with
  the reset timeout.

## My notes

- Nygard's book not opened; don't cite it.
