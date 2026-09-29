---
id: brooker-open-closed-2023
title: Open and Closed, Omission and Collapse
author: Marc Brooker
url: https://brooker.co.za/blog/2023/05/10/open-closed.html
kind: blog
primary: false
---

## Summary

A 2023 post by an AWS engineer building on Schroeder et al. A small
simulation of one server with an unbounded queue shows that open
arrivals give a much longer tail than closed ones at the same
utilization, that a closed benchmark can badly underestimate p99 (the
coordinated omission problem), and that timeouts plus retries can turn
a stable open system into one whose queue grows without bound.

## Key claims

- Simulation setup. "the server latency is exponentially distributed with a mean of 0.1ms" (Some Examples), at "the server is busy 80% of the time" (Some Examples)
- The open tail is longer. "the tail is much longer for the open case than the closed one." (Some Examples)
- The bimodal server. "one that with an average response time of 0.1ms 99.9% of the time, and 10ms 0.1% of the time." (Some Examples)
- Result. "For the single-client closed system, where our hypothesis is that the client-observed latency is equal to the server latency because no queue can form, the 99th percentile is below 1ms. For the open system, its over 25ms." (Some Examples)
- Why. "Without a limit on client-side concurrency, the queue grows during the pause, and then must pay down that queue when the long request is over." (Some Examples)
- Closed benchmarks mislead about open systems. "a closed benchmark running against a system which will be open in production could significantly under estimate the tail latency observed by real-world clients (and vice versa)." (Benchmarks and Coordinated Omission)
- By how much, here. "a closed benchmark could underestimate 99th percentile latency by a factor of at least 25." (Benchmarks and Coordinated Omission)
- It's the default loop. "The closed loop one is the one I’d probably write if I wasn’t thinking about it." (Benchmarks and Coordinated Omission)
- The open version sends on a timer and records replies elsewhere. "(asynchronously write down the response time on completion in a different thread)" (Benchmarks and Coordinated Omission)
- Retries on timeout. "What if we take the bimodal system, and make the seemingly very small change of retrying if the response takes longer than 15ms?" (Open Loops, Timeouts, and Congestive Collapse)
- Why 15 ms looked safe. "That seems safe, because it’s still more than 15x the server’s 99th percentile latency." (same section)
- Result of the retries. "Our queue is growing without bound!" (same section)
- Production systems. "Almost all stable production systems aren’t really open, and instead approximate closed behavior by limiting either concurrency or arrival rate" (same section)

## Visuals worth redrawing

- Queue length over simulated time: open vs closed, and open with
  retries after a 15 ms timeout.

## My notes

- Numbers are from his simulator (under 200 lines of Python, on
  GitHub), not from a real system.
