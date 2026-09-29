---
id: man7-recv
title: recv(2), Linux manual page
author: Michael Kerrisk and man-pages contributors
url: https://man7.org/linux/man-pages/man2/recv.2.html
kind: docs
primary: true
---

## Summary

The Linux man page for recv, recvfrom and recvmsg (man-pages 6.19):
reading from a socket, what happens when nothing has arrived yet, and
the difference between the per-call MSG_DONTWAIT flag and the O_NONBLOCK
setting on the socket.

## Key claims

- With no data, a receive waits, unless the socket is nonblocking; then it fails with EAGAIN or EWOULDBLOCK. "If no messages are available at the socket, the receive calls wait for a message to arrive, unless the socket is nonblocking (see fcntl(2)), in which case the value -1 is returned and errno is set to EAGAIN or EWOULDBLOCK." (DESCRIPTION)
- A receive returns what's there, not the full amount asked for. "The receive calls normally return any data available, up to the requested amount, rather than waiting for receipt of the full amount requested." (DESCRIPTION)
- select, poll or epoll tell you when more data arrives. "An application can use select(2), poll(2), or epoll(7) to determine when more data arrives on a socket." (DESCRIPTION)
- MSG_DONTWAIT makes one call nonblocking; O_NONBLOCK is a setting on the open file description, shared by everyone holding it. "MSG_DONTWAIT is a per-call option, whereas O_NONBLOCK is a setting on the open file description (see open(2)), which will affect all threads in the calling process as well as other processes that hold file descriptors referring to the same open file description." (The flags argument, MSG_DONTWAIT)
- O_NONBLOCK is set with fcntl's F_SETFL; MSG_DONTWAIT behaves similarly for one call. "This provides similar behavior to setting the O_NONBLOCK flag (via the fcntl(2) F_SETFL operation)" (The flags argument, MSG_DONTWAIT)
- Portable code checks for both EAGAIN and EWOULDBLOCK. "POSIX.1 allows either error to be returned for this case, and does not require these constants to have the same value, so a portable application should check for both possibilities." (ERRORS, EAGAIN or EWOULDBLOCK)
- EINTR: a signal arrived before any data. "The receive was interrupted by delivery of a signal before any data was available" (ERRORS, EINTR)

## Visuals worth redrawing

None.

## My notes

- read(2) and write(2) list the same EAGAIN/EWOULDBLOCK pair for
  nonblocking sockets. Not separate notes.
