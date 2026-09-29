---
id: redis-faq
title: Redis FAQ
author: Redis
url: https://redis.io/docs/latest/develop/get-started/faq/
kind: docs
primary: true
---

## Summary

Redis's FAQ. The answers used here: why the whole dataset lives in
memory, the memory footprint of small keys, why background saves need
memory overcommit, why snapshots are consistent, and how Redis uses
several cores. Living doc, undated.

## Key claims

- Data types map closely to data structures, with atomic operations on them. "Redis data types are closely related to fundamental data structures and are exposed to the programmer as such, without additional abstraction layers." (How is Redis different)
- In memory, so the dataset can't be bigger than RAM. "very high write and read speed is achieved with the limitation of data sets that can't be larger than memory." (How is Redis different)
- Footprint examples on 64-bit: empty instance about 3 MB; 1 million small string keys about 85 MB; 1 million hashes of 5 fields about 160 MB. "1 Million small Keys -> String Value pairs use ~ 85MB of memory." (What's the Redis memory footprint?)
- 64-bit pointers take 8 bytes, so small keys cost more on 64-bit. "This is because pointers take 8 bytes in 64-bit systems." (What's the Redis memory footprint?)
- At maxmemory, writes get errors unless eviction is configured. "If this limit is reached, Redis will start to reply with an error to write commands (but will continue to accept read-only commands)." (What happens if Redis runs out of memory?)
- Background saving depends on fork's copy-on-write. "The Redis background saving schema relies on the copy-on-write semantic of the fork system call" (Background saving fails with a fork() error on Linux?)
- A page is copied only when parent or child changes it. "A page will be duplicated only when it changes in the child or in the parent." (Background saving fails with a fork() error on Linux?)
- With overcommit_memory 0, fork can fail if free RAM can't cover a full copy; Redis wants 1. "If you have a Redis dataset of 3 GB and just 2 GB of free memory it will fail." (Background saving fails with a fork() error on Linux?)
- Snapshots are consistent because the fork happens between commands. "the Redis background saving process is always forked when the server is outside of the execution of a command, so every command reported to be atomic in RAM is also atomic from the point of view of the disk snapshot." (Are Redis on-disk snapshots atomic?)
- CPU is rarely the bottleneck; usually memory or network. "It's not very frequent that CPU becomes your bottleneck with Redis, as usually Redis is either memory or network bound." (How can Redis use multiple CPUs or cores?)
- With pipelining, about 1 million requests per second on an average Linux system. "when using pipelining a Redis instance running on an average Linux system can deliver 1 million requests per second" (How can Redis use multiple CPUs or cores?)
- To use more cores, run several instances and shard. "to maximize CPU usage you can start multiple instances of Redis in the same box and treat them as different servers." (How can Redis use multiple CPUs or cores?)
- Threaded work started in 4.0 with background deletes. "As of version 4.0, Redis has started implementing threaded actions. For now this is limited to deleting objects in the background and blocking commands implemented via Redis modules." (How can Redis use multiple CPUs or cores?)

## Visuals worth redrawing

None.

## My notes

- The multi-core answer predates the 6.0 and 8.0 I/O threads ("For
  now" is out of date). Use redis-async-io-threads-pr for those.
- The "1 million requests per second" figure has no hardware or command
  given; don't lean on it.
