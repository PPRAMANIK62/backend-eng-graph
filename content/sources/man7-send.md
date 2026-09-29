---
id: man7-send
title: send(2), Linux manual page
author: Michael Kerrisk and man-pages contributors
url: https://man7.org/linux/man-pages/man2/send.2.html
kind: docs
primary: true
---

## Summary

The Linux man page for send, sendto and sendmsg (man-pages 6.19). The
part that matters for backpressure: what happens when the socket's send
buffer is full.

## Key claims

- send with no flags is write. "With a zero flags argument, send() is equivalent to write(2)." (DESCRIPTION)
- A full send buffer blocks the caller, or fails with EAGAIN on a non-blocking socket. "When the message does not fit into the send buffer of the socket, send() normally blocks, unless the socket has been placed in nonblocking I/O mode. In nonblocking mode it would fail with the error EAGAIN or EWOULDBLOCK in this case." (DESCRIPTION)
- select can tell you when you can send again. "The select(2) call may be used to determine when it is possible to send more data." (DESCRIPTION)
- EAGAIN means the operation would block. "The socket is marked nonblocking and the requested operation would block." (ERRORS, EAGAIN or EWOULDBLOCK)

## Visuals worth redrawing

None.

## My notes

- The send buffer fills when the peer's receive window stays closed:
  that joins TCP flow control to the application. The man page doesn't
  say this; it follows from tcp-flow-control's sources.
