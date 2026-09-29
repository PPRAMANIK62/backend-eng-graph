---
id: meta-cgroup2-memory-controller
title: Memory Controller (cgroup2 docs)
author: Meta (Facebook) cgroup2 documentation
url: https://facebookmicrosites.github.io/cgroup2/docs/memory-controller.html
kind: docs
primary: true
---

## Summary

Meta's guide to the cgroup2 memory controller, from the team that built
much of cgroup2 and PSI, with their fbtax2 production setup as the case
study: memory.low to protect the main workload rather than memory.high
on system services, and why you measure memory.current under pressure.

## Key claims

- memory.current includes page cache, kernel structures and network buffers. "It includes page cache, in-kernel data structures such as inodes, and network buffers." (Core interface files)
- memory.high is the main control; memory.max the last line. "memory.max is the memory usage hard limit, acting as the final protection mechanism" (Core interface files)
- Limiting system services with memory.high made them thrash and OOM. "The problem was that restricting memory on these system binaries made them more prone to thrashing and OOMs." (memory.high)
- They switched to memory.low to protect the main workload instead. "the team instead used memory.low to soft-guarantee memory to workload.sliceand to a lesser extent workload-support.slice" (memory.low)
- Read memory.current under pressure, because the kernel hoards memory when idle. "To get an accurate result, it's necessary to read memory.current when the system is under some memory pressure, due to the way the kernel hoards resources when it's idle." (Determining working set size)
- memory.pressure (PSI) measures time lost to lack of memory. "a measurement of the CPU time lost due to lack of memory" (Monitoring and utility interface files)

## Visuals worth redrawing

None.

## My notes

- "Hoards when idle" is the page cache point: an idle cgroup's
  memory.current looks big because cache fills free memory.
- Host sizes in the case study (32G etc.) are theirs; not used.
