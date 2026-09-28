---
id: ostep-limited-direct-execution
title: "Mechanism: Limited Direct Execution (Operating Systems: Three Easy Pieces, ch. 6)"
author: Remzi H. Arpaci-Dusseau, Andrea C. Arpaci-Dusseau
url: https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-mechanisms.pdf
kind: book
primary: false
---

## Summary

How the OS lets programs run directly on the CPU while keeping control:
user mode vs kernel mode, the trap instruction behind every system call,
the trap table set at boot, the timer interrupt, and the context switch
that saves one process's registers and restores another's. Includes a
measurement homework and historical syscall/switch timings. Version 1.10.

## Key claims

- A system call looks like a procedure call because it is one, into the C library, which runs the trap instruction. "it is a procedure call, but hidden inside that procedure call is the famous trap instruction." (6.2, aside "Why System Calls Look Like Procedure Calls")
- The library puts arguments and the syscall number in agreed places, then traps. "puts the system-call number into a well-known location as well (again, onto the stack or a register), and then executes the aforementioned trap instruction." (6.2 aside)
- User mode can't do I/O directly; trying raises an exception. "when running in user mode, a process can't issue I/O requests; doing so would result in the processor raising an exception" (6.2)
- A process that tries a privileged operation in user mode is likely killed. "the OS would then likely kill the process." (6.2)
- Early Unix offered about twenty system calls. "concise subset of around twenty calls." (6.2)
- Kernel mode can do anything. "In this mode, code that runs can do what it likes, including privileged operations such as issuing I/O requests" (6.2)
- Letting any process do raw I/O would break protections like file permissions. "a process could simply read or write the entire disk and thus all protections would be lost." (6.2)
- Most OSes offer a few hundred system calls; early Unix had about twenty. "Most operating systems provide a few hundred calls" (6.2)
- The kernel sets up a trap table at boot, so user code can't choose where to jump in the kernel. "The kernel does so by setting up a trap table at boot time." (6.2)
- A timer interrupt lets the OS take the CPU back from a process that never makes a system call. "A timer device can be programmed to raise an interrupt every so many milliseconds" (6.3, "A Non-Cooperative Approach")
- The OS regains control either through a system call or a timer interrupt, then the scheduler decides whether to switch. "This decision is made by a part of the operating system known as the scheduler" (6.3, "Saving and Restoring Context")
- A context switch saves a few registers of the current process and restores those of the next. "all the OS has to do is save a few register values for the currently-executing process (onto its kernel stack, for example) and restore a few for the soon-to-be-executing process" (6.3)
- In 1996, on Linux 1.3.37 with a 200 MHz P6, a system call took about 4 µs and a context switch about 6 µs; modern systems are sub-microsecond. "system calls took roughly 4 microseconds, and a context switch roughly 6 microseconds" (aside "How Long Context Switches Take", end of 6.4)
- OS operations don't all track CPU speed; many are memory-bound. "many OS operations are memory intensive, and memory bandwidth has not improved as dramatically as processor speed over time" (aside "How Long Context Switches Take")
- Measuring: time many calls and divide; watch timer precision; for context switches, pin both processes to one CPU (sched_setaffinity), as lmbench does with two pipes. (Homework (Measurement))

## Visuals worth redrawing

- Figure 6.2/6.3 style timelines: OS @ boot, hardware, program columns for
  a system call (trap, handler, return-from-trap) and for a timer-driven
  switch from A to B.

## My notes

- The "sub-microsecond" context switch claim is generic; our experiment
  (0001) measured 1.7 µs for a pipe round trip with two switches.
