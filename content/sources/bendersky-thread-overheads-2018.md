---
id: bendersky-thread-overheads-2018
title: Measuring context switching and memory overheads for Linux threads
author: Eli Bendersky
url: https://eli.thegreenplace.net/2018/measuring-context-switching-and-memory-overheads-for-linux-threads/
kind: blog
primary: false
---

## Summary

Measures what Linux threads cost: context switch time with pipe and
condition-variable ping-pong, and memory per thread (virtual vs resident
stack). Compares with goroutines. Haswell i7-4771. Independent
measurements with code, not from the kernel developers.

## Key claims

- A direct context switch, pinned to one core, took 1.2–1.5 µs. "somewhere between 1.2 and 1.5 microseconds per context switch, accounting only for the direct cost" (What does this mean / measurement section)
- Unpinned it went up to about 2.2 µs. "Without pinning, the switch time goes up to ~2.2 microseconds" (same)
- Pinning gives only a lower bound. "it's important to keep in mind this only models a lower bound." (same)
- For scale, memcpy of 64 KiB took 3 µs on the same machine. "a good comparison is memcpy, which takes 3 us for 64 KiB on the same machine." (What does this mean in practice?)
- Pipe echo between two threads: ~400,000 round trips/s pinned; unpinned, it halved. "if I don't pin the benchmark to a single core, the number of iterations per second halves." (same)
- Goroutines over a channel did ~2.8 million round trips/s, about 170 ns per switch, because no kernel switch is needed. "an estimate of ~170 ns switching between goroutines" (same)
- The default thread stack is 8 MiB of virtual memory, only backed by RAM when used; 10,000 threads showed ~80 GiB virtual and ~80 MiB resident. "the process uses ~80 GiB of virtual memory, with about 80 MiB of resident memory." (memory section)
- Stack size can be set with pthread_attr_setstacksize. (memory section)
- Early-2000s folklore about thread limits no longer holds. "a lot of folklore from the early 2000s doesn't apply today." (conclusion)
- 10,000 threads in one process is practical on a 2018 machine. "we can easily run 10,000 threads in a single process today, in production." (conclusion)

## Visuals worth redrawing

None needed.

## My notes

- Kernel and distro versions not stated in the parts read; hardware is
  Haswell i7-4771.
