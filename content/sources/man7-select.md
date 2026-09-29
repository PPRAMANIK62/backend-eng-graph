---
id: man7-select
title: select(2), Linux manual page
author: Michael Kerrisk and man-pages contributors
url: https://man7.org/linux/man-pages/man2/select.2.html
kind: docs
primary: true
---

## Summary

The Linux man page for select and pselect (man-pages 6.19). Opens with
a warning that select can't watch file descriptors numbered 1024 or
higher and that modern programs should use poll or epoll.

## Key claims

- select takes three sets of descriptors, one per class of event (read, write, exceptional). "The principal arguments of select() are three \"sets\" of file descriptors (declared with the type fd_set), which allow the caller to wait for three classes of events on the specified set of file descriptors." (File descriptor sets)
- select only works for fd numbers below FD_SETSIZE, 1024, and that won't change. "select() can monitor only file descriptors numbers that are less than FD_SETSIZE (1024)—an unreasonably low limit for many modern applications—and this limitation will not change." (DESCRIPTION, WARNING)
- Use poll or epoll instead. "All modern applications should instead use poll(2) or epoll(7), which do not suffer this limitation." (DESCRIPTION, WARNING)
- A descriptor is ready when an I/O operation on it wouldn't block. "A file descriptor is considered ready if it is possible to perform a corresponding I/O operation (e.g., read(2), or a sufficiently small write(2)) without blocking." (DESCRIPTION)
- The sets are overwritten with the result, so a loop must rebuild them before every call. "Thus, if using select() within a loop, the sets must be reinitialized before each call." (File descriptor sets)
- The limit comes from glibc's fixed-size fd_set, not the kernel. "The Linux kernel imposes no fixed limit, but the glibc implementation makes fd_set a fixed-size type, with FD_SETSIZE defined as 1024" (NOTES)
- select isn't affected by O_NONBLOCK. "The operation of select() and pselect() is not affected by the O_NONBLOCK flag." (NOTES)
- A socket can be reported ready and a read can still block, for example after a bad checksum, so use O_NONBLOCK. "On Linux, select() may report a socket file descriptor as \"ready for reading\", while nevertheless a subsequent read blocks." and "Thus it may be safer to use O_NONBLOCK on sockets that should not block." (BUGS)
- select came from 4.2BSD. "select() POSIX.1-2001, 4.4BSD (first appeared in 4.2BSD)." (HISTORY)

## Visuals worth redrawing

None.

## My notes

- The spurious-readiness bug is the reason every readiness loop uses
  nonblocking sockets, even with level-triggered notification.
