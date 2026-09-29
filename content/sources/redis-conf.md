---
id: redis-conf
title: redis.conf (Redis source repository, unstable branch)
author: Redis
url: https://raw.githubusercontent.com/redis/redis/unstable/redis.conf
kind: code
primary: true
---

## Summary

The example configuration file that ships with Redis, read on the
unstable branch. Its comments document each setting. Used here for the
THREADED I/O section: Redis is mostly single-threaded, and optional I/O
threads can take over socket reads, writes and parsing.

## Key claims

- Redis is mostly single-threaded, with some work on side threads. "Redis is mostly single threaded, however there are certain threaded operations such as UNLINK, slow I/O accesses and other things that are performed on side threads." (THREADED I/O)
- Client socket reads and writes can be moved to I/O threads. "Now it is also possible to handle Redis clients socket reads and writes in different I/O threads." (THREADED I/O)
- Without them, users scale with pipelining and several instances. "normally Redis users use pipelining in order to speed up the Redis performances per core, and spawn multiple instances in order to scale more." (THREADED I/O)
- Threading is off by default; use it on 4 or more cores, leaving one spare. "By default threading is disabled, we suggest enabling it only in machines that have at least 4 or more cores, leaving at least one spare core." (THREADED I/O)
- Only worth it if Redis is actually CPU-bound. "We also recommend using threaded I/O only if you actually have performance problems, with Redis instances being able to use a quite big percentage of CPU time, otherwise there is no point in using this feature." (THREADED I/O)
- I/O threads handle writes, reads and protocol parsing. "we not only use threads for writes, that is to thread the write(2) syscall and transfer the client buffers to the socket, but also use threads for reads and protocol parsing." (THREADED I/O)
- Default RDB save points: after 3600 s if at least 1 change, 300 s if at least 100, 60 s if at least 10000. "After 300 seconds (5 minutes) if at least 100 changes were performed" (SNAPSHOTTING)
- By default Redis stops accepting writes if the last background save failed. "By default Redis will stop accepting writes if RDB snapshots are enabled (at least one save point) and the latest background save failed." (SNAPSHOTTING, stop-writes-on-bgsave-error)
- AOF is off by default (`appendonly no`). With the default fsync policy a power outage loses about a second, a process crash about one write. "Redis can lose just one second of writes in a dramatic event like a server power outage, or a single write if something wrong with the Redis process itself happens, but the operating system is still running correctly." (APPEND ONLY MODE)
- The three appendfsync modes. "always: fsync after every write to the append only log. Slow, Safest." (APPEND ONLY MODE, appendfsync)
- everysec is the default compromise. "as that's usually the right compromise between speed and data safety." (APPEND ONLY MODE, appendfsync)
- A heavy background save can make fsync block the main thread's write too. "Note that there is no fix for this currently, as even performing fsync in a different thread will block our synchronous write(2) call." (APPEND ONLY MODE, no-appendfsync-on-rewrite)
- no-appendfsync-on-rewrite yes means up to 30 s of loss during a rewrite. "it is possible to lose up to 30 seconds of log in the worst scenario (with the default Linux settings)." (APPEND ONLY MODE, no-appendfsync-on-rewrite)
- AOF base files are written in RDB format by default. "Using the RDB format is always faster and more efficient, and disabling it is only supported for backward compatibility purposes." (APPEND ONLY MODE, aof-use-rdb-preamble)
- DEL frees memory synchronously and can block for seconds on a huge value. "the server can block for a long time (even seconds) in order to complete the operation." (LAZY FREEING)
- UNLINK and FLUSHALL ASYNC free memory on another thread. "Another thread will incrementally free the object in the background as fast as possible." (LAZY FREEING)
- Server-side deletes (eviction, expiry, overwrite) are blocking by default; lazyfree-lazy-eviction, lazyfree-lazy-expire, lazyfree-lazy-server-del all default to no. (LAZY FREEING)
- Small hashes, sets, sorted sets and lists use compact encodings with limits: hash-max-listpack-entries 512, hash-max-listpack-value 64, set-max-intset-entries 512, set-max-listpack-entries 128, zset-max-listpack-entries 128, list-max-listpack-size -2 (8 KB per list node). "Hashes are encoded using a memory efficient data structure when they have a small number of entries, and the biggest entry does not exceed a given threshold." (ADVANCED CONFIG)

## Visuals worth redrawing

None.

## My notes

- Persistence, lazy freeing and encoding claims read on the same
  unstable file; the same settings and defaults appear in the 8.10.2
  tag's redis.conf.

- Read on the unstable branch; the release in use may word this
  differently. Command execution itself stays on the main thread; the
  file doesn't say so in these words, so don't claim it from here.
