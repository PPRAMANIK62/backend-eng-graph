---
id: redis-pipelining
title: Redis pipelining
author: Redis
url: https://redis.io/docs/latest/develop/using-commands/pipelining/
kind: docs
primary: true
---

## Summary

Redis's guide to pipelining: sending many commands without waiting for
each reply. It saves round trips, and it also saves system calls,
because the server reads many commands in one `read` and writes many
replies in one `write`. The server has to hold the replies in memory
until the client reads them. Living doc.

## Key claims

- Pipelining means not waiting for each reply. "Redis pipelining is a technique for improving performance by issuing multiple commands at once without waiting for the response to each individual command." (intro)
- RTT arithmetic: at 250 ms RTT, one client in lock-step does at most four requests a second, whatever the server can do. "even if the server is able to process 100k requests per second, we'll be able to process at max four requests per second." (Request/Response protocols and RTT)
- Loopback RTT is much shorter, usually under a millisecond. "If the interface used is a loopback interface, the RTT is much shorter, typically sub-millisecond" (Request/Response protocols and RTT)
- A server can read new requests before old replies are read. "A Request/Response server can be implemented so that it is able to process new requests even if the client hasn't already read the old responses." (Redis Pipelining)
- Redis has always supported it. "Redis has supported pipelining since its early days" (Redis Pipelining)
- The server queues replies in memory; send in batches. "While the client sends commands using pipelining, the server will be forced to queue the replies, using memory." (Redis Pipelining, important note)
- Suggested batch size about 10k commands. "it is better to send them as batches each containing a reasonable number, for instance 10k commands" (Redis Pipelining, important note)
- It also cuts system calls. "many commands are usually read with a single read() system call, and multiple replies are delivered with a single write() system call." (It's not just a matter of RTT)
- Throughput can reach 10x the unpipelined baseline. "eventually reaches 10 times the baseline obtained without pipelining" (It's not just a matter of RTT)
- Their Ruby example over loopback on macOS: 10,000 PINGs took 1.185 s without pipelining and 0.251 s with it, about 5x. "As you can see, using pipelining, we improved the transfer by a factor of five." (A real world code example)
- Pipelining can't help read-compute-write, since the write needs the read's reply; scripting can. "pipelining can't help in this scenario since the client needs the reply of the read command before it can call the write command" (Pipelining vs Scripting)

## Visuals worth redrawing

- Four INCRs, lock-step vs pipelined, as two timelines.

## My notes

- The 10x and 5x numbers are theirs, on their machines, with no setup
  details beyond "Mac OS X" and loopback. Quote them as theirs.
