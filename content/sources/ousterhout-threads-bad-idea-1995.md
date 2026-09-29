---
id: ousterhout-threads-bad-idea-1995
title: Why Threads Are A Bad Idea (for most purposes)
author: John Ousterhout
url: https://web.stanford.edu/~ouster/cgi-bin/papers/threads.pdf
kind: talk
primary: true
---

## Summary

Slides from a 1995 talk by John Ousterhout (then at Sun Microsystems
Laboratories). Threads are hard to program correctly; event-driven code is
easier and, on one CPU, faster. Use threads only where you need real
CPU concurrency. The classic statement of the "events" side.

## Key claims

- Threads are too hard for most programmers. "Too hard for most programmers to use." (What's Wrong With Threads?)
- The claim: events are better for most uses; threads only for true CPU concurrency. "Threads should be used only when true CPU concurrency is needed." (Introduction)
- Event-driven programming: one execution stream, a loop that waits for events and calls handlers. "Event loop waits for events, invokes handlers." (Event-Driven Programming)
- Handlers aren't preempted and should be short. "No preemption of event handlers." and "Handlers generally short-lived." (Event-Driven Programming)
- The main problem with events: a long handler freezes everything. "Long-running handlers make application nonresponsive." (Problems With Events)
- On one CPU, events avoid locking and context switches. "Events faster than threads on single CPU:" (Events vs. Threads, cont'd)
- Threads give true concurrency and scale on multiple CPUs. "Scalable performance on multiple CPUs." (Events vs. Threads, cont'd)
- Don't abandon threads: they matter for high-end servers like databases. "No: important for high-end servers (e.g. databases)." (Should You Abandon Threads?)
- Events are easy to start with: no concurrency, no preemption, no locks. "Easy to get started with events: no concurrency, no preemption, no synchronization, no deadlock." (Events vs. Threads)
- On one CPU, events avoid locks and context switches. "No locking overheads." and "No context switching." (Events vs. Threads, cont'd)

## Visuals worth redrawing

- The event loop with a ring of handlers; the "threaded kernel inside
  an event-driven app" picture.

## My notes

- 1995, single-CPU machines were the norm. The "faster on a single CPU"
  point is exactly the part that changed with multicore.
