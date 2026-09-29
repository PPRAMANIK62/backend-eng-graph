---
id: bronson-metastable-failures-2021
title: Metastable Failures in Distributed Systems
author: Nathan Bronson, Abutalib Aghayev, Aleksey Charapko and Timothy Zhu (HotOS '21)
url: https://sigops.org/s/conferences/hotos/2021/papers/hotos21-s11-bronson.pdf
kind: paper
primary: true
---

## Summary

The HotOS 2021 paper that named metastable failures: a trigger pushes a
system into a bad state that a feedback loop keeps it in after the
trigger is gone. Defines stable, vulnerable and metastable states in
terms of goodput, walks through case studies (retries, look-aside
cache, slow error paths, link imbalance), and lists industry practices
against them.

## Key claims

- Definition, with goodput as the throughput of useful work. "Metastable failures occur in open systems with an uncontrolled source of load where a trigger causes the system to enter a bad state that persists even when the trigger is removed. In this state the goodput (i.e., throughput of useful work) is unusably low" (1 Introduction)
- Failures that end with their trigger aren't metastable. "Failures that resolve when the trigger is removed, such as a denial-of-service attack [8], limplock [9], or livelock [2], are not metastable." (1 Introduction)
- Getting out needs a strong push. "Leaving a metastable failure state requires a strong corrective push, such as rebooting the system or dramatically reducing the load." (1 Introduction)
- Many systems run in the vulnerable state on purpose. "many production systems choose to run in the vulnerable state all the time because it has much higher efficiency than the stable state." (1 Introduction)
- The feedback loop can spread to parts that never saw the trigger. "In the most severe outages, the feedback loop is contagious, causing portions of the system that weren’t exposed to the trigger to enter the failure state as well." (1 Introduction)
- The root cause is the sustaining effect, not the trigger. "It is common for an outage that involves a metastable failure to be initially blamed on the trigger, but the true root cause is the sustaining effect." (1 Introduction)
- Retry example: a database fast below 300 QPS, one retry after 1 s, 280 QPS normal load, a 10 s network outage; afterwards clients send 560 QPS and goodput is zero. "The web application in this state has no goodput because every database query times out." (2.1 Request Retries)
- Stable below 150 QPS, vulnerable above. "The system starts in the stable state and stays in it as long as the load is below 150 QPS." (2.1 Request Retries)
- Changing policy during overload keeps goodput high: retry budgets, LIFO, smaller queues, priorities, shedding. "One way to weaken or break the feedback loops is to ensure that goodput remains high even during overload." (3 Approaches)
- Telling persistent overload from a spike: minimum queueing latency over a window, as in CoDel. "We have found it effective to measure the minimum queueing latency over a sliding window, as in Codel [13], for the internal work queues of the server [7]." (3 Approaches)
- Deserializing every request before processing encodes the wrong priority for overload. "Preserving goodput during overload, on the other hand, requires the opposite policy." (3 Approaches, Prioritization)
- Error paths should be cheap. "We think distributed systems should also have highly-optimized error paths." (3 Approaches, Fast Error Paths)

- Three states: stable, vulnerable, metastable. Above a hidden load threshold the system is vulnerable but healthy. "Once the load rises above a certain threshold—implicit and invisible—the system enters a vulnerable state." (1 Introduction)
- The vulnerable state isn't overload; systems can sit in it for years. "a system can run for months or years in the vulnerable state and then get stuck in a metastable state without any increase in load." (1 Introduction)
- Loop strength grows with scale, so tests miss it. "The strength of many feedback loops is proportional to the scale, so they can slip past even a robust testing and deployment regime." (1 Introduction)
- The root cause is often a feature that helps efficiency or reliability. "Paradoxically, the root cause of these failures is often features that improve the efficiency or reliability of the system." (1 Introduction)
- Sustaining effects almost always involve running out of some resource. "the sustaining effect is almost always associated with exhaustion of some resource." (2 Case studies)
- Retry example setup: database under 100 ms below 300 QPS, one retry after 1 s. "The database responds to queries under 100 ms if the queries-per-second (QPS) is below 300, but at higher loads, the latency becomes an order of magnitude worse." (2.1 Request Retries)
- A 10 s network outage at 280 QPS sends a surge; retries then keep load at 560 QPS. "So long as latency is high, client queries will continue at 560 QPS due to retries." (2.1)
- Recovery needs load under 150 QPS or retries under 20 QPS. "Recovery from the metastable state requires reducing the web application load to under 150 QPS or limiting retries to less than 20 QPS." (2.1)
- Look-aside cache: 90% hit rate lets a 300 QPS database serve 3,000 QPS; losing the cache means 10x queries and the cache never refills because every query times out. "In effect, losing a cache with a 90% hit-rate causes a 10× query amplification." (2.2 Look-aside Cache)
- Slow error handling: error paths cost more than success paths, so errors make the shortage worse. "If a trigger causes the system to run out of any of the resources that are used by the error handling code, then error handling will make the shortage more severe." (2.3)
- Link imbalance took over two years to explain and was fixed by one line in the connection pool. "Although this metastable failure was hard to diagnose, the fix was a single line that changed the connection pool’s policy." (2.4)
- Fix the loop, not the trigger. "There are many triggers that can lead to the same failure state, so addressing the sustaining effect is much more likely to prevent future outages." (3)
- Changing policy under overload: disable retries or use a retry budget, LIFO, smaller queues, priorities, shedding, circuit breakers. "For example, we might disable failover and retries or set a retry budget [4], switch to LIFO scheduling to allow some requests to meet their deadline, reduce internal queue sizes, enforce priorities during overload [12], shed load by rejecting a fraction of requests or clients, or even use the Circuit Breaker pattern to block all requests [14]." (3)
- Lower priority for retries would break the retry loop. "using a lower priority for retried queries would avoid perpetuating the feedback loop" (3, Prioritization)
- A system with priorities still failed: extra retries and failover gave worst-case amplification over 100x. "resulted in a worst-case work amplification of over 100×." (3, Prioritization)
- A read-through cache with a permissive timeout keeps filling during overload. "A read-through cache can have a permissive timeout for database queries; although the web application will give up on the request, the cache will still be filled, which steadily increases the hit rate until the system is healthy again." (3)
- Small-scale stress tests don't give much confidence. "small scale tests don’t provide much confidence that a problem cannot appear at full scale." (3, Stress Tests)
- Common-case optimizations raise the multiple over the threshold. "Optimizations that apply only to the common case exacerbate feedback loops because they lead to the system being operated at a larger multiple of the threshold between stable and vulnerable states." (3, Organizational Incentives)
- Fast error paths: send errors to a bounded queue and just count overflow. "If the queue overflows then errors are only reflected in a counter, reducing the per-failure overhead dramatically." (3, Fast Error Paths)
- Work amplification is the common theme; bound it. "Ideally, systems will be designed to upper bound the degree of work amplification." (4)
- You don't need to remove every loop, just weaken the strongest. "We don’t need to eliminate every loop, just weaken the strongest ones." (4)
- Characteristic metric: moved by the trigger, returns to normal only after recovery. Examples include queueing delay, latency, timeout rates. "there is often a metric that is affected by the trigger and that only returns to normal after the metastable failure resolves." (4)
- Hidden capacity is the self-healing limit; advertised capacity is where vulnerability starts. In the cache example 3,000 QPS advertised vs 300 QPS hidden. "Hidden capacity is the limit at which the system will self-heal." (4)
- You can measure hidden capacity with a stress test plus a trigger. "If we run a stress test at some load level, apply a trigger that causes the characteristic metric to spike, and observe that the system quiesces without intervention, then we know that the load level is below the hidden capacity" (4)
- Trigger size matters: near hidden capacity the system survives larger triggers. "the system can recover from a much larger spike if the load is 151 QPS (near the hidden capacity) rather than 299 QPS (near the advertised capacity)." (4)
- A systematic way to build systems robust to unknown metastable failures is still open. "A systematic approach for building systems that are robust against unknown metastable failures remains an open problem." (Abstract)
- In the stable state, retries' extra work still fits. "a trigger will not move the system into the metastable failure state because the database can handle the workload even with the work amplification of retries." (2.1 Request Retries)
- Failover doesn't multiply requests but can spread failure. "Failover doesn’t result in request amplification on its own because each request is processed only once, but it can cause failures to cascade." (2.1 Request Retries)
- Error paths are written for debugging: stack traces, DNS lookups, detailed logs. "It might capture a stack trace (using lots of CPU), obtain the name of the client using a DNS lookup (blocking a thread)" (2.3 Slow Error Handling)
- A small minimum queue delay means the queue drained, so it's a spike; a large one over the whole window means switch to a goodput-maximizing policy. "If the minimum queueing latency is large over the entire window, then we switch to a server policy designed to maximize goodput and add information about the overload to all responses." (3 Approaches)
- Prioritizing new requests removes the retries. "future user queries would be prioritized and succeed, thus eliminating the retries." (3, Prioritization)
- Stack traces can be sampled. "when there are many errors, a sample is enough for diagnosing the problem." (3, Fast Error Paths)
- Loop strength depends on constants like cache hit rate. "The strength of the loop depends on a host of constant factors from the environment, such as cache hit rate." (4)
- Adding capacity to a stateful system lowers capacity in the short term. "Unfortunately, unless a stateful system is specifically designed to provide zero-impact elasticity, reconfiguration will reduce capacity in the short term." (4)
- (For metastable-failures.) After the 10 s outage, everything sent during it arrives at once. "When connectivity is restored, all the packets lost during the outage are retransmitted, including requests and retries sent during the 10 s." (2.1 Request Retries)
- Why the cache stays empty: the app fills it but counts every timed-out query as failed. "Unfortunately, the cache will remain empty since the web application is responsible for populating the cache, but its timeout will cause all queries to be considered as failed." (2.2 Look-aside Cache)
- A better eviction algorithm invites reclaiming database capacity. "For example, an improved cache eviction algorithm will reduce average database load, which makes it seem desirable to reclaim database resources." (3, Organizational Incentives)
- Errors go to a dedicated logging thread. "One pattern for isolating error handling is to send failures to a dedicated error logging thread via a bounded-size lock-free queue." (3, Fast Error Paths)

## Visuals worth redrawing

- Figure 2: goodput against load for stable, vulnerable and metastable
  states (goodput collapses to near zero after the trigger and stays
  there until load drops below the stable threshold).

- Figure 1: the three states (stable, vulnerable, metastable) with load,
  trigger, sustaining effect and recovery arrows.

## My notes

- The example numbers are an idealized model, not a measurement.
- Metastable failures proper belong to phase 13's metastable-failures
  node; goodput uses only the definition.
- Brooker (brooker-metastability-2021) argues the idea is old outside
  computing, and that switching policy under overload adds modes that
  are hard to reason about.
