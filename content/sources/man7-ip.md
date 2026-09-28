---
id: man7-ip
title: ip(7), Linux manual page
author: Michael Kerrisk and man-pages contributors
url: https://man7.org/linux/man-pages/man7/ip.7.html
published: 2026-02-08
accessed: 2026-09-28
kind: docs
primary: true
---

## Summary

The Linux man page for IPv4 sockets (man-pages 6.19): the socket
address (address plus port), binding rules, automatic port choice,
privileged ports and special addresses.

## Key claims

- For receiving, only one socket may bind a given (address, port). "When a process wants to receive new incoming packets or connections, it should bind a socket to a local interface address using bind(2). In this case, only one IP socket may be bound to any given local (address, port) pair." (DESCRIPTION)
- INADDR_ANY binds all interfaces. "When INADDR_ANY is specified in the bind call, the socket will be bound to all local interfaces." (DESCRIPTION)
- listen() on an unbound socket picks a random free port. "When listen(2) is called on an unbound socket, the socket is automatically bound to a random free port with the local address set to INADDR_ANY." (DESCRIPTION)
- connect() on an unbound socket picks a random free port, or a shareable one. "When connect(2) is called on an unbound socket, the socket is automatically bound to a random free port or to a usable shared port with the local address set to INADDR_ANY." (DESCRIPTION)
- A closed TCP address stays unavailable for a while unless SO_REUSEADDR is set. "A TCP local socket address that has been bound is unavailable for some time after closing, unless the SO_REUSEADDR flag has been set." (DESCRIPTION)
- A socket address is an IP address plus a 16-bit port. "An IP socket address is defined as a combination of an IP interface address and a 16-bit port number." (Address format)
- Ports belong to the transport protocols, not IP. "The basic IP protocol does not supply port numbers, they are implemented by higher level protocols like udp(7) and tcp(7)." (Address format)
- Ports below 1024 need privilege (CAP_NET_BIND_SERVICE). "The port numbers below 1024 are called privileged ports (or sometimes: reserved ports)." (Address format)
- Ports and addresses are in network byte order. "In particular, this means that you need to call htons(3) on the number that is assigned to a port." (Address format)
- 127.0.0.1 is loopback; 0.0.0.0 means any address when binding. "INADDR_ANY (0.0.0.0) means any address for socket binding;" (Special and reserved addresses)
- TCP-style (connection-oriented) sockets only use unicast. "In the current implementation, connection-oriented sockets are allowed to use only unicast addresses." (Address format)

## Visuals worth redrawing

None.

## My notes

- The /proc settings (ip_local_port_range) moved to
  proc_sys_net_ipv4(5); the kernel's ip-sysctl doc has the defaults.
