---
id: valkey-one-million-rps-2024
title: "Unlock 1 Million RPS: Experience Triple the Speed with Valkey"
author: Dan Touitou, Uri Yagelnik (AWS)
url: https://valkey.io/blog/unlock-one-million-rps/
kind: blog
primary: true
---

## Summary

The Valkey team (Valkey is the Linux Foundation fork of Redis) on the
I/O threading redesign in Valkey 8.0 (2024). Same core rule as Redis:
commands run on one main thread, I/O threads do the reading, parsing,
writing and even the epoll_wait calls. Includes one benchmark.

## Key claims

- Valkey keeps command execution on one thread on purpose. "Valkey strives to stay simple by executing as much code in a single thread as possible." (Performance Without Compromising Simplicity)
- Command execution stays single-threaded. "It utilizes a minimal number of synchronization mechanisms and keeps Valkey command execution single-threaded, simple, and primed for future enhancements." (Performance Without Compromising Simplicity)
- I/O thread jobs: read and parse, write, poll, free memory. "A job can involve reading and parsing a command from a client, writing responses back to the client, polling for I/O events on TCP connections, or deallocating memory." (High Level Design)
- epoll_wait was more than 20% of the main thread's time. "When executed solely by the main thread, epoll_wait consumes more than 20 percent of the time." (High Level Design)
- Only one thread runs epoll_wait at a time. "at any given time, at most one thread, either an io_thread or the main thread, executes epoll_wait." (High Level Design)
- The main thread prefetches the keys a batch of commands will touch, to cut memory accesses. "which aims to reduce the number of external memory accesses needed when executing the commands on the main dictionary." (High Level Design)
- Benchmark: 360K to 1.19M requests/s vs Valkey 7.2, 8 I/O threads, 3M keys, 512-byte values, 650 clients doing SET on a c7g.16xlarge. "Throughput increased by approximately 230%, rising from 360K to 1.19M requests per second compared to Valkey 7.2" (Major Upgrade to Valkey Performance)
- The benchmark includes the prefetch change. "Please note that these numbers include the Prefetch change that will be described in the next blog post" (Major Upgrade to Valkey Performance)
- The new I/O threads are in Valkey 8. "Performance comparison between existing I/O threading implementation and the new I/O threading implementation available in Valkey 8." (figure alt text, Major Upgrade to Valkey Performance)

## Visuals worth redrawing

- A high-level design figure (main thread and I/O threads with job
  queues). Redraw rather than copy.

## My notes

- Vendor benchmark on one instance type; treat as their number, not a
  general one.
