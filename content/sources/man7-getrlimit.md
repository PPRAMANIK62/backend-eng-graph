---
id: man7-getrlimit
title: getrlimit(2), Linux manual page
author: Michael Kerrisk and man-pages contributors
url: https://man7.org/linux/man-pages/man2/getrlimit.2.html
kind: docs
primary: true
---

## Summary

The Linux man page for getrlimit, setrlimit and prlimit (man-pages 6.19).
Used for RLIMIT_NOFILE, the per-process cap on file descriptors that the
shell's `ulimit` sets.

## Key claims

- RLIMIT_NOFILE is one more than the highest fd number a process may open. "This specifies a value one greater than the maximum file descriptor number that can be opened by this process." (DESCRIPTION, RLIMIT_NOFILE)
- Going past it makes open, pipe and dup fail with EMFILE. "Attempts (open(2), pipe(2), dup(2), etc.) to exceed this limit yield the error EMFILE." (RLIMIT_NOFILE)
- Since Linux 4.5 it also caps fds "in flight" over UNIX domain sockets. "Since Linux 4.5, this limit also defines the maximum number of file descriptors that an unprivileged process ... may have \"in flight\" to other processes" (RLIMIT_NOFILE)
- The kernel enforces the soft limit; the hard limit is its ceiling. "The soft limit is the value that the kernel enforces for the corresponding resource." (DESCRIPTION)
- An unprivileged process can raise its soft limit only up to the hard limit. "an unprivileged process may set only its soft limit to a value in the range from 0 up to the hard limit" (DESCRIPTION)
- Children inherit limits across fork and keep them across execve. "A child process created via fork(2) inherits its parent's resource limits." (NOTES)
- The shell's `ulimit` builtin sets these, and commands it runs inherit them. "One can set the resource limits of the shell using the built-in ulimit command" (NOTES)
- Any process's limits can be read in /proc/pid/limits since 2.6.24. "Since Linux 2.6.24, the resource limits of any process can be inspected via /proc/pid/limits" (NOTES)

## Visuals worth redrawing

None.

## My notes

- The page doesn't give default values; those depend on the distro and
  systemd. Don't state a default without measuring.
