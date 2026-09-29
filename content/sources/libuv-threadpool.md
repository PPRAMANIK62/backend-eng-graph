---
id: libuv-threadpool
title: Thread pool work scheduling (libuv documentation)
author: libuv contributors
url: https://docs.libuv.org/en/v1.x/threadpool.html
kind: docs
primary: true
---

## Summary

libuv's page on its thread pool (libuv v1.x): what runs on it, how big
it is and how to change that. libuv is the event loop library under
Node.js, so this is the pool that runs Node's file system, DNS lookup
and some crypto work.

## Key claims

- The pool runs user work and hands the result back on the loop thread. "libuv provides a threadpool which can be used to run user code and get notified in the loop thread." (Thread pool work scheduling)
- It runs all file system operations and getaddrinfo/getnameinfo. "This thread pool is internally used to run all file system operations, as well as getaddrinfo and getnameinfo requests." (Thread pool work scheduling)
- Default size 4, set with UV_THREADPOOL_SIZE, maximum 1024. "Its default size is 4, but it can be changed at startup time by setting the UV_THREADPOOL_SIZE environment variable to any value (the absolute maximum is 1024)." (Thread pool work scheduling)
- The maximum went from 128 to 1024 in 1.30.0. "Changed in version 1.30.0: the maximum UV_THREADPOOL_SIZE allowed was increased from 128 to 1024." (Thread pool work scheduling)
- Threads get 8 MB stacks since 1.45.0. "Changed in version 1.45.0: threads now have an 8 MB stack instead of the (sometimes too low) platform default." (Thread pool work scheduling)
- One global pool shared by all loops. "The threadpool is global and shared across all event loops." (Thread pool work scheduling)
- More threads: more throughput, more memory. "More threads usually means more throughput but a higher memory footprint." (Thread pool work scheduling)
- uv_queue_work runs work_cb on a pool thread, then after_work_cb on the loop thread. "Once work_cb is completed, after_work_cb will be called on the loop thread." (uv_queue_work)

## Visuals worth redrawing

None.

## My notes

- Four threads is small: four slow file reads or DNS lookups fill it and
  everything else behind them waits.
