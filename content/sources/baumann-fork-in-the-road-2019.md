---
id: baumann-fork-in-the-road-2019
title: A fork() in the road
author: Andrew Baumann, Jonathan Appavoo, Orran Krieger, Timothy Roscoe
url: https://www.microsoft.com/en-us/research/wp-content/uploads/2019/04/fork-hotos19.pdf
kind: paper
primary: true
---

## Summary

HotOS 2019 position paper arguing that fork() is a poor fit for modern
systems (threads, large address spaces, security) and should stop being
the default way to create a process, in favour of spawn-style calls.
Includes a measurement of fork+exec cost against the parent's size.

## Key claims

- Known problems with fork: not thread-safe, slow and unscalable. "Generally acknowledged problems with fork include that it is not thread-safe, it is inefficient and unscalable" (introduction)
- A forked child has one thread, a copy of the caller. "a child created by fork has only a single thread (a copy of the calling thread)." (section "Fork isn't thread-safe")
- The child inherits everything by default, so the programmer must strip what it shouldn't have (close file descriptors, scrub secrets). "By default, a forked child inherits everything from its parent" (section "Fork is insecure")
- fork+exec cost grows with the parent's size; posix_spawn doesn't. "posix_spawn() takes the same time (around 0.5 ms) regardless of the parent's size or memory layout." (Figure 1 discussion; Ubuntu 16.04.3, i7-6850K at 3.6 GHz)
- Dirty pages in the parent have to be marked read-only for copy-on-write, which is part of why fork gets slower with a bigger parent. "The dirty line shows the cost of forking a process with dirty pages, which must be downgraded to read-only for copy-on-write mappings." (Figure 1 discussion)
- fork pushes systems toward memory overcommit; Redis, which forks to persist, advises against turning overcommit off. "Redis, which uses fork for persistence, explicitly advises against disabling memory overcommit" (section "Fork encourages memory overcommit")

## Visuals worth redrawing

- Figure 1: fork+exec time vs parent process size (dirty, fragmented,
  and posix_spawn lines).

## My notes

- A position paper, so it argues one side. Good for "Where it gets
  tricky", not as the main explanation.
