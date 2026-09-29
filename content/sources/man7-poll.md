---
id: man7-poll
title: poll(2), Linux manual page
author: Michael Kerrisk and man-pages contributors
url: https://man7.org/linux/man-pages/man2/poll.2.html
kind: docs
primary: true
---

## Summary

The Linux man page for poll and ppoll (man-pages 6.19). Like select, but
the caller passes an array of pollfd structures, with no fixed limit on
fd numbers.

## Key claims

- poll does the same job as select, and epoll does it with more features. "The Linux-specific epoll(7) API performs a similar task, but offers features beyond those found in poll()." (DESCRIPTION)
- The caller passes an array of structures, one per fd: the fd, the events wanted and the events that happened. "struct pollfd { int fd; /* file descriptor */ short events; /* requested events */ short revents; /* returned events */ };" (DESCRIPTION)
- A negative fd is skipped, an easy way to ignore one entry. "If this field is negative, then the corresponding events field is ignored and the revents field returns zero." (DESCRIPTION)
- poll arrived in Linux 2.1.23. "poll() POSIX.1-2001. Linux 2.1.23." (HISTORY)

## Visuals worth redrawing

None.

## My notes

- The array goes in with every call, so the kernel sees the whole list
  every time; Lemon's kqueue paper explains why that's the cost.
