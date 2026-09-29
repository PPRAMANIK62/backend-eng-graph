---
id: parca-overview
title: Parca overview
author: Parca authors (Polar Signals)
url: https://www.parca.dev/docs/overview
kind: docs
primary: true
---

## Summary

The overview page of Parca, an open source continuous profiling
project: a server that stores profiles as labelled series and an
eBPF-based agent that profiles the whole machine.

## Key claims

- Definition. "Continuous profiling is the act of taking profiles (such as CPU, Memory, I/O and more) of programs in a systematic way." (Overview)
- Sampling because it's cheap enough to leave on. "Parca focuses on sampling profiling, because it can be done with very little overhead, and therefore can always be on in production environments." (What is profiling?)
- Raw data are stacks with values. "Raw data for sampling profiles are stack-traces, as well as values attached to those stack-traces." (What is profiling?)
- Why continuous: you don't know when you'll need it. "Simply said, much like with any other observability data, you never know at which point in time you are going to need profiling data, so always collect it at low overhead." (What is continuous profiling?)
- Sampling can miss parts of an execution; collecting continuously makes it statistically significant. "because of the nature of sampling profiling, it is possible that some parts of an execution are missed, therefore continuous profiling attempts to gather data continuously, so that with enough data it is statistically significant." (What is continuous profiling?)
- Three uses: saving money, understanding differences across time, processes or versions, and understanding incidents after the fact. "Collecting data in the past allows us to understand incidents even after they have happened and without manual capturing of profiling data." (When is continuous profiling useful?)
- Series are identified by profile type and labels, queried with label selectors. "Series of profiles in Parca are identified by their unique label combination." (Architecture)
- Push from an agent or pull over HTTP; Go made HTTP profile endpoints common. "Go has popularized having HTTP endpoints to request profiles from." (Architecture)
- Parca Agent is an eBPF whole-system profiler. (Components)
- Views are icicle graphs, upside-down flame graphs. (Architecture)

## Visuals worth redrawing

None.

## My notes

- Unversioned docs page.
