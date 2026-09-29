---
id: slimmon-queues-2016
title: The most important thing to understand about queues
author: Dan Slimmon
url: https://blog.danslimmon.com/2016/08/26/the-most-important-thing-to-understand-about-queues/
kind: blog
primary: false
---

## Summary

A 2016 post by an SRE. As a queue's utilization approaches 100%, the
average queue length and wait approach infinity, and the trouble starts
well before that: random bunches of arrivals build a backlog that a
busy server is slow to clear. Includes a simulation of wait time
against utilization.

## Key claims

- The main point. "As you approach maximum throughput, average queue size – and therefore average wait time – approaches infinity." (opening)
- It's about an unbounded queue. "The ‘∞’ in “M/M/1/∞” means that the queue is unbounded." (Queues)
- 100% utilization and a growing queue are the same thing. "the statements “average capacity utilization is 100%” and “the queue size is growing without bound” are equivalent." (Capacity)
- Why it hurts before 100%. "Sometimes a bunch of tasks will just happen to show up at the same time." (What about 90%?)
- The simulation: one queue serving on average one task per second, Poisson arrivals, exponential service times. "I used a Poisson arrival process and exponentially distributed processing times" (What about 90%?)
- Where it turns. "Notice how things start to get a little crazy around 80% utilization." (What about 90%?)
- At 96%. "By the time you reach 96% utilization (the rightmost point on the plot), average wait times are already 20 seconds." (What about 90%?)
- The only levers. "Increase capacity", "Decrease demand", "Set an upper bound for the queue size" (What can be done about it)

## Visuals worth redrawing

- The simulated plot of wait time against utilization.

## My notes

- The 20 s is one simulation run; the M/M/1 formula gives a somewhat
  higher mean at 96%. Use it for the shape, not as an exact value.
