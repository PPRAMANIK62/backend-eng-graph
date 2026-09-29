---
id: axboe-io-uring-networking-2023
title: io_uring and networking in 2023
author: Jens Axboe
url: https://github.com/axboe/liburing/wiki/io_uring-and-networking-in-2023
kind: docs
primary: true
---

## Summary

A liburing wiki page by io_uring's author on using it for network
servers: batching, multishot accept and receive, provided buffers,
socket state hints and task work. Its main point is that a readiness
(epoll) server doesn't get the full benefit by only swapping the
notifier; the event loop has to become completion-based.

## Key claims

- Storage apps convert easily because they're already completion-based. "With its completion model based design, converting storage applications to use io_uring is trivial" (Introduction)
- Network apps are built on readiness, usually epoll. "Network applications have been written with a readiness type of model for decades, most commonly using epoll(2) these days to get notified when a given socket has data available." (Introduction)
- Swapping epoll notifications for io_uring ones cuts system calls but misses most of the gain; the loop has to change. "It'll potentially provide a reduction of system calls compared to epoll, but will not be able to take advantage of some of the other features that io_uring offers. To do that, a change to the IO event loop must be done." (Introduction)
- Submitting and waiting in one call suits event loops. "liburing has support for this through the io_uring_submit_and_wait() helper, allowing an application to not only batch submissions, but also combine submissions and completions into a single system call." (Batching)
- Multishot requests are submitted once and post a completion each time they trigger. "These types of requests are submitted once, and will post a completion whenever the operation is triggered." (Multi-shot)
- Multishot accept since 5.19; multishot receive since 6.0; multishot poll since 5.13. "Available since 5.19." (Multi-shot, accept); "Receive multi-shot is available since 6.0." (Multi-shot)
- Readiness gives a natural moment to pick a buffer; completion-based receives would need one up front per request. "A readiness based IO model has the distinct advantage of providing an opportune moment to provide a buffer for receiving data" (Provided buffers)
- Pre-assigning a buffer per pending receive doesn't scale to many connections. "for applications handling hundreds of thousands of requests at the time, this doesn't scale very well and leads to excessive memory consumption." (Provided buffers)
- Provided buffers let the kernel pick a buffer when data actually arrives. "This allows the kernel to pick a suitable buffer when the given receive operation is ready to actually receive data, rather than upfront." (Provided buffers)
- Running out of provided buffers fails the request with -ENOBUFS. "If this happens, a request will fail with -ENOBUFS as the error value." (Provided buffers)
- A receive with no data waits on an internal poll. "If no data is available, it’ll rely on an internal poll implementation to get notified when data is available." (Socket state)
- A multishot CQE with IORING_CQE_F_MORE set means more completions will follow. "If further notifications are expected from a multi-shot request, the CQE completion will have IORING_CQE_F_MORE set in the flags member of the io_uring_cqe structure." (Multi-shot)
- Ring-mapped provided buffers since 5.19; the older provide-buffers type since 5.7. "The newer type, called ring mapped buffers, supported since 5.19." (Provided buffers)

## Visuals worth redrawing

None.

## My notes

- Wiki page, edited over time; the title pins it to the state of
  io_uring networking in 2023.
