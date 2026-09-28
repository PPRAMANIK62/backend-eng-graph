---
id: man7-socket
title: socket(2), Linux manual page
author: Michael Kerrisk and man-pages contributors
url: https://man7.org/linux/man-pages/man2/socket.2.html
published: 2025-10-29
accessed: 2026-09-28
kind: docs
primary: true
---

## Summary

The Linux man page for socket(2) (man-pages 6.19): creating an endpoint
and getting a file descriptor back, the address families and socket
types, and what stream and datagram sockets promise.

## Key claims

- socket() returns a file descriptor, the lowest one free. "socket() creates an endpoint for communication and returns a file descriptor that refers to that endpoint." and "The file descriptor returned by a successful call will be the lowest-numbered file descriptor not currently open for the process." (DESCRIPTION)
- The domain picks the protocol family: AF_INET for IPv4, AF_INET6 for IPv6, AF_UNIX for local. (DESCRIPTION, table)
- SOCK_STREAM is a reliable, ordered, connected byte stream. "Provides sequenced, reliable, two-way, connection-based byte streams." (DESCRIPTION, SOCK_STREAM)
- SOCK_DGRAM is connectionless, unreliable messages. "Supports datagrams (connectionless, unreliable messages of a fixed maximum length)." (DESCRIPTION, SOCK_DGRAM)
- Stream sockets don't keep record boundaries and must be connected first. "Sockets of type SOCK_STREAM are full-duplex byte streams. They do not preserve record boundaries. A stream socket must be in a connected state before any data may be sent or received on it." (DESCRIPTION)
- Once connected, plain read() and write() work. "Once connected, data may be transferred using read(2) and write(2) calls or some variant of the send(2) and recv(2) calls." (DESCRIPTION)
- Writing to a broken stream raises SIGPIPE, which kills programs that don't handle it. "A SIGPIPE signal is raised if a process sends or receives on a broken stream; this causes naive processes, which do not handle the signal, to exit." (DESCRIPTION)
- Stream protocols don't lose or duplicate data, and give up on a connection that can't deliver. "The communications protocols which implement a SOCK_STREAM ensure that data is not lost or duplicated." and "then the connection is considered to be dead." (DESCRIPTION)
- Datagram sockets name the peer on each send. "SOCK_DGRAM and SOCK_RAW sockets allow sending of datagrams to correspondents named in sendto(2) calls." (DESCRIPTION)
- Since Linux 2.6.27 the type can include SOCK_NONBLOCK and SOCK_CLOEXEC. "Since Linux 2.6.27, the type argument serves a second purpose" (DESCRIPTION)
- Network errors are reported on the next operation. "When the network signals an error condition to the protocol module (e.g., using an ICMP message for IP) the pending error flag is set for the socket. The next operation on this socket will return the error code of the pending error." (DESCRIPTION)
- EMFILE when the per-process fd limit is hit. "The per-process limit on the number of open file descriptors has been reached." (ERRORS, EMFILE)
- The API comes from 4.2BSD. "POSIX.1-2001, 4.2BSD." (HISTORY)

## Visuals worth redrawing

None.

## My notes

- socket(7) has the socket options (SO_REUSEADDR, SO_REUSEPORT).
