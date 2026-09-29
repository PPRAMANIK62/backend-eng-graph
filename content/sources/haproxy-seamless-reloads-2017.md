---
id: haproxy-seamless-reloads-2017
title: "Truly Seamless Reloads with HAProxy – No More Hacks!"
author: Willy Tarreau, HAProxy Technologies
url: https://www.haproxy.com/blog/truly-seamless-reloads-with-haproxy-no-more-hacks
kind: blog
primary: true
---

## Summary

HAProxy's author on eleven years of trying to reload the proxy without
losing a single connection (2017). Walks through every approach (brief
unbind, SO_REUSEPORT, blocking or delaying SYNs, socket servers, eBPF),
finds why Linux's SO_REUSEPORT still resets a few connections on reload,
and lands on passing the listening sockets to the new process with
SCM_RIGHTS, merged for HAProxy 1.8.

## Key claims

- A seamless reload is a config or binary change users don't notice. "What users often call a “seamless” or “hitless” reload is a configuration update or a service upgrade performed with no impact on user experience." (What is a Seamless Reload?)
- HAProxy treats config updates and upgrades the same way: new binary, new config. "HAProxy makes no distinction between a configuration update and a service upgrade." (What is a Seamless Reload?)
- The 2006 method left a short window with no process bound to the port. "there was a small “black hole” between steps 2 and 3 where the ports were not bound by any process." (General Situation)
- Linux 3.9's SO_REUSEPORT gave each socket its own queue, and people saw RSTs during reloads. "The socket queues were independent and people have progressively started reporting occasional RSTs being observed under load during an HAProxy reload." (General Situation)
- Measured rate in their lab: 2 to 3 RSTs per million connections per reload. "The rate of RSTs emitted during a reload was around 2-3 per million connections per reload." (General Situation)
- Root cause: the socket API has no way to drain pending connections from a listener. "by default, it is not possible to drain incoming connections from a socket, in the same way, we can drain the last bits of incoming data from a shutdown socket." (Analysis of the Problem)
- Connections left in the old listener's queue are reset when it closes. "It resulted in leaving a few of them in the queue, which got reset when the listening socket was closed." (Analysis of the Problem)
- Workarounds tried: blocking SYNs during the reload (adds a retransmit delay), delaying SYNs with a qdisc (Yelp, 2015), GitHub's multibinder socket server (2016). (Attempted Workarounds and Solutions)
- SCM_RIGHTS passes open file descriptors between processes over a UNIX socket. "SCM_RIGHTS is one of the little-known features of UNIX sockets that allows one process to transfer one or several of its file descriptors to another process." (Working on a Long-Term Solution)
- The fix: hand the listening sockets to the new process so they're never closed. "A safer and proper, long-term solution turned out to be what we already discussed in step #4 – to pass the listening file descriptors to the new process so that the connection is never closed." (Proper, Long-Term Solution)
- It needs `expose-fd listeners` on the stats socket and `-x` on the new process. "The socket definition in the HAProxy configuration needs to have “expose-fd listeners” on it to be accepted by -x for socket transfers." (Proving the Solution)
- In microservice setups some services reload every few seconds. "Some services are reloading every few seconds." (General Situation)
- The 2006 gap was under a millisecond. "the risk of any connections landing exactly during the reload period (shorter than a millisecond) was sufficiently low that it could be ignored." (General Situation)
- Linux 3.9's SO_REUSEPORT spreads load over several sockets. "a new and much better SO_REUSEPORT implementation was brought to Linux kernel 3.9, allowing the load to be intelligently spread over multiple sockets." (General Situation)
- Their stress case: Linux 4.9, 55,000 connections per second, 10 reloads a second. "On an haproxy service running under Linux 4.9 at 55,000 connections per second and being reloaded 10 times a second" (General Situation)
- The first soft reload came in HAProxy 1.2.11, in 2006. "In 2006, HAProxy version 1.2.11 implemented a soft reload mechanism." (General Situation)

## Visuals worth redrawing

- Old and new process each with its own SO_REUSEPORT listener and
  queue; the old one closes and its queued connections are reset.

## My notes

- The blog shows its date; say 2017, HAProxy 1.8.
