---
id: welsh-seda-2001
title: "SEDA: An Architecture for Well-Conditioned, Scalable Internet Services"
author: Matt Welsh, David Culler, Eric Brewer
url: https://www.sosp.org/2001/papers/welsh.pdf
kind: paper
primary: true
---

## Summary

The SOSP 2001 paper introducing SEDA, the staged event-driven
architecture. Section 2 is the useful part here: it measures a
thread-per-task server whose throughput collapses as threads grow,
explains why bounded thread pools avoid the collapse but queue clients
unfairly, and describes the event-driven alternative and its limits.

## Key claims

- In the threaded model each request takes a thread, and the OS overlaps compute and I/O by switching threads. "The operating system overlaps computation and I/O by transparently switching among threads." (2.1 Thread-based concurrency)
- Many threads cost cache and TLB misses, scheduling and lock contention. "the overheads associated with threading — including cache and TLB misses, scheduling overhead, and lock contention — can lead to serious performance degradation when the number of threads is large." (2.1)
- Figure 2: throughput rises with threads, then drops sharply; response time grows without bound. "As the number of concurrent tasks increases, throughput increases until the number of threads grows large, after which throughput degrades substantially." (Figure 2 caption)
- Figure 2's setup: pre-allocated threads, each doing an 8 KB read of a cached file, 4-way 500 MHz Pentium III, 2 GB, Linux 2.2.14. (Figure 2 caption)
- Bounded thread pools avoid the collapse by refusing connections past a limit. "When the number of requests in the server exceeds some fixed limit, additional connections are not accepted." (2.2 Bounded thread pools)
- But waiting clients queue in the network and can wait arbitrarily long. "when all server threads are busy or blocked, client requests queue up in the network for servicing." (2.2)
- A saturated pool can't tell which requests are the bottleneck, so it rejects work blindly. "all it knows is that the thread pool is saturated, and must arbitrarily reject work without knowledge of the source of the bottleneck." (2.2)
- Event-driven servers use a few threads, typically one per CPU, looping over events. "a server consists of a small number of threads (typically one per CPU) that loop continuously, processing events of different types from a queue." (2.3 Event-driven concurrency)
- Event-driven servers hold throughput flat past saturation; latency grows linearly instead. "The throughput remains constant across a huge range in load, with the latency of each task increasing linearly." (2.3)
- The model assumes handlers never block, but they can anyway. "event-processing threads can block regardless of the I/O mechanisms used, due to interrupts, page faults, or garbage collection." (2.3)
- Servers like Flash hand blocking file access to helper processes. "the main server process handles these events by dispatching them to helper processes via IPC." (2.3)
- Each task is a state machine driven by events, so the server keeps each task's state itself instead of in a thread. "In this way the server maintains its own continuation state for each task rather than relying upon a thread context." (2.3)

## Visuals worth redrawing

- Figure 2: throughput and latency against number of threads (log x
  axis), rising then collapsing. Only the shape is usable without the
  data.

## My notes

- Hardware and kernel from 2001; the shape of the curve, not the
  numbers, is what carries over. von Behren et al. (2003) repeated the
  benchmark and argued the collapse was the thread library's fault.
