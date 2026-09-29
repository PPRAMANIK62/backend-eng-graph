---
id: wakart-safepoint-bias-2016
title: Why (Most) Sampling Java Profilers Are Terrible
author: Nitsan Wakart
url: http://psy-lob-saw.blogspot.com/2016/02/why-most-sampling-java-profilers-are.html
kind: blog
primary: false
---

## Summary

A JVM performance engineer's post (2016) on safepoint bias: most Java
sampling profilers can only take a stack at a safepoint, so samples pile
up at the next safepoint poll instead of where the CPU really was. It
works through JMH examples where the hot code is known and shows the
profilers blaming the wrong lines, then points to profilers that don't
have the problem. The real post title has a swear word; shortened here.

## Key claims

- What safepoint sampling means: only the poll points are visible. "It means only the safepoint polls in the running code are visible." (Safepoint Sampling: Theory)
- The bias. "This leads to the phenomena called safepoint bias whereby the sampling profiler samples are biased towards the next available safepoint poll location" (Safepoint Sampling: Theory)
- A fair profiler samples every point equally. "the profiler should sample all points in a program run with equal probability" (Safepoint Sampling: Theory)
- In hot compiled code the polls are at method exit and uncounted loop back edges. "we have reduced our sampling opportunities to method exit and uncounted loop backedges." (Safepoint Sampling: Theory)
- Common Java profilers sample at a safepoint. "VisualVM, NB Profiler(same thing), YourKit and JProfiler all provide a sampling CPU profiler which samples at a safepoint." (intro)
- Collecting all threads' stacks at a global safepoint has an open-ended cost. "Gathering full stack traces from all the threads means your safepoint operation cost is open ended." (list of issues, 2)
- Earlier research found different Java profilers disagree on the same program (Mytkowicz et al., "Evaluating the Accuracy of Java Profilers", 2010, quoted in the post). "If we knew the “correct” profile for a program run, we could evaluate the profiler with respect to this correct profile." (Safepoint Sampling: Reality)
- That paper found Java profilers disagreeing about hot spots. "the writers recognize that different Java profilers identify different hotspots in the same benchmarks" (Safepoint Sampling: Reality)
- Blocked-thread stacks are still accurate. "The stack traces for blocked threads are accurate" (summary)
- Better options named: Honest-Profiler, perf with perf-map-agent. (summary)

## Visuals worth redrawing

None.

## My notes

- Specific to the JVM (HotSpot). Go's profiler uses SIGPROF signals, not
  safepoints; don't generalise the mechanism, only the lesson that a
  sampler can have blind spots.
- The Mytkowicz paper itself couldn't be opened (ACM blocked the
  download); only the line quoted here is used.
