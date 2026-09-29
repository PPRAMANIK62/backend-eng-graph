---
id: gregg-active-benchmarking
title: Active Benchmarking
author: Brendan Gregg
url: https://www.brendangregg.com/activebenchmarking.html
kind: docs
primary: true
---

## Summary

Brendan Gregg's methodology page (last updated 2014). Most benchmarks
are run "passively": started, left alone, and their number reported.
Active benchmarking means analyzing the system with other tools while
the benchmark runs, to find what actually limits it. Includes a
checklist of common ways a benchmark tests something other than what
it claims.

## Key claims

- The core problem. "casual benchmarking: you benchmark A, but actually measure B, and conclude you've measured C." (intro)
- Run long, steady. "If possible, configure the benchmark to run for a long duration in a steady state: e.g., hours." (Summary)
- Active benchmarking. "With active benchmarking, you analyze performance while the benchmark is still running (not just after it's done), using other tools." (Active Benchmarking)
- The test. "Can they explain why the benchmark result was X, and not 2X (twice as fast)? ie, what is the limiting factor?" (Active Benchmarking)
- Tools to use while it runs. "you may use any performance analysis tool that your OS provides: vmstat, iostat, mpstat, sar, top, tcpdump/snoop, perf, bcc+eBPF/DTrace/SystemTap, strace/truss, etc." (Active Benchmarking)
- A method to guide them. "The USE Method is especially suited for this, since it identifies typical limiters: hardware and software resources." (Active Benchmarking)
- Checklist item. "Throttled by the network between the benchmark client and the server." (Problem Checklist)
- Checklist item. "Testing different client or server software versions, when doing comparative benchmarking." (Problem Checklist)
- Checklist item. "Perturbed by other system events, including neighbors." (Problem Checklist)
- Checklist item. "Limited by the benchmark software being single threaded." (Problem Checklist)
- Checklist item. "Testing disk I/O instead of file system I/O." (Problem Checklist)
- Statistics don't rescue a wrong benchmark. "A sound statistical method can make benchmark results seem trustworthy, when in fact, they are false." (Statistical Analysis)

## Visuals worth redrawing

None.

## My notes

- Other checklist items: throttled by resource controls or by the
  network between client and server, different software versions,
  unrealistic workload.
