---
id: zero-downtime-reload
title: Zero-downtime reloads
depth: short
phase: 3
note: >-
  Changing a proxy's config or binary without dropping connections:
  SO_REUSEPORT, passing sockets, draining.
needs: [reverse-proxy, ports-and-sockets]
leads_to: []
compare_with: [graceful-shutdown]
---


# Zero-downtime reloads

A [[reverse-proxy]] gets new configuration all the time: a backend
added, a certificate renewed, a route changed. Some setups reload every
few seconds. A reload that refuses or resets even a handful of
connections turns into a steady trickle of errors, so proxies go to a
lot of trouble to swap in new config, or a whole new binary, while the
listening port never stops answering.

## Two ways to lose a connection during a reload

Recall how a server takes connections (see [[ports-and-sockets]]): it
binds a listening socket to a port, the kernel completes handshakes and
puts finished connections in that socket's accept queue, and the
program calls `accept` to take them out. A reload can break this in two
places:

- **No listening socket.** If the old process closes the port before
  the new one opens it, connections arriving in between are refused.
  HAProxy's first "soft reload" in 2006 had such a gap, under a
  millisecond long.
- **Connections stranded in a queue.** If a listening socket closes
  while connections are waiting in its accept queue, the kernel resets
  them. The clients had finished their handshake and get an error.

Simply exec-ing the new binary in place avoids the first but has its
own problems: you can't undo it if the new config has a typo, and while
the new binary starts up nobody calls `accept`, so the queue can fill
and overflow.

## SO_REUSEPORT: two sockets, two queues

Linux 3.9 added `SO_REUSEPORT`, which lets several sockets bind the
same address and port, as long as each sets the option before `bind`
and all belong to the same user. It was meant for spreading `accept`
across threads, but it also looks like a reload tool: start the new
process, let it bind the port alongside the old one, then stop the old
one. No gap.

The catch is that each bind makes a separate socket with its own queue,
and the kernel spreads new connections across all of them. When the
old process closes its socket, whatever is still waiting in that
socket's queue is reset. The problem is in the socket API itself:
there's no way to drain the pending connections out of a listening
socket before closing it.

![Two panels. Left, SO_REUSEPORT: the old and new processes each own a separate listening socket on port 443 with its own accept queue; the kernel spreads new connections across both, and when the old process closes its socket, the two connections waiting in its queue are reset. Right, a passed socket: the old and new processes hold file descriptors to one and the same listening socket with a single queue; the old process stops calling accept, the new one keeps taking connections, and nothing is lost.](img/zero-downtime-reload-sockets.svg)

*SO_REUSEPORT alone strands connections in the old socket's queue; handing over the socket itself keeps one queue. Adapted from Willy Tarreau, "Truly Seamless Reloads with HAProxy" (2017).*

HAProxy measured this in 2017: about 2 to 3 resets per million
connections per reload. That sounds small until something reloads ten
times a second under heavy load.

## Passing the socket itself

The fix is to never close the listening socket. A socket is a kernel
object, and a [[file-descriptor]] is only a handle to it, so the old
process can give the new one a handle to the same socket, with the same
queue. There are two ways to do that:

- **Inherit it.** nginx's master process clears the close-on-exec flag
  on its listening sockets and starts the new binary, passing the
  descriptor numbers in an environment variable.
- **Send it.** A UNIX domain socket can carry open file descriptors
  from one process to another (`SCM_RIGHTS`). HAProxy 1.8 does this:
  the new process connects to the old one's control socket and asks for
  the listeners. Envoy's hot restart does the same.

Now old and new processes accept from one queue. The old one stops
accepting, the new one carries on, and nothing is stranded.

## Draining what's already open

New connections are only half of it. The old process still has clients
in the middle of requests. Every design lets them finish:

- On `SIGHUP` ([[signals]]) nginx checks the new config, rolls back if
  it's invalid, starts new workers, and tells the old ones to stop
  listening and exit once their clients are done.
- For a new binary, `SIGUSR2` starts a new master that inherits the
  listening sockets. Old and new both serve for a while, then `SIGWINCH`
  drains the old workers. The old master keeps its sockets, so you can
  roll back if the new binary misbehaves.
- Envoy's new process fully starts up (config, service discovery, first
  health checks) before it takes the sockets, then tells the old one to
  drain. Existing connections are never moved to the new process: they
  finish during the drain time or are closed when the old process is
  told to exit.

## Where it gets tricky

**SO_REUSEPORT looks like the answer.** On its own, it removes
the gap but not the stranded queue. Envoy uses one reuse_port socket
per worker and passes each one to the new process by worker index,
which is safe, unless the new process has fewer workers: then some
queued connections can still be dropped.

**Long-lived connections set the real limit.** [[websockets|WebSockets]] and streams
don't finish on their own, so "drain" has to end with closing them.
Pick a drain time you can live with and make clients reconnect cleanly.

## What this means when you build

- Validate new config before switching to it, and keep the old
  process able to take over again.
- Hand over listening sockets rather than binding new ones.
- Stop accepting in the old process, drain with a deadline, then exit.

## Further reading

- [socket(7)](https://man7.org/linux/man-pages/man7/socket.7.html), Linux man-pages 6.19. What `SO_REUSEPORT` does and requires.
- [Truly Seamless Reloads with HAProxy – No More Hacks!](https://www.haproxy.com/blog/truly-seamless-reloads-with-haproxy-no-more-hacks), Willy Tarreau, HAProxy Technologies, 2017. Eleven years of attempts, why SO_REUSEPORT still resets connections, and the socket-passing fix.
- [Graceful upgrades in Go](https://blog.cloudflare.com/graceful-upgrades-in-go/), Lorenz Bauer, Cloudflare, 2018. Every approach from exec to NGINX-style inheritance, from the application's side.
- [Controlling nginx](https://nginx.org/en/docs/control.html), nginx docs. Config reloads and live binary upgrades with signals.
- [Hot restart](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/operations/hot_restart), Envoy docs, 1.40. Handing over sockets between processes and draining the old one.
