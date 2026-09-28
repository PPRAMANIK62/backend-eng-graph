---
id: page-faults
title: Page faults
depth: short
phase: 1
note: >-
  What happens when a program touches a page that isn't in RAM yet.
  Minor vs major faults.
needs: [virtual-memory]
leads_to: []
compare_with: []
---

# Page faults

A page fault is the CPU stopping your program because it touched an
address it can't translate right now, and handing control to the kernel
to sort it out. Most page faults aren't errors. They're how memory gets
filled in: a program takes one the first time it touches each page it
uses. The ones
that need the disk are the ones that hurt latency.

## What happens on a fault

With [[virtual-memory]], every load and store goes through the MMU, which
looks up the translation in the TLB or walks the page tables. A fault
happens when that lookup can't finish, for one of two reasons:

- the page isn't in physical memory (no frame mapped yet, or it was moved
  out), or
- the access isn't allowed (writing a read-only page, touching an address
  the process doesn't own).

The MMU raises an exception. The CPU pauses the current instruction and
runs the kernel's fault handler. On Linux every architecture ends up in
the same function, `handle_mm_fault()`, which finds or allocates any
missing levels of the page table, then handles the page itself as a read
fault, a copy-on-write fault or a shared fault. If it all works out, the
access goes through and the program never knows.

If the address isn't one the process may touch, the kernel sends
`SIGSEGV` to the thread, and that usually ends the process. That's the
segmentation fault you've seen (see [[signals]]).

![A flowchart of one load or store. A TLB hit completes the access. On a miss the hardware walks the page tables; if the page is present and allowed, the access completes. Otherwise a page fault runs the kernel handler: a valid address gets a zero page, a copy or a disk read and the instruction is retried; an invalid one gets SIGSEGV.](img/page-faults-flow.svg)

*What happens on every memory access, and where a page fault fits in. Only the invalid-address branch is an error.*

## Faults are how memory gets filled in

The kernel is lazy on purpose. When a program asks for memory, the kernel
mostly just notes that the range is allowed and maps nothing. The first
touch of each page faults, and only then does the kernel find a frame for
it. This is called lazy allocation. Copy-on-write is the other planned
cause: a write to a page that is still shared faults, and the kernel
handles it as a copy-on-write fault.

Both of these are normal and expected. A third cause, pages that were
swapped out to disk under memory pressure, is expected too, but it's a
sign something is already going wrong: swapping happens only when memory
is tight. If the kernel can't free enough memory at all, it calls the
out-of-memory killer, which ends processes until there's room.

## Minor and major faults

Linux counts two kinds, and the difference is whether the fault needed
I/O.

- A **minor** (soft) fault is handled without any I/O. The kernel finds or
  reuses a frame in memory and fixes up the page table. First touches of
  fresh memory and copy-on-write copies are this kind.
- A **major** (hard) fault had to wait for I/O: reading a swapped-out page
  back, or reading file data from a device for a mapped file (see
  [[mmap]] and [[page-cache]]).

The cost gap is the gap between RAM and storage. A major fault includes at
least one read from the device. On the lab laptop, one random 4 KiB read
from the NVMe SSD took 49.8 µs at the median and 249 µs at the 99.9th
percentile ([experiment 0001](../../experiments/0001-latency-numbers-on-my-laptop.md)).
A thread stuck in a major fault on a request path adds that straight to
the request's latency. We haven't measured what a minor fault costs on
this machine yet.

## Counting them

The `getrusage()` system call returns both counters for a process:
`ru_minflt` for minor faults and `ru_majflt` for major ones.
`RUSAGE_SELF` sums all threads of the process; `RUSAGE_THREAD` (Linux
2.6.26 and later) gives one thread. A steady climb in `ru_majflt` means
the process keeps waiting on storage.

## Where it gets tricky

The official definition of a minor fault is worded narrowly, as a fault
where I/O is avoided by reclaiming a frame from the list of pages waiting
to be reused. That's one case. The rule to keep is the broader one in the
same definition: no I/O means minor. Lazy allocation and copy-on-write
faults need no I/O either, so they land in the minor count.

The word "fault" also misleads. A page fault on a valid address is not a
bug. Only faults on addresses the process isn't allowed to touch become
crashes.

## What this means when you build

- Expect a burst of minor faults at startup and whenever a process grows
  into new memory. If that burst lands on requests, touch the memory
  before taking traffic.
- Watch major faults on servers. Any steady rate on a service that should
  live in RAM means it's reading pages from disk, and each one can cost
  tens to hundreds of microseconds.
- A crash with `SIGSEGV` is a page fault the kernel refused to fix.

## Further reading

- [Page Tables](https://docs.kernel.org/mm/page_tables.html), Linux kernel developers. The section "MMU, TLB, and Page Faults" walks the fault path through the kernel and lists the normal causes.
- [getrusage(2) — Linux manual page](https://man7.org/linux/man-pages/man2/getrusage.2.html), Linux man-pages project, 2026. The official minor and major fault counters and how to read them.
