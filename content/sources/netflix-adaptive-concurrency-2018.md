---
id: netflix-adaptive-concurrency-2018
title: "Performance Under Load: Adaptive Concurrency Limits @ Netflix"
author: Eran Landau, William Thurston and Tim Bozarth, Netflix Technology Blog
url: https://netflixtechblog.medium.com/performance-under-load-3e6fa9a60581
kind: blog
primary: true
---

## Summary

Netflix's announcement of adaptive concurrency limits and the
open-source concurrency-limits Java library (2018). Instead of a fixed,
hand-measured limit on in-flight requests, each server estimates its
own limit continuously from latency, borrowing the idea from TCP
congestion control, and rejects what's over it. Read through the
Wayback Machine snapshot, because the page answered with a 403.

## Key claims

- Little's law ties concurrency to service time and rate. "For a system at steady state, concurrency is the product of the average service time and the average service rate (L = 𝛌W)." (A little background first)
- Requests over the limit must queue or be rejected. "Any requests in excess of this concurrency cannot immediately be serviced and must be queued or rejected." (A little background first)
- Some queueing is needed for full utilization. "some queueing is necessary as it enables full system utilization in spite of non-uniform request arrival and service time." (A little background first)
- An unbounded queue grows until timeouts and a crash, and hurts callers. "As the queue grows so will latency until all requests start timing out and the system will ultimately run out of memory and crash." (A little background first)
- The limit is in-flight requests before latency degrades. "This limit can be seen as maximum number of inflight requests (concurrency + queue) allowed before performance (i.e. latency) starts to degrade." (A little background first)
- Hand-measured fixed limits went stale. "the measured limit would quickly become stale as a system’s topology changes due to partial outages, auto-scaling or from code pushes that impact latency characteristics." (The solution)
- The approach comes from TCP congestion control. "To solve this problem we turned to tried and true TCP congestion control algorithms" (The solution)
- Probe upward while latency holds, back off when it rises, a saw-tooth. "When latencies do increase the sender assumes to have reached the limit and backs off to a smaller congestion window size." (The solution)
- The gradient is no-load latency over actual latency; 1 means no queue. "A value of 1 indicates no queueing and that the limit can be increased." (The solution)
- The update rule. "newLimit = currentLimit × gradient + queueSize" (The solution)
- The allowed queue size defaults to the square root of the limit. "We settled on a good default of the square root of the current limit." (The solution)
- Server-side limits reject excess and keep latency low while autoscaling catches up. "Services are now able to shed excess load and keep latencies low while other mitigating actions such as auto-scaling kick into action." (Adaptive Limits in Action)
- Limits are per server, without coordination, so one server may shed while others have room. "This can result in shedding by one server when there was enough capacity elsewhere." (Adaptive Limits in Action)
- With client-side load balancing one retry almost always finds capacity. "using client side load balancing a single client retry is nearly 100% successful at reaching an instance with available capacity." (Adaptive Limits in Action)
- Shedding is fast. "services are able to shed traffic quickly in sub millisecond time" (Adaptive Limits in Action)
- Why the square root. "We chose square root mostly because it has the useful property of being large relative to the current limit for low numbers, thereby allowing for faster growth, but reduces for larger numbers for better stability." (The solution)
- Fixed limits used to come from performance testing and profiling. "Historically, at Netflix we’ve manually configured fixed concurrency limits measured via an arduous process of performance testing and profiling." (The solution)

## Visuals worth redrawing

- The saw-tooth of a probed limit against an unknown true concurrency.

## My notes

- The library's README (github.com/Netflix/concurrency-limits) lists
  Vegas and Gradient2 algorithms and a server limiter that rejects with
  gRPC UNAVAILABLE. Opened for context, not cited.
