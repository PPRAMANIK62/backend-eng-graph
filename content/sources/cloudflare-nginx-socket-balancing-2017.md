---
id: cloudflare-nginx-socket-balancing-2017
title: Why does one NGINX worker take all the load?
author: Marek Majkowski (Cloudflare)
url: https://blog.cloudflare.com/the-sad-state-of-linux-socket-balancing/
kind: blog
primary: true
---

## Summary

Cloudflare's 2017 post on how Linux spreads new connections across
several worker processes, each running its own event loop. With a
shared listening socket and epoll, the busiest worker gets most new
connections; SO_REUSEPORT balances them but makes latency worse when one
worker stalls.

## Key claims

- Three layouts: one listener one worker, one listener many workers, one listener per worker. "There are generally three ways of designing a TCP server with regard to performance:" (intro)
- Shared listener with many workers is NGINX's standard model. "This is the standard model for NGINX." ((b) Single listen socket, multiple worker process)
- Workers blocked in accept() are served FIFO, round robin. "In the first one Linux will do proper FIFO-like round robin load balancing." (Spreading the accept() load)
- With epoll, Linux wakes the most recently added waiter: LIFO. "Linux seems to choose the last added process, a LIFO-like behavior." (Spreading the accept() load)
- So the busiest worker, the one just back in its loop, gets most connections. "This behavior causes the busiest process, the one that only just went back to event loop, to receive the majority of the new connections." (Spreading the accept() load)
- SO_REUSEPORT gives each worker its own accept queue and spreads connections by hash. "Since the accept queues are not shared, and Linux spreads the load by a simple hashing logic, each worker will get statistically the same number of incoming connections." (SO_REUSEPORT to the rescue)
- Separate queues hurt the tail: if one worker blocks, its whole queue waits. "If a single cashier gets blocked, all the traffic waiting in its queue will stall." (SO_REUSEPORT to the rescue)
- The shared-queue model is better for latency under load, even though it balances badly. "In a case of increased load the (b) single accept queue model, while is not balancing the load evenly, is better for latency." (SO_REUSEPORT to the rescue)
- Their synthetic test: single queue max 72.65 ms, SO_REUSEPORT max 144.55 ms, for 100k CPU-heavy requests at concurrency 200. (SO_REUSEPORT to the rescue, histograms)

## Visuals worth redrawing

- The three layouts (a), (b), (c) as boxes: listen socket(s), workers.

## My notes

- The LIFO wakeup is about exclusive epoll waiters on a shared
  listening socket, as in their EPOLLEXCLUSIVE example.
