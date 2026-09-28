---
id: mcvoy-lmbench-1996
title: "lmbench: Portable Tools for Performance Analysis"
author: Larry McVoy, Carl Staelin
url: https://www.usenix.org/legacy/publications/library/proceedings/sd96/full_papers/mcvoy.pdf
published: 1996-01
accessed: 2026-09-28
kind: paper
primary: true
---

## Summary

The paper behind lmbench, the micro-benchmark suite for memory, OS and I/O
latencies. Its memory-latency section explains the different meanings of
"memory latency", why it measures back-to-back dependent loads, and the
pointer-chasing method that makes each cache level show up as a plateau.
USENIX 1996 Annual Technical Conference.

## Key claims

- Memory latency is often mismeasured. "memory latency is rarely accurately measured and frequently misunderstood." (6.1 Memory read latency background)
- Four definitions: chip cycle time, pin-to-pin, load-in-a-vacuum, back-to-back-load. "the most common, in increasing time order, are memory chip cycle time, processor-pins-to-memory-and-back time, load-in-a-vacuum time, and back-to-back-load time." (6.1)
- lmbench measures back-to-back loads because software can measure it and it's what developers mean. "lmbench measures back-to-back-load latency because it is the only measurement that may be easily measured from software" (6.1)
- The method: a linked list walked with `p = p->p_next`, so each load needs the previous one. (6.1, C fragment; 6.2 `mov r4,(r4)`)
- It varies array size and stride and times about a million loads. "The benchmark varies two parameters, array size and array stride." (6.2)
- Each plateau in the curve is one level of the hierarchy; where it rises marks the end of that level. "The curves contain a series of horizontal plateaus, where each plateau represents a level in the memory hierarchy." (6.2)
- TLB miss cost is left out because systems map different amounts of memory with their TLBs. "Measuring TLB miss time is problematic because different systems map different amounts of memory with their TLB hardware." (6.2)
- OS entry is measured by writing one word to /dev/null, because getpid and gettimeofday are too optimized. "Other entry points, typically getpid and gettimeofday, are heavily used, heavily optimized" (6.3 Operating system entry)
- Context switches are measured with a ring of 2 to 20 processes passing a token through pipes, subtracting the pipe cost. (6.6 Context switching)

## Visuals worth redrawing

- Figure 1: latency vs array size, one line per stride, with plateaus
  (DEC Alpha at 182 MHz). Our chase results make the same shape.

## My notes

- 1996 hardware; use for method, not numbers.
- Text read with pdftotext; WebFetch could not parse the PDF.
