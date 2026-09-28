---
id: man7-listen
title: listen(2), Linux manual page
author: Michael Kerrisk and man-pages contributors
url: https://man7.org/linux/man-pages/man2/listen.2.html
kind: docs
primary: true
---

## Summary

The Linux man page for listen(2) (man-pages 6.19): marking a socket as
passive, what the backlog means on Linux, and the four steps of a
server.

## Key claims

- listen() makes a socket passive, ready for accept(). "listen() marks the socket referred to by sockfd as a passive socket, that is, as a socket that will be used to accept incoming connection requests using accept(2)." (DESCRIPTION)
- A full queue means the client gets ECONNREFUSED or its request is ignored so it retries. "If a connection request arrives when the queue is full, the client may receive an error with an indication of ECONNREFUSED or, if the underlying protocol supports retransmission, the request may be ignored so that a later reattempt at connection succeeds." (DESCRIPTION)
- EADDRINUSE if another socket already listens on that port. "Another socket is already listening on the same port." (ERRORS)
- A server is socket, bind, listen, accept. (NOTES, steps 1 to 4)
- Since Linux 2.2 the backlog counts fully established connections waiting for accept. "Now it specifies the queue length for completely established sockets waiting to be accepted, instead of the number of incomplete connection requests." (NOTES)
- The incomplete (SYN) queue has its own limit, ignored when SYN cookies are on. "The maximum length of the queue for incomplete sockets can be set using /proc/sys/net/ipv4/tcp_max_syn_backlog." (NOTES)
- The backlog is silently capped by somaxconn, 4096 since Linux 5.4. "If the backlog argument is greater than the value in /proc/sys/net/core/somaxconn, then it is silently capped to that value. Since Linux 5.4, the default in this file is 4096; in earlier kernels, the default value is 128." (NOTES)

## Visuals worth redrawing

None.

## My notes

- Cloudflare (2018) says both the SYN queue and accept queue sizes come
  from the backlog. The kernel's current ip-sysctl doc calls
  tcp_max_syn_backlog a per-listener limit. Details moved between
  kernel versions.
