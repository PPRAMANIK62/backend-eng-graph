---
id: man7-accept
title: accept(2), Linux manual page
author: Michael Kerrisk and man-pages contributors
url: https://man7.org/linux/man-pages/man2/accept.2.html
kind: docs
primary: true
---

## Summary

The Linux man page for accept(2) and accept4(2) (man-pages 6.19):
taking the next connection off a listening socket and getting a new
file descriptor for it.

## Key claims

- accept() takes the first pending connection and returns a new fd; the listener is unchanged. "It extracts the first connection request on the queue of pending connections for the listening socket, sockfd, creates a new connected socket, and returns a new file descriptor referring to that socket. The newly created socket is not in the listening state. The original socket sockfd is unaffected by this call." (DESCRIPTION)
- addr is filled with the peer's address. "This structure is filled in with the address of the peer socket, as known to the communications layer." (DESCRIPTION)
- It blocks if nothing is waiting, or fails with EAGAIN on a nonblocking socket. "If no pending connections are present on the queue, and the socket is not marked as nonblocking, accept() blocks the caller until a connection is present." (DESCRIPTION)
- On a nonblocking listener with nothing queued, accept fails with EAGAIN or EWOULDBLOCK. "The socket is marked nonblocking and no connections are present to be accepted." (ERRORS, EAGAIN or EWOULDBLOCK)
- A new connection shows up as a readable event on the listener. "A readable event will be delivered when a new connection is attempted and you may then call accept() to get a socket for that connection." (DESCRIPTION)
- EMFILE when the per-process fd limit is hit. "The per-process limit on the number of open file descriptors has been reached." (ERRORS, EMFILE)
- On Linux the new socket doesn't inherit O_NONBLOCK from the listener. "On Linux, the new socket returned by accept() does not inherit file status flags such as O_NONBLOCK and O_ASYNC from the listening socket." (VERSIONS)
- accept4 added in Linux 2.6.28. "Linux 2.6.28, glibc 2.10." (HISTORY, accept4())

## Visuals worth redrawing

None.

## My notes

- The pending queue here is the accept queue that listen(2)'s backlog
  sizes.
