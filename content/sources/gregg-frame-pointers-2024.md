---
id: gregg-frame-pointers-2024
title: The Return of the Frame Pointers
author: Brendan Gregg
url: https://www.brendangregg.com/blog/2024-03-17/the-return-of-the-frame-pointers.html
kind: blog
primary: true
---

## Summary

A 2024 post on why profilers show broken stacks on Linux and what changed:
gcc stopped emitting frame pointers by default in 2004, most distro
libraries were built without them, and stack walking stopped at those
layers. Fedora and Ubuntu 24.04 turned frame pointers back on for their
packages. It gives the overhead numbers people reported and the
alternatives (LBR, DWARF, eBPF stack walkers).

## Key claims

- A common silent failure: libc without frame pointers cuts stacks short. "The problem is that this system has a default libc that has been compiled without frame pointers, so any stack walking stops at the libc layer, producing a partial stack that's missing the application frames." (intro)
- In his example 15% of samples were misplaced under "[unknown]". "But there are 15% of samples on the left, above "[unknown]", that are in the wrong place and missing frames." (intro) [inner quotes around [unknown]]
- Off-CPU flame graphs suffer most. "Off-CPU flame graphs, for example, can be dominated by libc read/write and mutex functions, so without frame pointers end up mostly broken." (intro)
- Fedora and Ubuntu now build libc and more with frame pointers. "Fedora and Ubuntu are releasing versions that fix it, by compiling libc and more with frame pointers by default." (intro)
- Ubuntu 24.04 LTS enables them by default. "Ubuntu has also announced frame pointers by default in Ubuntu 24.04 LTS." (2023, 2024 section)
- What a frame pointer is: the %rbp register pointing at the current stack frame, which profilers follow to walk the stack; the x86-64 ABI makes it optional. (What are frame pointers?)
- The 2004 gcc change stopped generating frame pointers (first for i386), later applied to x86-64. (2004: Their removal; 2005-2023)
- Linux distributions then built their binaries and libraries without them. "This is exactly what happened on Linux, not just /usr/bin but also /usr/lib and application code!" (2005-2023)
- Overhead of adding frame pointers to libc and Java at Netflix. "The overhead of adding frame pointers to everything (libc and Java) was usually less than 1%, with one exception of 10%." (2015-2020: Overhead)
- Others reported about 1% and 2%; microbenchmarks can hit 10%. "Others have reported around 1% and around 2%." (2015-2020: Overhead)
- Go already uses frame pointers by default. "There were ways to get Golang to support frame pointers, but that became the default years ago." (2023, 2024 section)
- Java needs -XX:+PreserveFramePointer. "Java, for example, has the -XX:+PreserveFramePointer option." (2023, 2024 section)
- LBR is limited to 16 or 32 frames. "Intel's hardware feature that was limited to 16 or 32 frames." (2034+: Beyond Frame Pointers)
- DWARF walking is expensive at runtime. "The overhead just to walk DWARF is also high, as it was designed for non-realtime use." (2034+: Beyond Frame Pointers)
- Real stacks are usually deeper than LBR can hold. "Most application stacks are deeper, so this can't be used to build flame graphs, but it is better than nothing." (2034+: Beyond Frame Pointers)
- Microbenchmarks can show a bigger cost. "Microbenchmarks can be" (2015-2020: Overhead; the sentence goes on to put them at 10%)

## Visuals worth redrawing

- The partly broken flame graph with "[unknown]" towers on the left.

## My notes

- "Default years ago" for Go isn't pinned to a version in this post; don't
  give one.
