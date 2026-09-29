---
id: redis-persistence-docs
title: Redis persistence
author: Redis
url: https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/
kind: docs
primary: true
---

## Summary

Redis's own guide to its two ways of writing data to disk: RDB snapshots
made by a forked child, and the append-only file (AOF) that logs every
write in RESP format. Covers the three fsync policies, AOF rewriting
(and the multi-part AOF from Redis 7.0), truncated and corrupted AOF
files, how the two interact, and backups. Living doc, undated.

## Key claims

- Four options: RDB, AOF, none, or both. "RDB persistence performs point-in-time snapshots of your dataset at specified intervals." (intro list)
- The AOF logs every write and is replayed at startup, in RESP format. "Commands are logged using the same format as the Redis protocol itself." (intro list)
- Persistence can be turned off, sometimes done for caches. "You can disable persistence completely. This is sometimes used when caching." (intro list)
- To save an RDB the parent only forks; the child does the disk work. "The parent process will never perform disk I/O or alike." (RDB advantages)
- RDB restarts faster than AOF with big datasets. "RDB allows faster restarts with big datasets compared to AOF." (RDB advantages)
- With RDB you should expect to lose the last minutes of writes. "you should be prepared to lose the latest minutes of data." (RDB disadvantages)
- fork can stall Redis for milliseconds up to a second on big datasets. "may result in Redis stopping serving clients for some milliseconds or even for one second if the dataset is very big and the CPU performance is not great." (RDB disadvantages)
- With everysec, fsync runs on a background thread. "fsync is performed using a background thread and the main thread will try hard to perform writes when no fsync is in progress, so you can only lose one second worth of writes." (AOF advantages)
- A half-written last command can be fixed with redis-check-aof. "Even if the log ends with a half-written command for some reason (disk full or other reasons) the redis-check-aof tool is able to fix it easily." (AOF advantages)
- AOF files are usually bigger than RDB. "AOF files are usually bigger than the equivalent RDB files for the same dataset." (AOF disadvantages)
- Before 7.0, writes during a rewrite were buffered in memory and written twice. "All write commands that arrive during rewrite are written to disk twice." (AOF disadvantages, Redis < 7.0)
- Use both if you want safety close to PostgreSQL's. "you want a degree of data safety comparable to what PostgreSQL can provide you." (Ok, so what should I use?)
- AOF alone is discouraged; keep RDB for backups and fast restarts. "There are many users using AOF alone, but we discourage it" (Ok, so what should I use?)
- Snapshot steps: fork, child writes a temporary RDB, then replaces the old one. "When the child is done writing the new RDB file, it replaces the old one." (Snapshotting, How it works)
- Snapshotting relies on copy-on-write. "This method allows Redis to benefit from copy-on-write semantics." (Snapshotting, How it works)
- kill -9 or a power cut loses the latest writes under snapshotting alone. "If your computer running Redis stops, your power line fails, or you accidentally kill -9 your instance, the latest data written to Redis will be lost." (Append-only file)
- AOF has existed since Redis 1.1. "It became available in version 1.1." (Append-only file)
- Since 7.0 the AOF is a base file plus incremental files tracked by a manifest. "Since Redis 7.0.0, Redis uses a multi part AOF mechanism." (Append-only file)
- Rewriting: 100 INCRs leave 100 AOF entries, 99 of them unneeded. "99 of those entries are not needed to rebuild the current state." (Log rewriting)
- Automatic rewrite since 2.4. "Since Redis 2.4 is able to trigger log rewriting automatically" (Log rewriting)
- appendfsync always: one write and one fsync per batch, before replies. "it means a single write and a single fsync (before sending the replies)." (How durable is the append only file?)
- appendfsync everysec: may lose one second. "you may lose 1 second of data if there is a disaster." (How durable is the append only file?)
- appendfsync no: Linux usually flushes every 30 seconds. "Normally Linux will flush data every 30 seconds with this configuration, but it's up to the kernel's exact tuning." (How durable is the append only file?)
- everysec is the default and suggested policy. "The suggested (and default) policy is to fsync every second." (How durable is the append only file?)
- always supports group commit. "The always policy is very slow in practice, but it supports group commit, so if there are multiple parallel writes Redis will try to perform a single fsync operation." (How durable is the append only file?)
- A truncated last command is dropped at load by default (aof-load-truncated). "the default configuration is to continue regardless of the fact the last command in the file is not well-formed, in order to guarantee availability after a restart." (What should I do if my AOF gets truncated?)
- Corruption in the middle makes Redis abort; --fix may drop everything after it. "all the AOF portion from the invalid part to the end of the file may be discarded, leading to a massive amount of data loss" (What should I do if my AOF gets corrupted?)
- Rewrite uses the same copy-on-write trick. "Log rewriting uses the same copy-on-write trick already in use for snapshotting." (How it works)
- 7.0+: parent opens a new incremental file, child writes the new base, then the manifest is swapped atomically. "Now Redis does an atomic exchange of the manifest files so that the result of this AOF rewrite takes effect." (How it works, Redis >= 7.0)
- Redis won't run an AOF rewrite and a BGSAVE at the same time. "This prevents two Redis background processes from doing heavy disk I/O at the same time." (Interactions between AOF and RDB persistence)
- With both on, the AOF is loaded at restart. "the AOF file will be used to reconstruct the original dataset since it is guaranteed to be the most complete." (Interactions between AOF and RDB persistence)
- The RDB is written under a temp name and renamed, so it's safe to copy while running. "it uses a temporary name and is renamed into its final destination atomically using rename(2) only when the new snapshot is complete." (Backing up Redis data)
- Just changing the config to turn on AOF and restarting can lose data. "not following this procedure (e.g. just changing the config and restarting the server) can result in data loss!" (How I can switch to AOF)
- Since 7.0 the AOF files live in one directory. "Since Redis 7.0.0, AOF files are split into multiple files which reside in a single directory determined by the appenddirname configuration." (Backing up Redis data)
- A rewrite writes the shortest command sequence that rebuilds the data. "Redis will write the shortest sequence of commands needed to rebuild the current dataset in memory." (Log rewriting)
- To switch on AOF, set it on the live server first. "Enable AOF: redis-cli config set appendonly yes" (How I can switch to AOF)

## Visuals worth redrawing

None on the page. The rewrite steps for 7.0 (parent keeps a new
incremental file, child writes the base, manifest swapped) are easy to
draw as a timeline.

## My notes

- "you can only lose one second" (AOF advantages) is softer than
  redis-latency and redis-conf, which describe a write delayed up to two
  seconds when fsync is slow. The worst case for everysec is about two
  seconds, not one.
