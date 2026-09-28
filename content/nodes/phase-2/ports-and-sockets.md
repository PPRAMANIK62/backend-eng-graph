---
id: ports-and-sockets
title: Ports and sockets
depth: deep
phase: 2
note: >-
  The sockets API (bind, listen, accept, connect), and a connection
  named by four numbers: two addresses and two ports.
needs: [file-descriptor, ip-addressing]
leads_to: [udp, tcp, nat]
compare_with: []
updated: 2026-09-29
---

# Ports and sockets

A socket is the kernel object your program talks to the network
through, and you hold it as a file descriptor. A port is the 16-bit
number that decides which program on a machine gets an incoming packet.
Every connection your service holds is named by four numbers, two
addresses and two ports, and two common errors, "address already in
use" and "cannot assign requested address", make sense once you see how
those numbers are handed out.

## A socket is a file descriptor for a network endpoint

Your program asks for a socket the same way it asks for a file:

```c
int fd = socket(AF_INET, SOCK_STREAM, 0);
```

The kernel hands back a [[file-descriptor]], the lowest number not
already open in your [[process]]. The first argument picks the address
family: `AF_INET` for IPv4, `AF_INET6` for IPv6, `AF_UNIX` for sockets
that stay on one machine. The second picks the kind of socket:

- **`SOCK_STREAM`** is a reliable, ordered, two-way byte stream over a
  connection. On IP, that's [[tcp]].
- **`SOCK_DGRAM`** sends separate messages with no connection and no
  delivery promise. On IP, that's [[udp]].

Once a stream socket is connected, plain `read` and `write` work on it,
just like on a file. A few things are different from a file, though.
A stream socket doesn't keep message boundaries: two `write` calls of
100 bytes can arrive as one read of 200 bytes, or as 150 and 50. If you
write to a connection the other side has broken, the kernel sends your
process `SIGPIPE`, and a program that doesn't handle that
[[signals|signal]] exits. And errors reported by the network (an ICMP
error message, say) are stored on the socket and come back from your
next call on it, not from the call that caused them.

The API itself is old. It came from 4.2BSD, and POSIX standardizes
it, so the same calls work across Unix-like systems.

## Ports decide which program gets the packet

An IP address gets a packet to a machine (see [[ip-addressing]]). IP
itself has no idea which program on that machine should get it. Ports
come from the layer above: TCP and UDP each put a 16-bit source port
and destination port in their header. A **socket address** is an IP
address plus a port, like `192.0.2.10:8080`.

Port numbers are split into three ranges by IANA:

| Range | Name | Assigned? |
|---|---|---|
| 0 to 1023 | System (well-known) ports | Yes, by IANA, to services |
| 1024 to 49151 | User (registered) ports | Yes, by IANA, to services |
| 49152 to 65535 | Dynamic (ephemeral) ports | Never; free for temporary use |

On Linux, binding a port below 1024 needs privilege (the
`CAP_NET_BIND_SERVICE` capability). One small trap: the port and address
fields in a socket address are in network byte order (big-endian), so in
C you write `htons(8080)`, not `8080`.

## The server side: bind, listen, accept

Take a small HTTP server on port 8080. It makes four calls.

**`bind`** gives the socket its local address. Binding to `0.0.0.0`
(`INADDR_ANY`) means "every interface on this machine". Only one socket
can be bound to a given (address, port) pair for receiving, so a second
server on 8080 fails with `EADDRINUSE`.

**`listen`** turns the socket into a listening, or passive, socket. From
now on it doesn't carry data. It only collects incoming connections. The
second argument, the backlog, sets how many fully set up connections may
wait for your program to pick them up. The kernel silently caps it at
`net.core.somaxconn`, which has defaulted to 4096 since Linux 5.4 (128
before). If that queue is full, a new client either gets
`ECONNREFUSED` or, with TCP, its request is ignored so it tries again
later. Setting up each connection takes a [[tcp-handshake|handshake]],
which the kernel does on its own before your program sees anything.

**`accept`** takes the first finished connection off the queue and
returns a brand new file descriptor for it. The listening socket stays
as it was, ready for the next client. If nothing is waiting, `accept`
blocks, or on a nonblocking socket fails with `EAGAIN`. A pending
connection shows up as a "readable" event on the listening socket, which
is how event loops know to call `accept`.

So a busy server has one listening socket and one more socket per
client. Each of those is a file descriptor counted against your
`RLIMIT_NOFILE`, and running out shows up as `EMFILE` from `accept`.

## The client side: connect picks a port for you

The client usually skips `bind`:

```c
int fd = socket(AF_INET, SOCK_STREAM, 0);
connect(fd, &server_addr, sizeof server_addr);  /* 192.0.2.10:8080 */
```

