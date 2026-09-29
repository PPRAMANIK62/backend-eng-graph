---
id: man7-socket-7
title: socket(7), Linux manual page
author: Michael Kerrisk and man-pages contributors
url: https://man7.org/linux/man-pages/man7/socket.7.html
kind: docs
primary: true
---

## Summary

The Linux man page for the socket interface in general (man-pages 6.19):
socket-level options such as SO_REUSEADDR, SO_REUSEPORT, SO_KEEPALIVE
and the reuseport BPF hooks. (socket(2), the system call, is a separate
note: man7-socket.)

## Key claims

- SO_REUSEPORT arrived in Linux 3.9 and lets several sockets bind the same address. "Permits multiple AF_INET or AF_INET6 sockets to be bound to an identical socket address." (SO_REUSEPORT)
- It must be set on every socket, including the first, before bind. "This option must be set on each socket (including the first socket) prior to calling bind(2) on the socket." (SO_REUSEPORT)
- All binders must share the effective UID. "To prevent port hijacking, all of the processes binding to the same address must have the same effective UID." (SO_REUSEPORT)
- For TCP it's meant for spreading accept() over one listener per thread. "For TCP sockets, this option allows accept(2) load distribution in a multi-threaded server to be improved by using a distinct listener socket for each thread." (SO_REUSEPORT)
- A BPF program can choose which socket in the group gets each packet; when a socket closes the last one in the group moves into its slot. "When a socket is removed from a reuseport group (via close(2)), the last socket in the group will be moved into the closed socket's position." (SO_ATTACH_REUSEPORT_CBPF, SO_ATTACH_REUSEPORT_EBPF)

## Visuals worth redrawing

None.

## My notes

- The man page doesn't say what happens to connections still queued on
  a listener that closes. The HAProxy and Cloudflare posts do: they
  are reset.
