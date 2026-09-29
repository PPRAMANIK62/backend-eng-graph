---
id: dean-tail-at-scale-2013
title: The Tail at Scale
author: Jeffrey Dean and Luiz André Barroso (Google)
url: https://www.barroso.org/publications/TheTailAtScale.pdf
kind: paper
primary: true
---

## Summary

The paper that named the problem, published in Communications of the
ACM, vol. 56 no. 2 (2013). Rare slow responses on one server become
common for a request that fans out to many servers. Google's answer is
to stop trying to remove all variability and instead build systems
that tolerate it: hedged and tied requests within one request, and
micro-partitions, selective replication and probation across requests.
Read from the PDF on Barroso's site; the CACM page was blocked.

## Key claims

- At scale, rare slow episodes dominate. "Temporary high-latency episodes (unimportant in moderate-size systems) may come to dominate overall service performance at large scale." (opening)
- The goal, by analogy with fault tolerance. "Just as fault-tolerant computing aims to create a reliable whole out of less-reliable parts, large online services need to create a predictably responsive whole out of less-predictable parts" (opening)
- Shared resources on one machine. "contending for shared resources (such as CPU cores, processor caches, memory bandwidth, and network bandwidth)" (Why Variability Exists?)
- Shared across machines. "might contend for global resources (such as network switches and shared file systems)" (Why Variability Exists?)
- Daemons cause hiccups. "Background daemons may use only limited resources on average but when scheduled can generate multi-millisecond hiccups" (Why Variability Exists?)
- Maintenance work (reconstruction, compaction, GC) causes periodic spikes. "periodic log compactions in storage systems like BigTable,4 and periodic garbage collection in garbage-collected languages) can cause periodic spikes in latency" (Why Variability Exists?)
- Queueing amplifies it. "Multiple layers of queueing in intermediate servers and network switches amplify this variability." (Why Variability Exists?)
- CPUs throttle after running above their power envelope. "Modern CPUs are designed to temporarily run above their average power envelope, mitigating thermal effects by throttling if this activity is sustained for a long period" (Why Variability Exists?)
- SSD garbage collection. "can increase read latency by a factor of 100 with even a modest level of write activity" (Why Variability Exists?)
- Power-saving modes. "Power-saving modes in many types of devices save considerable energy but add additional latency when moving from inactive to active modes." (Why Variability Exists?)
- The fan-out example. "consider a system where each server typically responds in 10ms but with a 99th-percentile latency of one second." (Component-Level Variability Amplified By Scale)
- With 100 servers, most requests are slow. "If a user request must collect responses from 100 such servers in parallel, then 63% of user requests will take more than one second" (same section)
- Even at 1 in 10,000. "will see almost one in five user requests taking more than one second" (same section, for 2,000 servers)
- Table 1, a real Google service. "The 99th-percentile latency for a single random request to finish, measured at the root, is 10ms. However, the 99th-percentile latency for all requests to finish is 140ms" (same section, Table 1)
- The service's shape. "root servers distribute a request through intermediate servers to a very large number of leaf servers." (same section)
- Waiting for 95% of leaves. "the 99th-percentile latency for 95% of the requests finishing is 70ms" (same section)
- The last 5% of leaves cost half. "waiting for the slowest 5% of the requests to complete is responsible for half of the total 99%-percentile latency" (same section)
- Keep low-level queues short so priorities work. "Keep low-level queues short so higher-level policies take effect more quickly" (Reducing Component Variability)
- Google's storage servers do this. "the storage servers in Google’s cluster-level file-system software keep few operations outstanding in the operating system’s disk queue, instead maintaining their own priority queues of pending disk requests." (Reducing Component Variability)
- Break long requests up. "break long-running requests into a sequence of smaller requests to allow interleaving of the execution of other short-running requests" (Reducing Component Variability)
- Synchronize background work across machines. "without synchronization, a few machines are always doing some background activity, pushing out the latency tail on all requests." (Reducing Component Variability)
- Synchronized, only the requests during the burst suffer. "slowing only those interactive requests being handled during the brief period of background activity." (Reducing Component Variability)
- Caching doesn't fix the tail. "they do not directly address tail latency, aside from configurations where it is guaranteed that the entire working set of an application can reside in a cache." (Reducing Component Variability)
- You can't remove all variability. "the scale and complexity of modern Web services make it infeasible to eliminate all latency variability." (Living with Latency Variability)
- Hedged requests. "issue the same request to multiple replicas and use the results from whichever replica responds first" (Hedged requests)
- Deferred copy. "a client first sends one request to the replica believed to be the most appropriate, but then falls back on sending a secondary request after some brief delay." (Hedged requests)
- Cancel the rest. "The client cancels remaining outstanding requests once the first result is received." (Hedged requests)
- Waiting for the p95 before hedging bounds the cost. "This approach limits the additional load to approximately 5% while substantially shortening the latency tail." (Hedged requests)
- Why it works. "The technique works because the source of latency is often not inherent in the particular request but rather due to other forms of interference." (Hedged requests)
- BigTable benchmark. "sending a hedging request after a 10ms delay reduces the 99.9th-percentile latency for retrieving all 1,000 values from 1,800ms to 74ms while sending just 2% more requests." (Hedged requests; 1,000 keys over 100 servers)
- Tied requests: each copy tells the other when it starts. "When a request begins execution, it sends a cancellation message to its counterpart." (Tied requests)
- Tagging. "the client send the request to two different servers, each tagged with the identity of the other server" (Tied requests)
- The race it guards against. "A common case where this situation can occur is if both server queues are completely empty." (Tied requests)
- Where Google used it. "Google’s implementation of this technique in the context of its cluster-level distributed file system is effective at reducing both median and tail latencies." (Tied requests)
- Wait a little before the second copy. "introduce a small delay of two times the average network message delay (1ms or less in modern data-center networks)" (Tied requests)
- Tied request results. "achieving nearly 40% reduction at the 99.9th-percentile latency" (Tied requests, Table 2)
- Tied request cost. "the overhead of tied requests in disk utilization is less than 1%" (Tied requests)
- Only works for uncorrelated slowness. "the class of techniques described here is effective only when the phenomena that causes variability does not tend to simultaneously affect multiple request replicas." (Tied requests)
- Probation of slow machines improves latency. "as removal of serving capacity from a live system during periods of high load actually improves latency." (Latency-induced probation)
- Micro-partitions: many more partitions than machines. "With an average of, say, 20 partitions per machine, the system can shed load in roughly 5% increments" (Micro-partitions)
- Selective replication of hot items. "detect or even predict certain items that are likely to cause load imbalance and create additional replicas of these items." (Selective replication)
- Canary requests. "rather than initially send a request to thousands of leaf servers, a root server sends it first to one or two leaf servers." (Canary requests)
- Probation keeps probing. "the system continues to issue shadow requests to these excluded servers" (Latency-induced probation)
- Skip optional parts. "results from ads or spelling-correction systems are easily skipped for Web searches if they do not respond in time." (Good enough)
- Good-enough answers. "Google’s IR systems are tuned to occasionally respond with good-enough results when an acceptable fraction of the overall corpus has been searched" (Good enough)
- Updates off the critical path. "updates can often be performed off the critical path, after responding to the user." (Mutations)
- Quorum writes are naturally tail-tolerant. "since these algorithms must commit to only three to five replicas, they are inherently tail-tolerant." (Mutations)

## Visuals worth redrawing

- The figure on the fan-out page: probability that the service takes
  over one second against number of servers (1 to 2,000), with curves
  for 1 in 100, 1 in 1,000 and 1 in 10,000 slow servers; marked points
  0.63 and 0.18.
- Table 1 and Table 2 as small tables.

## My notes

- The 63% is 1 − 0.99^100 and the "one in five" is 1 − 0.9999^2000:
  each server is slow independently. Real slowness is often
  correlated, which the paper itself flags for tied requests.
