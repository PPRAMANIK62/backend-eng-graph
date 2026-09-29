---
id: resilience4j-bulkhead
title: Bulkhead (resilience4j docs)
author: resilience4j authors
url: https://resilience4j.readme.io/docs/bulkhead
kind: docs
primary: true
---

## Summary

The resilience4j docs for its two bulkheads: a semaphore that caps
concurrent calls, and a fixed thread pool with a bounded queue.

## Key claims

- Two kinds: semaphore, or fixed thread pool with a bounded queue. "SemaphoreBulkhead which uses Semaphores" / "FixedThreadPoolBulkhead which uses a bounded queue and a fixed thread pool." (Introduction)
- The semaphore bulkhead works across threading models, and sizing the thread pool is up to you. "It is up to the client to ensure correct thread pool sizing that will be consistent with bulkhead configuration." (Introduction)
- Semaphore settings: `maxConcurrentCalls` default 25, `maxWaitDuration` default 0 (how long a caller blocks on a full bulkhead). "Max amount of time a thread should be blocked for when attempting to enter a saturated bulkhead." (Create and configure a Bulkhead)
- Thread-pool settings: max and core threads default to the number of processors (core one less), queue capacity 100. (Create and configure a ThreadPoolBulkhead, table)

## Visuals worth redrawing

None.

## My notes

- A `maxWaitDuration` of 0 means a full bulkhead rejects at once, which
  is load shedding at the client.
