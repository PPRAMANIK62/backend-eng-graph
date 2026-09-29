---
id: brooker-tail-latency-2021
title: Tail Latency Might Matter More Than You Think
author: Marc Brooker
url: https://brooker.co.za/blog/2021/04/19/latency.html
kind: blog
primary: false
---

## Summary

A 2021 post by an AWS engineer. A simulation with a bimodal service
latency shows how parallel fan-out and serial call chains both make a
rare slow mode matter much more than its 1% suggests. Ends on which
statistics to watch.

## Key claims

- Definition. "Tail latency, also known as high-percentile latency, refers to high latencies that clients see fairly infrequently." (opening)
- Two call shapes: parallel fan-out and serial chains. "parallel fan-out, where the service calls many backends in parallel and waits for them all to complete, and serial chains where one service calls another, which calls another, and so on." (opening)
- The model. "99% of the time with a mean of 10ms (normally distributed with a standard deviation of 2ms), and 1% of the time with a mean of 100ms (and SD of 10ms)." (opening)
- Parallel: the chance of hitting a slow call grows with N. "With N=1, that’ll happen around 1% of the time. With N=10, around 10% of the time." (Parallel Calls)
- "The tail mode, which used to be quite rare, starts to dominate as N increases." (Parallel Calls)
- Serial: the tail raises the variance of the sum. "That relatively rare tail increases the variance of the distribution we’re converging on by a factor of 25." (Serial Chains)
- The comparison worlds. "One Tail world which has the bimodal distribution we describe above, and one No Tail world which only has the primary distribution around 10ms." (Serial Chains)
- What to watch. "make sure you’re aware of the high percentiles of service latency, and consider monitoring common customer or client use-cases and monitoring their end-to-end latency experience." (Choosing Summary Statistics)
- Histograms miss time. "Looking at histograms is cool, but tends to miss the time component." (Choosing Summary Statistics)
- Trimmed means hide what matters. "cutting off the right tail will cause you to miss effects where that tail is very important" (Choosing Summary Statistics)
- His one-number pick is still the mean. "I continue to believe that if you’re going to measure just one thing, make it the mean." (Choosing Summary Statistics)

## Visuals worth redrawing

- The simulated distributions for N parallel calls, showing the 100 ms
  mode growing with N.

## My notes

- The 25× variance figure is for his made-up distribution, not a
  measurement of a real service.
