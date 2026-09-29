---
id: libuv-design
title: Design overview (libuv documentation)
author: libuv contributors
url: https://docs.libuv.org/en/v1.x/design.html
kind: docs
primary: true
---

## Summary

libuv's design overview (libuv v1.x): handles and requests, the I/O
loop and every step of one iteration, and why file I/O goes to a thread
pool while network I/O stays on the loop thread. libuv was written for
Node.js and is the loop under it.

## Key claims

- libuv was written for Node.js, around event-driven async I/O. "libuv is cross-platform support library which was originally written for Node.js. It’s designed around the event-driven asynchronous I/O model." (Design overview)
- A loop belongs to one thread; run several loops on several threads. "It establishes the content for all I/O operations, and it’s meant to be tied to a single thread. One can run multiple event loops as long as each runs in a different thread." (The I/O loop)
- The loop isn't thread-safe. "The libuv event loop (or any other API involving the loop or handles, for that matter) is not thread-safe except where stated otherwise." (The I/O loop)
- Network I/O is on non-blocking sockets, polled with the best OS mechanism. "all (network) I/O is performed on non-blocking sockets which are polled using the best mechanism available on the given platform: epoll on Linux, kqueue on OSX and other BSDs, event ports on SunOS and IOCP on Windows." (The I/O loop)
- Each iteration blocks waiting for I/O, then fires callbacks. "As part of a loop iteration the loop will block waiting for I/O activity on sockets which have been added to the poller and callbacks will be fired indicating socket conditions" (The I/O loop)
- Before blocking, the loop computes a timeout; with timers active it's the nearest timer. "If none of the above cases matches, the timeout of the closest timer is taken, or if there are no active timers, infinity." (The I/O loop, step 7)
- The iteration steps: update now, run due timers, pending callbacks, idle, prepare, compute timeout, block for I/O, check, close callbacks, update now, run due timers. (The I/O loop, steps 1 to 13)
- Network I/O always runs on the loop's thread; file I/O uses a thread pool. "libuv uses a thread pool to make asynchronous file I/O operations possible, but network I/O is always performed in a single thread, each loop’s thread." (The I/O loop, Important)
- There are no usable platform file I/O primitives, so blocking file calls go to the pool. "Unlike network I/O, there are no platform-specific file I/O primitives libuv could rely on, so the current approach is to run blocking file I/O operations in a thread pool." (File I/O)
- The timeout is 0 when there is work that shouldn't wait, such as active idle handles or handles pending close. "If there are any idle handles active, the timeout is 0. If there are any handles pending to be closed, the timeout is 0." (The I/O loop, step 7)

## Visuals worth redrawing

- The loop iteration diagram (timers, pending, idle, prepare, poll for
  I/O, check, close), as a cycle.

## My notes

- Node's own event loop guide describes the same phases from the
  JavaScript side, and notes libuv 1.45.0 (Node 20) moved timers after
  the poll phase.
