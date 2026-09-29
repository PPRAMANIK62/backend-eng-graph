---
id: redis-persistence
title: Redis persistence
depth: short
phase: 9
note: >-
  RDB snapshots taken with fork and copy-on-write, the append-only file
  and its fsync settings, and what each loses in a crash.
needs: [redis-internals, process, fsync]
leads_to: []
compare_with: [write-ahead-log]
---

# Redis persistence

Redis keeps all its data in memory, so after a restart it only has what
it wrote to disk. It has two ways of doing that: RDB snapshots, which
save the whole dataset every so often, and the append-only file (AOF),
which logs every write. They differ in what a crash costs you, from
minutes of writes down to nothing, and in what they cost the running
server.

## RDB: a snapshot from a forked child

A snapshot starts with `fork` (see [[process]]). The child is a copy of
Redis frozen at that moment. It writes the whole dataset to a temporary
file, then renames it over the old `dump.rdb`, the same
[[atomic-rename]] trick as any safe file replace. Meanwhile the parent
keeps serving clients and never touches the disk itself.

Memory isn't copied up front. Parent and child share pages
copy-on-write, so the snapshot costs extra memory in proportion to how
much the parent changes while the child is writing. The child sees the
data exactly as it was at the fork, so the file is a point-in-time
snapshot.

By default Redis saves after an hour if at least 1 key changed, after
5 minutes if at least 100 did, and after 60 seconds if at least 10,000
did. Whatever you wrote since the last snapshot is lost in a crash:
usually minutes of data.

The fork isn't free. It runs on the [[redis-internals|main thread]], and the kernel has to
copy the page table: about 48 MB for a 24 GB instance with 4 kB pages.
Redis's docs list forks of a 6.9 GB process in 62 ms on a physical
Xeon, and 6.1 GB in 1,460 ms on old Xen-based EC2 instances. With
transparent [[huge-pages]] on, a few thousand writes after the fork
copy almost all of memory; Redis wants them off.

## AOF: a log of every write

With `appendonly yes`, every command that changes data is appended to a
file, in the [[resp-protocol|RESP]] format clients send, and replayed
on restart: an [[append-only-log]], like a database's
[[write-ahead-log]].

Appending with `write` only gets the data to the kernel's
[[page-cache]]. When it reaches the disk depends on `appendfsync`:

| `appendfsync` | When it calls [[fsync]] | Lost in a power cut |
|---|---|---|
| `always` | after each batch of commands, before the replies go out | nothing that was acknowledged |
| `everysec` (default) | once a second, on a background thread | about 1 second, up to 2 |
| `no` | never; the kernel flushes when it likes | usually up to about 30 seconds on Linux |

`always` is slow, but not one fsync per command: commands from many
clients that ran in the same loop share one write and one fsync, a form
of [[group-commit]].

![Four timelines ending at a power cut. RDB snapshots: two snapshots, then everything since the last one is lost, often minutes. AOF with fsync no: kernel flushes now and then, up to about 30 seconds lost. AOF everysec: an fsync every second, about 1 second lost, up to 2 if fsync is slow. AOF always: fsync before every reply, nothing acknowledged is lost. If only the Redis process crashes, everysec loses about one write.](img/redis-persistence-loss.svg)

*What each setting loses when the power goes. Not to scale.*

A crash of just the Redis process is gentler than a power cut. Data
that reached the kernel still gets to disk, so with `everysec` you lose
about one write.

## Rewriting the log

The AOF grows forever: increment a counter 100 times and you have 100
entries for one key. So Redis rewrites it in the background, using the
same fork trick: the child writes the smallest set of data that rebuilds
the current state. Since Redis 7.0 the AOF is a directory: a base file
(written in RDB format by default), incremental files for writes since
then, and a manifest listing them. During a rewrite the parent starts a
new incremental file, and when the child's new base is ready, Redis
swaps in a new manifest atomically. Before 7.0, writes that arrived
during a rewrite were buffered in memory and written to disk twice.

## Where it gets tricky

**"Lose one second" is really up to two.** If a background fsync is
still running, Redis delays the next `write` rather than block on it,
for up to two seconds. After that it writes anyway, and that write can
stall the main thread.

**Snapshots and fsync fight over the disk.** A fork writing a big
snapshot can make fsync, and then the main thread's writes, block for a
long time. `no-appendfsync-on-rewrite yes` skips fsync while a child is
saving, which in the worst case means losing about 30 seconds.

**A torn tail is dropped quietly.** If the last command in the AOF is
cut off, Redis loads the file anyway and drops it. Corruption in the
middle stops startup, and `redis-check-aof --fix` may throw away
everything after the bad spot.

**Failed snapshots stop writes.** By default, if a background save
fails, Redis refuses writes until one succeeds.

**Turning on AOF by editing the config and restarting can lose data.**
Enable it on the live server with `CONFIG SET appendonly yes` first.
With both on, Redis loads the AOF at startup, since it's the most
complete.

## What this means when you build

- A pure cache can run with no persistence at all.
- RDB alone is fine if losing minutes is acceptable. It's also the
  natural backup: the file is never modified once written, so you can
  copy it while Redis runs.
- For data you care about, use AOF with `everysec` plus RDB, and
  assume up to two seconds of loss.
- Leave headroom for copy-on-write memory, and turn transparent huge
  pages off.

## Further reading

- [Redis persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/), Redis. RDB and AOF, the fsync policies, rewriting and the multi-part AOF, and what to do with a damaged file.
- [redis.conf](https://raw.githubusercontent.com/redis/redis/unstable/redis.conf), Redis. Default save points, `appendfsync`, `no-appendfsync-on-rewrite` and `stop-writes-on-bgsave-error`, with the reasoning in the comments.
- [Diagnosing latency issues](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/latency/), Redis. What fork, huge pages and the AOF's fsync cost the main thread, including the two-second delay.
