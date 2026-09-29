---
id: maurer-fail-at-scale-2015
title: "Fail at Scale: Reliability in the face of rapid change"
author: Ben Maurer, Facebook (ACM Queue vol. 13, no. 8)
url: https://queue.acm.org/detail.cfm?id=2839461
kind: blog
primary: true
---

## Summary

How Facebook kept its site reliable while changing it constantly
(ACM Queue, 2015). Three patterns that turn small failures into big
ones (fast config changes, hard dependencies on core services, and
latency that exhausts resources), and the fixes Facebook built into its
libraries: a CoDel-style queue timeout, adaptive LIFO, and a per-client
cap on outstanding requests. Read through the Wayback Machine snapshot,
because queue.acm.org answered with a JavaScript challenge page.

## Key claims

- Large latency, not small, causes cascading failures. "While small amounts of additional latency can be easily handled by Facebook's infrastructure, large amounts of latency lead to cascading failures." (Increased latency and resource exhaustion)
- Almost every service has a limit on outstanding requests, from threads or memory. "Almost all services have a limit to the number of outstanding requests." (Increased latency and resource exhaustion)
- A slow service exhausts its callers, layer by layer. "If a service experiences large amounts of extra latency, then the services that call it will exhaust their resources. This failure can be propagated through many layers of services, causing widespread failure." (Increased latency and resource exhaustion)
- Resource exhaustion lets a failure in a subset of requests take down all of them. "Resource exhaustion is a particularly damaging mode of failure because it allows the failure of a service used by a subset of requests to cause the failure of all requests." (Increased latency and resource exhaustion)
- The 1% example: an experimental service slows from 1 ms to 1 s and its callers' threads run out. "Requests for the 1% of users using this new service might consume so many threads that requests for the other 99% of users are unable to run." (Increased latency and resource exhaustion)
- Many of the worst incidents had requests sitting in queues. "we found that many of our worst incidents involved large numbers of requests sitting in queues awaiting processing." (Controlled Delay)
- Facebook adapted CoDel from the bufferbloat work. "We studied the research on bufferbloat as our problems seemed similar—the need to queue for reliability without causing excessive latency during congestion." (Controlled Delay)
- The rule: if the queue hasn't been empty recently, queued requests get a short timeout. "In this algorithm, if the queue has not been empty for the last N milliseconds, then the amount of time spent in the queue is limited to M milliseconds." (Controlled Delay)
- It prevents a standing queue but allows short bursts. "This algorithm prevents a standing queue (because the lastEmptyTime will be in the distant past, causing an M-ms queuing timeout) while allowing short bursts of queuing for reliability purposes." (Controlled Delay)
- A short timeout keeps the server a little over capacity so it never idles. "A short timeout ensures that the server always accepts just a little bit more work than it can actually handle so it never goes idle." (Controlled Delay)
- M and N rarely need tuning; 5 ms and 100 ms work widely. "We have found that a value of 5 milliseconds for M and 100 ms for N tends to work well across a wide set of use cases." (Controlled Delay)
- Queue length limits and queue timeouts needed per-service tuning. "Other methods of solving the problem of standing queues, such as setting a limit on the number of items in the queue or setting a timeout for the queue, have required tuning on a per-service basis." (Controlled Delay)
- Wangle implements it and Thrift uses it. "Facebook's open source Wangle library5 provides an implementation of this algorithm which is used by our Thrift4 framework." (Controlled Delay; the digits are footnote markers)
- In a long queue the oldest request's user has often given up. "During periods of high queuing, however, the first-in request has often been sitting around for so long that the user may have aborted the action that generated the request." (Adaptive LIFO)
- Adaptive LIFO: FIFO normally, LIFO once a queue forms. "During normal operating conditions, requests are processed in FIFO order, but when a queue is starting to form, the server switches to LIFO mode." (Adaptive LIFO)
- CoDel and adaptive LIFO together. "CoDel sets short timeouts, preventing long queues from building up, and adaptive LIFO places new requests at the front of the queue, maximizing the chance that they will meet the deadline set by CoDel." (Adaptive LIFO)
- HHVM implements adaptive LIFO. "HHVM3, Facebook's PHP runtime, includes an implementation of the Adaptive LIFO algorithm." (Adaptive LIFO; the 3 is a footnote marker)
- The server is usually the best place for these controls. "The server is often the best place to implement latency-preventing measures—a server tends to serve a large number of clients and often has more information than its clients possess." (Concurrency Control)
- Clients cap outstanding requests per service and fail the excess immediately. "When new requests are sent, if the number of outstanding requests to that service exceeds a configurable number, the request is immediately marked as an error." (Concurrency Control)
- That stops one service from taking all of a client's resources. "This mechanism prevents a single service from monopolizing all its client's resources." (Concurrency Control)
- Brief failures of core services can become large incidents. "Even brief failures in these core services, however, can turn into large-scale incidents." (Hard dependencies on core services)
- Cache data from core services so callers survive a short outage. "The data these services return can be cached in a way that allows for the majority of services to continue operating during a brief outage of one of these systems." (Hard dependencies on core services)
- Keep running on a stale config rather than failing. "Running with a stale configuration is generally preferable to returning errors to users." (Rapidly deployed configuration changes)

## Visuals worth redrawing

- Figure 2: CoDel and adaptive LIFO together on one queue (new requests
  at the front, old ones timed out).

## My notes

- The CoDel paper it builds on is Nichols and Jacobson, "Controlling
  Queue Delay" (ACM Queue, 2012). Not opened here.
