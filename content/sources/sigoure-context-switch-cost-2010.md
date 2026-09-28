---
id: sigoure-context-switch-cost-2010
title: How long does it take to make a context switch?
author: Benoit Sigoure (tsuna)
url: https://blog.tsunanet.net/2010/11/how-long-does-it-take-to-make-context.html
kind: blog
primary: false
---

## Summary

Measures system call and context switch cost on Intel server CPUs from
Woodcrest (2006-era) to Sandy Bridge, on Ubuntu kernels 2.6.24 to 3.4,
using futex ping-pong between two processes or threads, pinned and
unpinned. Then shows the indirect cost: cache and TLB pollution grows with
working set size. Updated 2011 and 2013 with more CPUs. Independent
measurements with code.

## Key claims

- A system call is only a mode switch, not a full context switch. "system calls don't actually cause a full context switch anymore nowadays, the kernel can get away with a \"mode switch\"" (First idea: with syscalls)
- gettid cost 52–105 ns depending on CPU. "Intel X5550: 52ns/syscall" and "Intel 5150: 105ns/syscall" (First idea: with syscalls)
- Unpinned futex context switches cost ~3,000–4,500 ns, including the futex system calls. "Intel E5520: ~4500ns/context switch" (Second idea: with futex)
- The real cost is cache damage. "In practice context switching is expensive because it screws up the CPU caches (L1, L2, L3 if you have one, and the TLB – don't forget the TLB!)." (Second idea: with futex)
- Pinned to one core, switches cost ~1,100–1,900 ns. "Intel E5440: ~1300ns/process context switch, ~1100ns/thread context switch" (CPU affinity)
- Thread switches were 5–20% cheaper than process switches, and the gap grew on newer CPUs. "The performance gap between thread switches and process switches seems to increase with newer CPU generations" (CPU affinity)
- Switching between processes reloads CR3, which flushes the TLB on x86. "Writing to CR3 automatically causes a TLB flush on x86." (Threads vs. processes)
- Threads with different working sets still pollute each other's caches. "different threads tend to have different working sets, so even if you skip this step, you still end up polluting the L1/L2/L3/TLB caches." (Threads vs. processes)
- Once the working set grows past L1, the cost per switch climbs; pinning both processes to one core was an order of magnitude faster in that test. "It's an order of magnitude faster when pinning both processes on the same core!" (Indirect costs)
- Rule of thumb for worst case: about 30 µs of CPU per switch. "My rule of thumb is that it'll cost you about 30µs of CPU overhead." (Parting words)
- Too many threads fighting for CPU waste cycles switching. "Applications that create too many threads that are constantly fighting for CPU time ... can waste considerable amounts of CPU cycles" (Parting words)
- Suggested sweet spot: as many worker threads as hardware threads, with non-blocking code. "I think the sweet spot for optimal CPU use is to have the same number of worker threads as there are hardware threads" (Parting words)
- A switched-out thread also waits in the run queue until a core is free. "after being switched out, even if your process becomes runnable, it'll have to wait in the kernel's run queue until a CPU core is available for it." (Parting words)

## Visuals worth redrawing

- Time per context switch vs working set size, pinned vs unpinned (the
  5150 and i7 graphs, log x axis).

## My notes

- Old kernels (2.6.x to 3.4) and old CPUs. Use for the shape of the
  costs, not the exact numbers. The 30 µs rule is his judgement, not a
  measurement.
