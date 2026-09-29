---
id: man7-signal
title: signal(7) — Linux manual page
author: Linux man-pages project
url: https://man7.org/linux/man-pages/man7/signal.7.html
kind: docs
primary: true
---

## Summary

Overview of signals on Linux: dispositions (default, ignore, handle),
the table of standard signals with their default actions, how signals are
sent, blocked and delivered to threads, and how they interrupt blocking
system calls. Linux man-pages 6.19.

## Key claims

- Each signal has a disposition that decides what happens on delivery. "Each signal has a current disposition, which determines how the process behaves when it is delivered the signal." (Signal dispositions)
- Default actions: Term, Ign, Core, Stop, Cont. "Term   Default action is to terminate the process." (Signal dispositions)
- A process can keep the default, ignore the signal, or catch it with a handler, set with sigaction. "a process can elect one of the following behaviors to occur on delivery of the signal: perform the default action; ignore the signal; or catch the signal with a signal handler" (Signal dispositions)
- Dispositions are per process, shared by all threads. "The signal disposition is a per-process attribute: in a multithreaded application, the disposition of a particular signal is the same for all threads." (Signal dispositions)
- On exec, handled signals go back to default; ignored ones stay ignored. "During an execve(2), the dispositions of handled signals are reset to the default; the dispositions of ignored signals are left unchanged." (Signal dispositions)
- kill(2) sends a signal to a process, a process group, or all processes. "Sends a signal to a specified process, to all members of a specified process group, or to all processes on the system." (Sending a signal)
- Signals can be accepted synchronously instead of by a handler, e.g. sigwaitinfo or signalfd. (Synchronously accepting a signal)
- Blocked signals stay pending until unblocked; each thread has its own mask. "Each thread in a process has an independent signal mask" (Signal mask and pending signals)
- A process-directed signal goes to any one thread that isn't blocking it. "A process-directed signal may be delivered to any one of the threads that does not currently have the signal blocked." (Signal mask and pending signals)
- If several threads have it unblocked, the kernel picks one arbitrarily. "the kernel chooses an arbitrary thread to which to deliver the signal." (Signal mask and pending signals)
- Standard signals and default actions: SIGTERM "Termination signal" (Term); SIGKILL "Kill signal" (Term); SIGINT "Interrupt from keyboard" (Term); SIGHUP hangup (Term); SIGCHLD child stopped or terminated (Ign); SIGPIPE "Broken pipe: write to pipe with no readers; see pipe(7)" (Term). (Standard signals table)
- SIGKILL and SIGSTOP can't be caught, blocked or ignored. "The signals SIGKILL and SIGSTOP cannot be caught, blocked, or ignored." (Standard signals)
- SIGSTOP's default action stops the process; SIGCONT's continues it if stopped. "Cont   Default action is to continue the process if it is currently stopped." (Signal dispositions); table rows "SIGSTOP P1990 Stop Stop process" and "SIGCONT P1990 Cont Continue if stopped" (Standard signals table)
- After a stop and SIGCONT, some blocking calls on Linux fail with EINTR even without a handler. "certain blocking interfaces can fail with the error EINTR after the process is stopped by one of the stop signals and then resumed via SIGCONT." (Interruption of system calls and library functions by stop signals)
- The calls that do this include socket reads and connects with a timeout (SO_RCVTIMEO) set, and epoll_wait. "epoll_wait(2), epoll_pwait(2)." (Interruption of system calls and library functions by stop signals, list)
- On x86, ARM and most architectures, SIGINT is 2, SIGKILL 9, SIGPIPE 13, SIGTERM 15, SIGCHLD 17. (Signal numbering table)
- A handler that runs while a system call is blocked either restarts the call or makes it fail with EINTR. "the call fails with the error EINTR." Which one depends on the interface and on SA_RESTART: "whether or not the signal handler was established using the SA_RESTART flag" (Interruption of system calls and library functions by signal handlers)

## Visuals worth redrawing

None; a small table of the five signals a backend engineer meets is enough.

## My notes

- signal-safety(7) covers which functions are safe in a handler; not read.
