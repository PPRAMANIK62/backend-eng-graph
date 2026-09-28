---
id: system-call
title: System calls
depth: deep
phase: 1
note: >-
  How a program asks the kernel to do something, and what crossing into
  the kernel costs.
needs: [process]
leads_to: [strace, file-descriptor]
compare_with: []
updated: 2026-09-28
---

# System calls

A system call is how a program asks the kernel to do something it isn't
allowed to do itself: read a file, send on a socket, start a
[[process]], ask for memory. Every request your server handles turns into
a stream of them. Each one crosses from your program into the kernel and
back, and that crossing has a price you can measure.

## Why a program can't just do it

Your program runs directly on the CPU at full speed. The kernel doesn't
interpret it or check each instruction. That's what makes it fast, but it
raises a problem: if the program runs on the hardware, what stops it from
reading the whole disk, or another process's memory?

The CPU enforces the answer. It has at least two modes. In **user mode**,
where your program runs, some instructions are off limits. Try to talk to
a disk directly and the CPU raises an exception, and the kernel will
probably kill your process. In **kernel mode**, where the kernel runs,
anything goes. If user code could do raw I/O, file permissions would mean
nothing: any process could read or write any block on the disk.

So when your program needs something only the kernel can do, it asks. A
system call is the one door between the two modes. Most operating systems
offer a few hundred of them; early Unix had about twenty.

## One `read()` from your code to the kernel and back

Say your server calls `read(fd, buf, 4096)` to get bytes from a socket.
Here's the path on x86-64 Linux.

