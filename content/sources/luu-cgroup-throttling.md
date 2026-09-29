---
id: luu-cgroup-throttling
title: The container throttling problem
author: Dan Luu (with David Mackey and others at Twitter)
url: https://danluu.com/cgroup-throttling/
kind: blog
primary: true
---

## Summary

An excerpt from a Twitter internal document (2019): services with a CPU
quota (CFS bandwidth control) got throttled and blew their latency SLOs
at around 50% average CPU use, because thread pools sized to the host's
cores burst past the quota inside one 100 ms period. Primary in the
sense that the authors ran these services and measured them.

## Key claims

- Most CPU-bound services fell over around 50% reserved CPU use. "At Twitter, most CPU bound services start falling over at around 50% reserved container CPU utilization" (intro)
- The quota limits average use, not instantaneous cores; bursts get throttled. "The quota mechanism limits the amortized CPU usage of each container, but it doesn't limit how many cores the job can use at any given moment." (The problem, in theory)
- Throttling is bad for tail latency. "it will use more cores than its quota for a short period of time and then get throttled, i.e., basically get put to sleep, in order to keep its amortized core usage below the quota, which is disastrous for tail latency" (The problem, in theory)
- Big thread pools cause it. "Since the vast majority of services at Twitter use thread pools that are much larger than their mesos core reservation, when jobs have heavy load, they end up requesting and then using more cores than their reservation and then throttling." (The problem, in theory)
- JVM GC threads sized to the host's core count turned sub-second pauses into seconds. "a subsecond stop-the-world GC pause could take many seconds of wallclock time to complete." (The problem, in theory)
- Case study: 20-core quota, about 8 cores average use, still SLO violations. "the SLO was violated even though average utilization is about 8 cores, or 40% of quota." (The problem, in practice)
- The quota period was 100 ms. "the sampling period for this graph was 10ms and the quota period is 100ms" (The problem, in practice)
- Shrinking thread pools let the service handle about 2x the load. "later testing showed that the service was able to handle about 2x the capacity after tweaking the thread pool sizes" (The problem, in practice)
- Why Twitter enabled quotas: to stop one service hurting its neighbours. "The intention is to allow different services to be colocated on the same boxes without having one service's runaway CPU usage impact other services" (The problem, in theory)

## Visuals worth redrawing

A timeline of one 100 ms period: many threads burn the quota early, then
the whole group sleeps until the next period.

## My notes

- Twitter's numbers on Twitter's services and kernels (CFS era), not a
  rule. The mechanism is cpu.max (v2) / cfs_quota_us (v1).
