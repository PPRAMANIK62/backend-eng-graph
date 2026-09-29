---
id: vyukov-go-scheduler-2012
title: Scalable Go Scheduler Design Doc
author: Dmitry Vyukov
url: https://docs.google.com/document/d/1TTj4T2JO42uD5ID9e89oa0sLKhJYD0Y_kqxDv3I3XMw/edit
kind: docs
primary: true
---

## Summary

The 2012 design document (linked from `proc.go` as golang.org/s/go11sched)
that introduced P, the "processor", into the Go scheduler and replaced a
single global run queue and lock with per-P run queues and work
stealing. Short and readable. It explains why an OS thread blocked in a
system call shouldn't hold the resources needed to run Go code.

## Key claims

- The old scheduler limited scalability of servers. "Current goroutine scheduler limits scalability of concurrent programs written in Go, in particular, high-throughput servers and parallel computational programs." (Problems with current scheduler)
- Measured symptom: a server maxed out at 70% CPU on 8 cores, with 14% in futex. "Vtocc server maxes out at 70% CPU on 8-core box, while profile shows 14% is spent in runtime.futex()." (Problems with current scheduler)
- The old design had one global mutex. "Single global mutex (Sched.Lock) and centralized state." (Problems, 1)
- Threads blocked in syscalls kept caches they didn't need; the ratio of all Ms to Ms running Go code could reach 100 to 1. "A ratio between M's running Go code and all M's can be as high as 1:100." (Problems, 3)
- Threads were blocked and unblocked too often around syscalls. "In presence of syscalls worker threads are frequently blocked and unblocked." (Problems, 4)
- The fix: add P and a work-stealing scheduler on top. "The general idea is to introduce a notion of P (Processors) into runtime and implement work-stealing scheduler on top of Processors." (Design, Processors)
- An M needs a P only while running Go code. "When M is idle or in syscall, it does not need P." (Design, Processors)
- There are exactly GOMAXPROCS Ps. "There is exactly GOMAXPROCS P's." (Design, Processors)
- New or readied goroutines go on the current P's list; an empty P steals half of a random victim's queue. "if the list is empty, P chooses a random victim (another P) and tries to steal a half of runnable goroutines from it." (Design, Scheduling)
- When an M enters a syscall, another M must be ready to run Go code. "when an M enters syscall, it must ensure that there is another M to execute Go code." (Design, Syscalls/M Parking and Unparking)
- It chooses spinning (burning some CPU) over promptly blocking and unblocking threads. "The idea is to use spinning and do burn CPU cycles." (Design, Syscalls/M Parking and Unparking)

## Visuals worth redrawing

None in the doc. The P/M/G picture in go-runtime-source is the one to draw.

## My notes

- Opened via the export of the Google Doc that golang.org/s/go11sched
  redirects to. This is a 2012 design; the current code (Go 1.26) keeps
  the P model and work stealing but has changed many details (runnext,
  the fairness check, async preemption).
