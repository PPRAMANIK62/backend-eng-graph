---
id: vonbehren-events-bad-idea-2003
title: Why Events Are A Bad Idea (for high-concurrency servers)
author: Rob von Behren, Jeremy Condit, Eric Brewer
url: https://www.usenix.org/legacy/events/hotos03/tech/full_papers/vonbehren/vonbehren.pdf
kind: paper
primary: true
---

## Summary

A HotOS IX (2003) position paper from Berkeley, by people who had built
event-driven servers (Ninja, SEDA, Inktomi's Traffic Server). It argues
that the weaknesses blamed on threads come from particular thread
implementations, and that cheap user-level threads with compiler help
can match events while keeping straight-line code. Evidence: a tuned
user-level thread package that scales to 100,000 threads, and a small
threaded web server (Knot) that beats SEDA's event-driven Haboob. This
is the work that became Capriccio.

## Key claims

- Thesis: thread weaknesses are implementation artifacts. "the weaknesses of threads are artifacts of specific threading implementations and not inherent to the threading paradigm." (Abstract)
- Their user-level thread package scaled to 100,000 threads. "we present a user-level thread package that scales to 100,000 threads and achieves excellent performance in a web server." (Abstract)
- Lauer and Needham showed in 1978 that thread and message-passing (event) systems are duals. "Lauer and Needham attempted to end the discussion in 1978 by showing that message-passing systems and process-based systems are duals" (2 Threads vs. Events)
- Kernel thread switches cost more because of preemption and kernel crossings. "This overhead is due to both preemption, which requires saving registers and other state during context switches, and additional kernel crossings (in the case of kernel threads)." (2.2)
- The free synchronization of event loops comes from cooperative scheduling, and only holds on one CPU. "cooperative multitasking only provides “free” synchronization on uniprocessors, whereas many high-concurrency servers run on multiprocessors." (2.2 Synchronization)
- Threaded systems trade stack overflow risk against wasted address space. "Threaded systems typically face a tradeoff between risking stack overflow and wasting virtual address space on large stacks." (2.2 State Management)
- In event systems the programmer saves and restores live state by hand across calls, called stack ripping. "This process, referred to as “stack ripping” by Adya et al. [1], is a major burden for programmers who wish to use event systems." (3 Control Flow)
- A thread's call stack holds all live state for a task, which keeps debuggers useful. "the run-time call stack encapsulates all live state for a task, making existing debugging tools quite effective." (3)
- Fixing events tends to reinvent threads. "In many cases, fixing the problems with events is tantamount to switching to threads." (3 Just Fix Events?)
- They proposed dynamic stack growth using compiler analysis instead of fixed-size stacks. "We are developing a mechanism that allows the size of the stack to be adjusted at run time." (4.1)
- Their package turns blocking I/O into asynchronous I/O inside the library, with poll() for sockets and a thread pool for disk. "it translates blocking I/O requests to asynchronous requests internally." (5 Evaluation)
- Test setup: 2x2000 MHz Xeon, 1 GB RAM, Linux 2.4.20. "The test machine was a 2x2000 MHz Xeon SMP with 1 GB of RAM running Linux 2.4.20." (5)
- Knot reached nearly 700 Mbit/s; Haboob topped out at 500 Mbit/s and ran out of memory above 16,384 clients. "The steady-state bandwidth achieved by Knot-C is nearly 700 Mbit/s." (5); "Haboob's maximum bandwidth of 500 Mbit/s is significantly lower than Knot's" (5)
- The authors had built event-driven systems themselves. "We have made extensive use of events in several high-concurrency environments, including Ninja [16], SEDA [17], and Inktomi's Traffic Server." (1 Introduction)

## Visuals worth redrawing

- Figure 1, the Lauer and Needham table of dual notions (event handler
  vs monitor, SendMessage/AwaitReply vs procedure call, and so on). Could
  be redrawn as a two-column mapping.

## My notes

- 2003, Linux 2.4, poll() not epoll. The numbers only show that a good
  user-level thread package could match a good event server then.
- The Knot comparison used poll() for both because Haboob's socket
  library couldn't use epoll.
