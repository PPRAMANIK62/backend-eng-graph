---
id: brooker-load-balanced-economics-2020
title: Surprising Economics of Load-Balanced Systems
author: Marc Brooker
url: https://brooker.co.za/blog/2020/08/06/erlang.html
kind: blog
primary: false
---

## Summary

A 2020 post on the M/M/c queue: c servers behind one shared queue, each
at 80% load. As c grows with the load, mean latency falls toward the
bare service time, because a bigger pool is less often all busy at
once. Erlang's C formula gives the chance a request has to wait; a
simulation shows the percentiles follow the mean.

## Key claims

- The setup: c single-request servers behind a load balancer with one queue, offered c × 0.8 requests per second, one second of work each on average. (opening)
- The answer. "the mean latency decreases quickly, asymptotically approaching one second as c increases" (option A, which he says is right)
- Erlang's C formula gives the chance a request is queued rather than served at once. (middle)
- The numbers at half load. "So at half load the 5-server system is handling 87% of traffic without queuing, with double the load and double the servers, we handle 96.4% without queuing." (middle)
- Percentiles follow the mean in his simulation. "The median (p50) follows the mean line nicely, and the high percentiles (99th and 99.9th) have a similar shape." (middle)
- The payoff. "With larger c we get better latency at the same utilization, or better utilization for the same latency, all at the same per-server throughput." (end)
- It kicks in early. "most of this goodness happens at relatively modest c." (end)
- Model limits. "Exponential service time is especially wrong: realistic services tend to be something more like log-normal." (end)
- Still unstable past capacity: the queue grows without bound when λ/cμ reaches 1. (footnote 1)
- The same model under its telephone name. "In teletraffic engineering, it’s Erlang’s delay system (or, because terminology is fun, M/M/n)." (middle)

## Visuals worth redrawing

- Probability of queueing against offered load for several server
  counts (Erlang C curves).

## My notes

- Assumes one shared queue. Servers that each keep their own queue,
  fed at random, don't get this benefit; see Mitzenmacher in
  load-balancing-algorithms.