The socket has no local address yet, so `connect` fills one in. The
kernel picks the source IP from its routing table and a source port from
the **ephemeral port range**. On Linux that range is 32768 to 60999 by
default, 28,232 ports, set by `net.ipv4.ip_local_port_range`. For TCP,
`connect` then starts the handshake with the server.

## A connection is four numbers

TCP names a connection by the pair of socket addresses at its two ends:
source IP, source port, destination IP, destination port. This is the
**4-tuple**. No two open TCP connections on a machine can have the same
one.

That explains how the server above can hold thousands of connections
all on port 8080. They share the local half of the tuple and differ in
the remote half. It also explains the client side: the same source port
can be used for connections to two different servers, because the
tuples still differ.

![A server at 192.0.2.10 has a listening socket on fd 3 bound to 0.0.0.0:8080. Two clients connect: 203.0.113.5 from port 51000 and 198.51.100.7, also from port 51000. accept() returned fd 4 and fd 5, one connected socket per client. Each is named by its own 4-tuple; they share the local address and port and differ in the remote address.](img/ports-and-sockets-four-tuple.svg)

*One listening socket, one connected socket per client. The tuples share the local half and differ in the remote half.*

## Where it gets tricky

**Running out of ephemeral ports.** 28,232 ports sounds like a lot until
a proxy or a service mesh opens many short or long-lived connections to
one backend. All of those share the destination address and port, so
only the source port varies, and the range caps you at 28,232 at once
toward that one destination. When it runs out, `connect` fails with
`EADDRNOTAVAIL`, printed as "Cannot assign requested address".
Cloudflare hit this in production badly enough that `ssh 127.0.0.1`
failed on the affected machines. Closed connections keep holding their
port for a while too, which is the [[time-wait]] story.

**Bind before connect removes port sharing.** If your client calls
`bind(src_ip, 0)` to choose its source address before `connect`, the
kernel must pick a port right then, and it can't know whether you plan to
`listen` on it. So it picks a port no other socket uses at all. Now each
connection uses up a port no matter how many destinations you have. On
Linux, setting the `IP_BIND_ADDRESS_NO_PORT` socket option (added in
2015) before `bind` delays the port choice until `connect`, and sharing
works again. Connected UDP sockets have the same limit by default and no
easy fix.

**"Address already in use" after a restart.** Restart a server and
`bind` can fail with `EADDRINUSE` even though the old process is gone.
On Linux, a TCP address that was bound stays unavailable for some time
after closing unless the new socket sets `SO_REUSEADDR` before `bind`.

**Linux doesn't use IANA's ephemeral range.** IANA's dynamic range is
49152 to 65535. Linux defaults to 32768 to 60999. Don't assume client
ports fall in the IANA range when you write firewall rules or read
packet captures.

**`accept` doesn't copy nonblocking mode on Linux.** The new socket
from `accept` does not inherit `O_NONBLOCK` from the listening socket,
unlike the original BSD sockets. Set flags on each accepted socket yourself, or
use `accept4` with `SOCK_NONBLOCK`.

## What this means when you build

- Read "cannot assign requested address" as "out of ephemeral ports
  toward this destination" and "address already in use" as "someone
  already holds this local address and port".
- If you pick a source address yourself, set `IP_BIND_ADDRESS_NO_PORT`
  before `bind`.
- Pool and reuse connections to backends instead of opening one per
  request. It saves ports, handshakes and file descriptors.
- Raise `RLIMIT_NOFILE` for servers that hold many connections; every
  client is a descriptor.
- Set a real backlog in `listen` and remember `somaxconn` caps it.

## Further reading

- [socket(2)](https://man7.org/linux/man-pages/man2/socket.2.html), Linux man-pages, 2025. Socket types and what a stream or datagram socket promises.
- [listen(2)](https://man7.org/linux/man-pages/man2/listen.2.html), Linux man-pages, 2026. The backlog on Linux, `somaxconn` and its default.
- [accept(2)](https://man7.org/linux/man-pages/man2/accept.2.html), Linux man-pages, 2025. What `accept` returns and the Linux differences from BSD.
- [getrlimit(2)](https://man7.org/linux/man-pages/man2/getrlimit.2.html), Linux man-pages, 2026. `RLIMIT_NOFILE`, the per-process cap on open file descriptors, and `EMFILE`.
- [ip(7)](https://man7.org/linux/man-pages/man7/ip.7.html), Linux man-pages, 2026. Socket addresses, binding rules, automatic port choice and privileged ports.
- [RFC 6335](https://www.rfc-editor.org/rfc/rfc6335), Cotton et al., IETF, 2011. The three port ranges (section 6).
- [How to stop running out of ephemeral ports and start to love long-lived connections](https://blog.cloudflare.com/how-to-stop-running-out-of-ephemeral-ports-and-start-to-love-long-lived-connections/), Marek Majkowski, Cloudflare, 2022. Port exhaustion in production, the 4-tuple, and the bind-before-connect trap.
