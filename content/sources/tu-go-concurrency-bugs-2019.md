---
id: tu-go-concurrency-bugs-2019
title: Understanding Real-World Concurrency Bugs in Go
author: Tengfei Tu, Xiaoyu Liu, Linhai Song, Yiying Zhang
url: https://songlh.github.io/paper/go-study.pdf
kind: paper
primary: true
---

## Summary

ASPLOS 2019. The first systematic study of concurrency bugs in real Go
programs: 171 bugs from Docker, Kubernetes, etcd, gRPC, CockroachDB and
BoltDB. Sorts them by cause (shared memory vs message passing) and
behavior (blocking vs non-blocking), and tests Go's built-in deadlock
detector and race detector on them.

## Key claims

- Scope. "We analyzed 171 concurrency bugs in total, with more than half of them caused by non-traditional, Go-specific problems." (Abstract)
- Go encourages channels over shared memory on the belief that message passing is less error-prone. (Introduction)
- Main finding. "Surprisingly, our study shows that it is as easy to make concurrency bugs with message passing as with shared memory, sometimes even more." (Introduction)
- "around 58% of blocking bugs are caused by message passing." (Introduction)
- Figure 1 (Kubernetes): a child goroutine sends its result on an unbuffered channel; the parent's select takes a timeout and returns; nobody receives, so the child blocks forever. The fix was a buffer of 1. "The fix is to change ch from an unbuffered channel to a buffered one, so that the child goroutine can always send the result even when the parent has exit." (Introduction)
- Around 42% of blocking bugs come from protecting shared memory, 58% from message passing, although shared-memory primitives are used more. (5.1)
- "Observation 3: Contrary to the common belief that message passing is less error-prone, more blocking bugs in our studied Go applications are caused by wrong message passing than by wrong shared memory protection." (5.1)
- Go's built-in deadlock detector reports only when no goroutine can make progress. "it reports deadlock when no goroutines in a running process can make progress." (5.3)
- It found 2 of the reproduced blocking bugs. "The built-in deadlock detector can only detect two blocking bugs, BoltDB#392 and BoltDB#240, and fail in all other cases" (5.3)
- Why: it ignores the case where some goroutines still run, and doesn't consider goroutines waiting on other system resources. (5.3)
- "Observation 8: There are much fewer non-blocking bugs caused by message passing than by shared memory accesses." (section 6, non-blocking bugs)
- Go's race detector uses ThreadSanitizer's happens-before algorithm; it found 7 of 13 traditional non-blocking bugs and 3 of 4 caused by anonymous functions, running each program 100 times. (6.3)
- Why the race detector missed bugs: not every non-blocking bug is a data race, detection depends on the interleaving in the run, and it keeps only four shadow words per memory object. "First, not all non-blocking bugs are data races; the race detector was not designed to detect these other types." (6.3)

## Visuals worth redrawing

- Figure 1, the leaked goroutine with an unbuffered channel and a
  timeout.

## My notes

- The bugs are from the Go versions of the time (up to 2019). Go 1.22
  changed loop variable capture; not checked against this paper.
