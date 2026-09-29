---
id: envoy-hot-restart
title: Hot restart
author: Envoy Project Authors
url: https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/operations/hot_restart
kind: docs
primary: true
---

## Summary

How Envoy (docs for 1.40.0-dev when read) replaces itself, code and
config, without dropping connections: the new process starts, takes the
listen sockets from the old one over a UNIX domain socket, and the old
one drains and exits.

## Key claims

- Hot restart reloads code and config without dropping connections during the drain. "This means that Envoy can fully reload itself (both code and configuration) without dropping existing connections during the drain process." (Hot restart)
- Existing connections are not moved to the new process. "However, existing connections are not transferred to the new Envoy process: they must complete during the drain process or be terminated." (Hot restart)
- The new process initialises fully before taking over the listen sockets. "The new process fully initializes itself (loads the configuration, does an initial service discovery and health checking phase, etc.) before it asks for copies of the listen sockets from the old process." (Hot restart)
- Then it starts listening and tells the old process to drain. "The new process starts listening and then tells the old process to start draining." (Hot restart)
- Drain time is configurable and draining gets more aggressive over time. "The drain time is configurable via the --drain-time-s option and as more time passes draining becomes more aggressive." (Hot restart)
- After the parent shutdown time, remaining old connections are closed. "Any remaining connections to the old Envoy process are closed." (Hot restart)
- The two processes talk only over UNIX domain sockets, so it works across containers. "Communication between the processes takes place only using unix domain sockets." (Hot restart)
- With reuse_port, sockets are passed per worker so no queued connections are dropped. "This feature workers correctly during hot restart because Envoy passes each socket to the new process by worker index. Thus, no connections are dropped in the accept queues of the draining process." (Socket handling)
- Unless the worker count shrinks. "However, if concurrency decreases some connections may be dropped in the accept queues of the old process workers." (Socket handling)

## Visuals worth redrawing

None.

## My notes

- "workers correctly" is a typo on the page (for "works"); quoted as is.
