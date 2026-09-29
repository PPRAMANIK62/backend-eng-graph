---
id: redis-async-io-threads-pr
title: Async IO Threads (redis/redis pull request 13695)
author: ShooterIT and Redis contributors
url: https://github.com/redis/redis/pull/13695
kind: code
primary: true
---

## Summary

The pull request that replaced Redis's I/O threads with a new design,
merged in 2024 and shipped as "a new I/O threading implementation" in
Redis 8.0. Its description explains what was wrong with the 6.0 I/O
threads, how the new ones work (each I/O thread has its own event loop,
commands still run on the main thread), which clients stay on the main
thread, and one benchmark.

## Key claims

- I/O threads arrived in 6.0 for reading, parsing and writing. "Redis introduced IO Thread in 6.0, allowing IO threads to handle client request reading, command parsing and reply writing, thereby improving performance." (Introduction)
- In the 6.0 design the main thread waited for the I/O threads. "The main thread is blocked during IO thread read/write operations and must wait for all IO threads to complete their current tasks before it can continue execution." (Introduction)
- The old I/O threads busy-waited, burning CPU. "it causes all IO threads to reach full CPU utilization due to the busy wait mechanism used by the IO threads." (Introduction)
- Commands still run only on the main thread. "we did not change the fact that all client commands must be executed on the main thread, because Redis was originally designed to be single-threaded" (Implementation, Overall)
- Each I/O thread now has its own event loop. "But now each IO thread has independent event loop, therefore, IO threads can use a multiplexing approach to handle client read and write operations" (Implementation, Overall)
- The flow: main thread accepts and assigns, I/O thread reads and parses, main thread executes, I/O thread writes. "the main thread assigns clients to IO threads after accepting connections, IO threads will notify the main thread when clients finish reading and parsing queries, then the main thread processes queries from IO threads and generates replies" (Implementation, Overall)
- The main thread no longer runs epoll_wait for ordinary clients. "This approach eliminates the need for the main thread to perform the costly `epoll_wait` operation for handling connections (except for specific ones)." (Each IO thread has independent event loop)
- TLS work moved to the I/O threads too. "all TLS operations, including handling pending data, have been moved entirely to the IO threads." (Each IO thread has independent event loop)
- Threads talk through per-thread queues woken with eventfd or a pipe. "we implemented an event notifier based on `eventfd` or `pipe` to support event-driven handling." (Event-notified client queue)
- A new client goes to the I/O thread with the fewest clients. "the main thread always assigns clients to the IO thread with the least clients." (Observability)
- Replica, monitor, pub/sub and tracking clients stay on the main thread. "For replica, monitor, subscribe, and tracking clients, main thread may directly write them a reply when conditions are met." (Trade-off, Special Clients)
- Benchmark: PING with 15 I/O threads on a Ryzen 7 7950X, memtier_benchmark 50 connections x 15 threads, about 1.61 million ops/s, p99 0.847 ms. "Pings     1610141.81" (Performance Testing, Multi IO Thread; command `memtier_benchmark --test-time 60 -c 50 -t 15 --command ping`)
- With few I/O threads, simple commands barely speed up. "When the io-threads configuration is set to a low value (e.g., 2), performance does not show a significant improvement compared to a single-threaded setup for simple commands (such as SET or GET)" (Others, IO thread number)
- If the main thread is the bottleneck, only more shards help. "If the main thread is the bottleneck, the overall performance can only be scaled by increasing the number of shards or replicas." (Others, IO thread number)
- The benchmark machine had 32 cores. "CPU: Ryzen 7 7950x with 32 cores" (Performance Testing, test machine)
- The PING test shows the ceiling of the I/O path. "The testing of the PING command can simply demonstrate the upper limits of the multi-threaded IO model’s capabilities." (Performance Testing)
- top -H shows whether the main thread or I/O threads are the bottleneck. "you can clearly monitor the CPU utilization of the main thread and IO threads using `top -H -p $redis_pid`." (Others, IO thread number)
- The change shipped in Redis 8.0 (from a later comment on the PR). "This has been supported since Redis 8.0(async I/O threads introduced in #13695 )" (PR conversation)

## Visuals worth redrawing

- The PR has a figure of the flow between main thread and I/O threads
  (not copied). Redraw as: accept on main, hand to I/O thread, read and
  parse, queue to main, execute, queue back, write.

## My notes

- Merged into unstable in 2024; Redis 8.0 release notes list "#13695 New
  I/O threading implementation" (8.0-M03) and say `io-threads-do-reads`
  is no longer effective. Read those notes at
  raw.githubusercontent.com/redis/redis/8.0/00-RELEASENOTES; not given a
  separate note.
- The benchmark is theirs, on their machine, for PING only.
