---
id: redis-transactions
title: Redis transactions and scripts
depth: short
phase: 9
note: >-
  Making several Redis steps atomic: MULTI/EXEC, WATCH and Lua scripts,
  and what they don't promise.
needs: [redis-internals]
leads_to: [distributed-rate-limiting]
compare_with: [optimistic-concurrency]
---

# Redis transactions and scripts

A single Redis command is atomic, but real logic often needs several:
read a counter, decide, write it back. Redis gives you three ways to
make a group of steps behave as one: `MULTI`/`EXEC` to run a batch
without interruption, `WATCH` to abort that batch if someone changed
your data first, and Lua scripts that run the whole read-decide-write
inside the server. None of them rolls anything back.

## Two clients, one counter

Say two app servers both add one to `views`, and pretend Redis had no
`INCR`. Each does `GET views`, gets 10, and sends `SET views 11`. The
counter ends at 11 instead of 12. The [[redis-internals|single-threaded
main loop]] doesn't prevent this [[race-condition]]: each command is
atomic, but other clients' commands can run between your `GET` and
your `SET`. It's a [[lost-update]].

## MULTI and EXEC: a batch nobody can interrupt

After `MULTI`, Redis queues your commands, answering each with
`QUEUED`. `EXEC` runs the whole queue in one go, with no other
client's command in the middle, and returns one reply per command.
`DISCARD` throws the queue away. If your connection drops before
`EXEC`, none of it runs.

That gives you isolation, but not the read you need. Inside `MULTI`
a `GET` is only queued, so you see its answer after `EXEC`, too late
to decide anything.

## WATCH: check-and-set, optimistically

`WATCH` fills that gap. You watch the keys you're about to read, read
them normally, compute, then send `MULTI`, your writes, and `EXEC`. If
any watched key changed between the `WATCH` and the `EXEC`, Redis
aborts the whole transaction and `EXEC` returns a null reply. You
start over.

![Timeline of two clients and Redis. Both clients send WATCH views and GET views, and both read 10. Client A sends MULTI, SET views 11 and EXEC; its transaction runs and views becomes 11. Client B then sends MULTI, SET views 11 and EXEC; because views changed after B's WATCH, EXEC returns null and nothing is written. B goes back to WATCH, reads 11 and writes 12.](img/redis-transactions-watch.svg)

*WATCH turns the lost update into a retry. Based on the counter example in the Redis docs, "Transactions".*

This is [[optimistic-concurrency]]: no locks, just a check at the end
and a retry on conflict. It works well when clients mostly touch
different keys, so conflicts are rare.

"Changed" is broader than another client's write. A key that expires
or is evicted between `WATCH` and `EXEC` also aborts the transaction
(since Redis 6.0.9). Every `EXEC` clears all watches, whether it ran or
not.

For the simplest case, Redis 8.4 added a shortcut: `SET` with `IFEQ`
and related options sets a string only if its current value is what
you read, in one command, and `DELEX` does the same for deletes.

## Lua scripts: the logic runs inside Redis

A script sent with `EVAL` runs on the server, calls commands with
`redis.call`, and can branch on what they return. While it runs, every
other client waits, so its effects appear all at once or not at all.
The counter becomes one round trip with no retry loop. A script can
do anything a `MULTI` transaction can, usually more simply, which is
why rate limiters use one to check and increment in one step (see
[[distributed-rate-limiting]]).

Some rules come with it:

- **Pass every key as an argument.** Keys go in `KEYS`, other values
  in `ARGV`. A script shouldn't build key names itself, because
  Redis Cluster depends on knowing them. Scripts that declare flags
  (a `#!lua` first line) refuse keys from different hash slots by
  default.
  Hash tags, like `{user:42}:tokens` and `{user:42}:stamp`, put
  related keys in the same slot.
- **The script cache is volatile.** `EVALSHA` runs a cached script by
  its SHA1, but a restart or a [[failover]] empties the cache and you
  get `NOSCRIPT`. Most client libraries then load the script and
  retry for you. Redis 7.0 added Functions, scripts stored in the
  database, for logic you want to deploy on its own.
- **Replicas get the effects.** Since Redis 7.0, only a script's
  writes go to replicas and the append-only file, wrapped in
  `MULTI`/`EXEC`; the script isn't rerun there.

## Where it gets tricky

**No rollbacks, anywhere.** An error while queueing (a typo, the wrong
number of arguments) makes `EXEC` refuse the whole transaction, since
Redis 2.6.5. An error while running is different. Queue
`SET a abc` and `LPOP a`, and `EXEC` returns OK for the first and a
`WRONGTYPE` error for the second: the `SET` stays done. Redis chose
this to stay simple and fast. Scripts give you no undo either, as the
next point shows. So "transaction" here means isolated, not atomic in
the [[acid|ACID]] sense.

**A slow script freezes the server.** Scripts block every other
client. After five seconds by default (`busy-reply-threshold`), Redis
starts answering other clients with `BUSY`, but it won't stop the
script on its own, because that could leave half-written changes. A
script that hasn't written yet can be stopped with `SCRIPT KILL`. One
that has written can only be stopped by `SHUTDOWN NOSAVE`, which kills
the server without saving its data to disk.

**Durability is a separate question.** A hard crash can leave part of
a transaction in the append-only file; Redis then won't start until
`redis-check-aof` trims it. How much you can lose is
[[redis-persistence]]'s topic.

**Not a lock.** Neither `WATCH` nor a script holds anything across round trips. Owning a
resource for a while needs a [[distributed-locks|lock]].

## What this means when you build

- Use a single command when one exists (`INCR`, the 8.4
  compare-and-set options).
- Use a short Lua script for read-decide-write logic.
- Use `WATCH` when the logic must live in your application, and retry
  a null `EXEC` a bounded number of times.
- Validate first. Redis won't undo the half that succeeded.
- In a cluster, give related keys the same hash tag and pass them all
  in `KEYS`.

## Further reading

- [Transactions](https://redis.io/docs/latest/develop/using-commands/transactions/), Redis docs. MULTI, EXEC, WATCH, the error cases and why there are no rollbacks.
- [Scripting with Lua](https://redis.io/docs/latest/develop/programmability/eval-intro/), Redis docs. EVAL, EVALSHA, KEYS and ARGV, the script cache, and effects replication.
- [Redis programmability](https://redis.io/docs/latest/develop/programmability/), Redis docs. Scripts vs Functions, the atomicity guarantee, and what happens to a script that runs too long.
- [Redis cluster specification](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/), Redis. Hash slots and hash tags, which decide which keys a script can use together.