1. **A normal function call into the C library.** `read` in your code is a
   plain function in libc (or in your language's runtime). It looks like
   any other call because, up to this point, it is one.
2. **Load the registers.** The wrapper puts the system call number in the
   `rax` register (0 means `read` on x86-64) and the arguments in `rdi`,
   `rsi`, `rdx` and, for calls with more arguments, `r10`, `r8`, `r9`.
   Every architecture has its own table of which registers to use.
3. **Trap into the kernel.** The wrapper runs the `syscall` instruction. The
   CPU switches to kernel mode and jumps to one fixed address. Your program
   doesn't get to pick that address. The kernel wrote it into a special CPU
   register (`MSR_LSTAR`) at boot, so user code can only enter the kernel
   at the front door, never halfway through a permission check.
4. **Find the handler.** The kernel's entry code saves your registers on the
   process's kernel stack, then uses the number in `rax` as an index into
   the system call table. Entry 0 is the kernel's `read`.
5. **Do the work.** The kernel checks that `fd` is one of your open
   [[file-descriptor|file descriptors]], finds what it refers to, and copies
   data into your buffer.
6. **Return.** The kernel restores your registers and returns to user mode.
   The result comes back in `rax`. If it failed, the wrapper turns the
   error into `errno` and returns -1.

![Two lanes, user mode above and kernel mode below. Your code calls read, the libc wrapper puts the call number in rax and the arguments in registers, and the syscall instruction crosses into the kernel's fixed entry point, which saves registers, looks up the handler in the system call table, and runs the kernel's read before restoring registers and returning with the result in rax.](img/system-call-read-path.svg)

*The path of one `read()` on x86-64 Linux. Adapted from David Drysdale, "Anatomy of a system call, part 1" (LWN, 2014).*

Older 32-bit x86 used a software interrupt, `int $0x80`, for step 3. It
goes through the processor's full interrupt-handling path, which is slow.
Newer CPUs added faster instructions for entering the kernel; x86-64 Linux
uses `syscall`. On 64-bit ARM, the instruction is `svc #0`.

## What a crossing costs

On the lab machine (Intel i5-13500H, Linux 7.1.9, pinned to one core), a
`getppid()` call, which does almost no work inside the kernel, took
**64 ns** per call (median of 11 runs of 10 million calls each). That's the price of the round
trip itself: the trap, saving and restoring registers, and the return. See
[experiment 0001](../../experiments/0001-latency-numbers-on-my-laptop.md).

For scale, from the same run: an L1 cache hit took about 1 ns and a RAM
access that missed every cache took about 104 to 125 ns. So an empty system
call costs about half a RAM miss. In 1996, on a 200 MHz P6 running Linux
1.3.37, a system call took about 4 µs.

64 ns is small on its own. It adds up when you make millions. A server that
reads a socket one byte at a time pays that crossing for every byte. Real
calls also do real work: a `read` that has to wait for the network or the
disk costs whatever that wait costs, and the crossing is noise next to it.

## The vDSO: some calls never enter the kernel

Some system calls are so frequent, and their answers so harmless, that
Linux doesn't make you cross at all. The classic one is asking the time.
Programs call `gettimeofday` and `clock_gettime` constantly, for
timestamps, timeouts and timing loops, and the answer isn't secret.

So the kernel maps a small shared library into every process, the
**vDSO**, and keeps the data needed to answer "what time is it?" in memory
the process can read. A call to `clock_gettime` goes to the vDSO and
becomes a normal function call plus a few memory reads. On x86-64 the vDSO
provides `clock_gettime`, `gettimeofday`, `time` and `getcpu`.

This matters when you measure. A loop of `gettimeofday` calls tells you
nothing about system call cost, because it never enters the kernel. That's
why the lab's test used `getppid` through the raw `syscall()` function.

## Meltdown made crossings more expensive

The Meltdown attack abuses the fact that the kernel and user code share
one address space, so that on affected CPUs user code can learn what's in
kernel memory. Linux's fix is **page table
isolation** (PTI, first called KAISER). While your program runs, it uses
page tables that map almost none of the kernel. Every entry to the kernel,
whether a system call, an interrupt or an exception, switches to the full
kernel page tables, and every exit switches back.

That switch is a write to the CPU's `CR3` register, on the order of a
hundred cycles, on every entry and every exit. Worse, on CPUs without a
feature called PCID, each switch flushes the whole TLB, the CPU's cache of
address translations (see [[virtual-memory]]), and it has to refill after
every system call.

How much this hurts depends on how often you cross. Measurements at Netflix
on Linux 4.14 in early 2018 found:

- at 50,000 system calls per second per CPU, about 2% overhead, climbing
  with the rate
- working sets over about 10 MB cost more, because of the TLB flushes
- at 5,000 calls per second per CPU with a 100 MB working set: about 2.1%
  on the 4.4 and 4.9 LTS kernels, which lack PCID support, about 0.5% on 4.14 with PCID, and a 3%
  gain once huge pages were added
- in the worst microbenchmark case without PCID, over 800%

Many of their services made under 10,000 calls per second per CPU, so the
cost there was expected to be under 0.5%. Proxies, databases and anything
doing lots of tiny I/O were the ones at risk.


## Where it gets tricky

**There's no single "Meltdown tax".** One part of the cost, losing global
TLB entries for the kernel, stays under 1%. The whole cost in the Netflix
measurements ran from under 0.5% to over 800%. Each figure covers a
different part of the cost on a different workload.
The honest answer is that it depends on your call rate, your working set
and your CPU, and you have to measure it.

**A system call isn't a context switch.** Crossing into the kernel and back
keeps the same process on the same core; it saves and restores registers,
but it doesn't change which process runs. A [[context-switch]] happens when
the kernel decides to run something else, which it can do while it's
inside a system call that has to wait. The lab numbers show the gap: 64 ns
for an empty call against 1.7 µs for a pipe round trip that forces two
switches.

**The library call isn't the system call.** A library call can end up
making no system call at all, as with the vDSO. To see what really crosses into the kernel, watch it with
[[strace]].

**Old walkthroughs name old files.** The best step-by-step tour of the
x86-64 path (LWN, 2014) names kernel files and functions that have since
been reorganized. The path is the same; the names aren't.

## What this means when you build

- Count your crossings, not just your calls. Reading in big chunks instead
  of small ones cuts system calls, and each one saved is at least tens of
  nanoseconds, plus whatever PTI adds on your hardware.
- A service that makes hundreds of thousands of tiny I/O calls per second
  per core is the kind that pays for kernel crossings. Most request-response
  services aren't close.
- Getting the time is cheap on Linux, thanks to the vDSO. Don't avoid
  timestamps for speed.
- Measure system call cost on your own machine with a call that really
  enters the kernel, and pin to one core.
- When a program is slow and you don't know why, look at which system calls
  it makes and how many. That's the job of [[strace]].

## Further reading

- [Mechanism: Limited Direct Execution (Operating Systems: Three Easy Pieces, ch. 6)](https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-mechanisms.pdf), Remzi and Andrea Arpaci-Dusseau, 2023. User mode, kernel mode, the trap and the trap table, from first principles.
- [Anatomy of a system call, part 1](https://lwn.net/Articles/604287/), David Drysdale, 2014. The x86-64 path of a `read()` through the kernel's own code.
- [syscall(2)](https://man7.org/linux/man-pages/man2/syscall.2.html), Linux man-pages, 2026. Which instruction and registers each architecture uses.
- [vdso(7)](https://man7.org/linux/man-pages/man7/vdso.7.html), Linux man-pages, 2025. Why some calls never enter the kernel.
- [Page Table Isolation (PTI)](https://docs.kernel.org/arch/x86/pti.html), Linux kernel documentation. What the Meltdown fix does on every kernel entry and exit, and what it costs.
- [KPTI/KAISER Meltdown Initial Performance Regressions](https://www.brendangregg.com/blog/2018-02-09/kpti-kaiser-meltdown-performance.html), Brendan Gregg, 2018. How the cost depends on syscall rate and working set, measured.
