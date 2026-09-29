---
id: go-runtime-source
title: Go runtime source, src/runtime (Go 1.26)
author: The Go Authors
url: https://github.com/golang/go/tree/release-branch.go1.26/src/runtime
kind: code
primary: true
---

## Summary

The Go runtime's own source on the Go 1.26 release branch. The comments
at the top of `proc.go` (scheduler), `stack.go` (goroutine stacks),
`preempt.go` (preemption), `netpoll.go` and `netpoll_epoll.go` (network
poller) and the `p` struct in `runtime2.go` describe how goroutines are
run on OS threads. Read for the G/M/P model, run queues, work stealing,
system call handoff, preemption, stack growth and how blocked network
reads park a goroutine.

## Key claims

- The scheduler spreads ready goroutines over worker threads. "The scheduler's job is to distribute ready-to-run goroutines over worker threads." (proc.go, "Goroutine scheduler" comment)
- Three concepts: G is a goroutine, M an OS worker thread, P a processor needed to run Go code. "P - processor, a resource that is required to execute Go code." (proc.go)
- An M needs a P to run Go code but can sit in a system call without one. "M must have an associated P to execute Go code, however it can be blocked or in a syscall w/o an associated P." (proc.go)
- Scheduler state is spread out on purpose, with a run queue per P. "scheduler state is intentionally distributed (in particular, per-P work queues)" (proc.go, "Worker thread parking/unparking")
- Idle threads spin looking for work before parking. "Spinning threads spin on looking for work in per-P run queues and timer heaps or from the GC before parking." (proc.go)
- Each P's local run queue holds 256 goroutines. `runq [256]guintptr` with the comment "Queue of runnable goroutines. Accessed without lock." (runtime2.go, type p)
- A goroutine readied by the running one goes into `runnext` and runs next, so goroutines that talk to each other get scheduled as a unit. "If a set of goroutines is locked in a communicate-and-wait pattern, this schedules that set as a unit" (runtime2.go, runnext)
- Every 61st scheduling tick a P checks the global queue so two goroutines can't hog the local queue. "Check the global runnable queue once in a while to ensure fairness." (proc.go, findRunnable; the check is `pp.schedtick%61 == 0`)
- An idle P steals from other Ps' run queues (`runqsteal` in findRunnable). (proc.go)
- A goroutine gets a 10 ms time slice before it is preempted. "forcePreemptNS is the time slice given to a G before it is preempted." with `const forcePreemptNS = 10 * 1000 * 1000 // 10ms` (proc.go)
- If a P is stuck in a system call, sysmon takes the P away and hands it to another thread. "If pp is in a syscall, preemptone doesn't work." and "Handoff the P for some other thread to run it." (proc.go, retake)
- The P is retaken after the syscall has lasted more than one sysmon tick. "Retake the P if it's there for more than 1 sysmon tick (at least 20us)." (proc.go, retake)
- Async preemption uses signals. "The runtime can stop a goroutine at an async safe-point using a signal." (preempt.go)
- Synchronous preemption reuses the stack bound check in function prologues. "Synchronous safe-points are implemented by overloading the stack bound check in function prologues." (preempt.go)
- The smallest goroutine stack is 2048 bytes. `stackMin = 2048` with the comment "The minimum size of stack used by Go code" (stack.go)
- Each function compares the stack pointer with a guard to check for overflow. "Each function compares its stack pointer against g->stackguard to check for overflow." (stack.go, header comment)
- When a stack runs out it's reallocated at twice the size and copied (`newsize := oldsize * 2` in newstack, then `copystack`, which adjusts pointers into the old stack). (stack.go)
- Stacks shrink by half when a goroutine uses less than a quarter. "shrink the stack if gp is using less than a quarter of its current stack." (stack.go, shrinkstack)
- cgo calls go through the same system call entry as ordinary syscalls, so a long cgo call holds its M like a blocking syscall. "Standard syscall entry used by the go syscall library and normal cgo calls." (proc.go, comment above entersyscall)
- The network poller is built on epoll/kqueue and registers each fd for edge-triggered notifications. "Arm edge-triggered notifications for fd." (netpoll.go); on Linux `linux.EPOLLIN | linux.EPOLLOUT | linux.EPOLLRDHUP | linux.EPOLLET` (netpoll_epoll.go, netpollopen)
- `netpoll` returns the list of goroutines whose I/O is ready. "Return a list of goroutines built by calling netpollready" (netpoll.go)
- A goroutine waiting on a socket is parked on a semaphore in the fd's poll descriptor. "pollDesc contains 2 binary semaphores, rg and wg, to park reader and writer goroutines respectively." (netpoll.go)
- New goroutines start at startingStackSize, which is the fixed minimum or, with adaptivestackstart on (the default, `debug.adaptivestackstart = 1` in runtime1.go), the average stack size scanned during the last GC. "startingStackSize is updated every GC by tracking the average size of stacks scanned during the GC." (stack.go, startingStackSize)

## Visuals worth redrawing

None in the source. The G/M/P model (Ps with local run queues, Ms
attached to Ps, a global queue, the netpoller, an M in a syscall without
a P) is the natural figure.

## My notes

- Read on the release-branch.go1.26 files. Line numbers move between
  versions; the comments quoted have been stable for years.
- The design doc behind P is Vyukov's "Scalable Go Scheduler Design Doc"
  (vyukov-go-scheduler-2012).
