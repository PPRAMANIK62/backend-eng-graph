---
id: ostep-process
title: "The Abstraction: The Process (Operating Systems: Three Easy Pieces, ch. 4)"
author: Remzi H. Arpaci-Dusseau, Andrea C. Arpaci-Dusseau
url: https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-intro.pdf
kind: book
primary: false
---

## Summary

Textbook chapter that defines a process as a running program and lists
what makes it up: its address space, its registers (including the
program counter and stack pointer) and its I/O state such as open files.
Covers how a program gets loaded, the three basic process states, and
the kernel's process list. Version 1.10, © 2008–23.

## Key claims

- A process is a running program. "a process is simply a running program" (4.1)
- The memory a process can address is its address space. "the memory that the process can address (called its address space) is part of the process." (4.1)
- Registers are part of a process's state, including the program counter and stack pointer. "the program counter (PC) (sometimes called the instruction pointer or IP) tells us which instruction of the program will execute next" (4.1)
- Open files are part of the process too. "Such I/O information might include a list of the files the process currently has open." (4.1)
- Early systems loaded the whole program before running it. "In early (or simple) operating systems, the loading process is done eagerly, i.e., all at once before running the program" (4.3)
- Modern systems load a program lazily, piece by piece as it's needed. "modern OSes perform the process lazily, i.e., by loading pieces of code or data only as they are needed during program execution." (4.3)
- Three simplified states: running, ready, blocked. "In a simplified view, a process can be in one of three states" (4.4)
- A process waiting on disk I/O is blocked so another can use the CPU. "when a process initiates an I/O request to a disk, it becomes blocked and thus some other process can use the processor." (4.4)
- The kernel keeps a process list; each entry is sometimes called a process control block. "Sometimes people refer to the individual structure that stores information about a process as a Process Control Block (PCB)" (4.5)
- Programs usually return zero on success. "usually, programs return zero in UNIX-based systems when they have accomplished a task successfully, and non-zero otherwise" (4.5)
- A finished process stays as a zombie until its parent collects the exit code with wait(). "in UNIX-based systems, this is called the zombie state" (4.5)

## Visuals worth redrawing

- Figure 4.2, Process: State Transitions (running, ready, blocked, with
  scheduled/descheduled and I/O initiate/done edges).
- Figure 4.1, loading a program from disk into a process's address space.

## My notes

- The mechanism vs policy aside (how to switch vs which to run) bridges
  to cpu-scheduler.
