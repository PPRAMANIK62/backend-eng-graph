---
id: man7-strace
title: strace(1) — Linux manual page
author: strace project (Paul Kranenburg, Dmitry V. Levin and others), on man7.org
url: https://man7.org/linux/man-pages/man1/strace.1.html
published: 2026-07-15
accessed: 2026-09-28
kind: docs
primary: true
---

## Summary

The manual for strace, the Linux tool that records every system call a
process makes and every signal it receives. Covers the output format,
attaching to running processes, following threads and children, filtering,
timing and summary modes, and the overhead warning. Page generated from
the strace git repository as of 2026-07-15.

## Key claims

- strace records system calls and signals. "It intercepts and records the system calls made by a process and the signals a process receives." (DESCRIPTION)
- Each call is printed with its name, arguments and return value, to stderr or a file with -o. "The name of each system call, its arguments, and its return value are printed to standard error or to the file specified with the -o option." (DESCRIPTION)
- No recompiling or source code needed. "recompilation is not required for tracing." (DESCRIPTION)
- Output example: `open("/dev/null", O_RDONLY) = 3`; errors show the errno name, e.g. `= -1 ENOENT (No such file or directory)`. (DESCRIPTION)
- Signals appear as `--- SIGINT {...} ---` lines. (DESCRIPTION)
- Calls interrupted by another thread's call are shown as `<unfinished ...>` then `<... resumed>`. "strace will attempt to preserve the order of these events and mark the ongoing call as unfinished." (DESCRIPTION)
- -p attaches to a running process. "Attaches to the process with the process ID pid and begin tracing." (-p pid)
- -f follows children and threads; with -p on a multithreaded process it attaches to all threads. "using -f -p PID attaches to all of its threads" (-f)
- -T shows time spent in each system call. "Shows the time spent in system calls." (-T)
- -tt prints wall clock time with microsecond precision. (-tt)
- -y prints file paths for file descriptor arguments. "Prints paths associated with file descriptor arguments" (-y)
- -c counts time, calls and errors per system call and prints a summary. "Counts time, calls, and errors for each system call and report a summary on program exit" (-c)
- -e trace= filters; classes like %file and %network. "Traces all the network related system calls." (-e trace=%network)
- Tracing slows the process; --seccomp-bpf can reduce the cost. "A traced process runs more slowly than a non-traced one. The performance impact can be mitigated by using the --seccomp-bpf option." (BUGS)
- --seccomp-bpf makes the kernel stop the process only for traced calls, needs -f, and doesn't apply with -p. "cause the kernel to stop the tracee only for the system calls that are being traced." and "It is also not applicable to processes attached using -p/--attach option." (--seccomp-bpf)
- If the seccomp filter can't be set up, strace falls back to stopping on every call. "strace proceeds as usual, stopping traced processes on every system call." (--seccomp-bpf)

## Visuals worth redrawing

None.

## My notes

- strace is not installed on the lab machine (2026-09-28). No run made.
