---
id: redis-internals
title: Redis internals
depth: deep
phase: 9
note: >-
  One thread on an event loop, its data structures and their compact
  encodings, and where it added I/O threads.
needs: [event-loop, resp-protocol]
leads_to: [redis-persistence, distributed-rate-limiting, redis-transactions, cache-invalidation]
compare_with: []
---

# Redis internals

Redis is an in-memory key-value server that runs every command on one
main thread, driven by an [[event-loop]]. That one design choice
explains most of what you'll see when you use it: why a single command
is atomic without any locks, why one slow command freezes every other
client, and why adding cores doesn't help unless you know which part is
busy. The rest of Redis is about keeping that one thread fast: compact
encodings for small values, big jobs cut into small steps, and a few
helper [[thread|threads]] for work that doesn't touch the data.

## One command, start to finish

Say a web server sends `INCR page:home` to count a page view. It
arrives as a few bytes in the [[resp-protocol|RESP protocol]]: an array
holding the command name and the key.

Here's what the main thread does with it:

1. It's waiting in `epoll_wait` on Linux (see [[io-multiplexing]]) on
   all its client sockets at once. The kernel wakes it: this
   client's socket is readable.
2. It reads what's there, without blocking.
3. It parses whatever complete commands are in that client's buffer.
4. It looks up `page:home` in the keyspace, a hash table in memory,
   adds one, and puts the reply in that client's output buffer.
5. It writes the reply to the socket and goes back to waiting.

There's no lock anywhere in those steps. Only one thread ever touches
the data, so while `INCR` runs, nothing else can read or change that
key. Two clients sending `INCR` at the same moment get served one after
the other, and both increments count. That's the whole atomicity story
for a single command.

![Four clients feed two optional I/O threads, each with its own event loop that reads and parses RESP and writes replies. The I/O threads pass parsed commands to the main thread, which runs INCR, GET and SET one at a time against the in-memory keyspace with no locks, and also handles timers, active expiry, replicas and pub/sub clients. Below, the main thread hands off AOF fsync and freeing big values to background threads, and snapshots and AOF rewrites to a forked child process.](img/redis-internals-threads.svg)

*Where Redis 8 does its work. Every command runs on the main thread; everything else is kept off it.*

## Why one thread is fast enough

It sounds like a bottleneck, but for most workloads it isn't. Three
things make it work:

- **Commands are short.** The data is in memory and most commands do a
  constant amount of work: a hash lookup and a small change. There's no
  disk read in the middle of a `GET`.
- **It never blocks on a socket.** Reads and writes on client sockets
  are [[non-blocking-io|non-blocking]], so the thread never sits
  waiting for one slow client.
- **No locks, no sharing.** A multithreaded store has to lock or
  coordinate every shared structure. Redis skips that cost. Its creator
  has described Redis's speed as dominated by [[cpu-cache|CPU cache]]
  misses, not by computation, which is why cutting a pointer hop from
  its data structures once made every command faster.

So Redis is usually limited by memory or the network before the CPU.
When it does run out of CPU, the traditional answer was more
instances: run several Redis processes on one machine, or
[[partitioning|shard]] across machines, and use [[resp-protocol|pipelining]] to cut the per-command
overhead of system calls and round trips.

The price of one thread is that **every command waits for the one in
front of it.** A `GET` is quick, but `KEYS *` on a big
database, a `SUNION` of two huge sets, or `SORT` on a long list can take
long enough to show up as a latency spike for every client connected.
Redis documents the time complexity of every command for this reason.
The usual rule is: O(1) and O(log N) commands are what Redis is built
for; O(N) on big values is where you get stalls. `KEYS` in production
is the classic case, and `SCAN` (since Redis 2.8) is its replacement:
it walks the keyspace a little at a time.

## Big jobs get cut into small steps

A single-threaded server can't stop the world for a long job, so Redis
does its own housekeeping in slices between commands.

**Expiring keys.** A key with a TTL is removed in two ways. Lazily: a
command that finds an expired key deletes it. Actively: ten times a
second, Redis samples 20 keys that have a TTL, deletes the expired
ones, and goes again if more than a quarter of them were expired. That
adaptive loop keeps memory from filling with dead keys. The catch: if a
huge number of keys expire in the same second (easy to do with
`EXPIREAT` and one timestamp), the loop keeps going and the server
stalls.

**Growing a hash table.** When the keyspace's hash table needs to grow,
Redis doesn't rehash millions of keys in one long pause. It rehashes
incrementally, a slice at a time.

**Freeing memory.** Deleting a key used to mean freeing every element
at once. `DEL` on a set with 50 million members would block the server
for seconds. The fix was `UNLINK`: it measures how costly the value is
to free, frees small ones right away, and hands big ones to a
background thread. `FLUSHALL ASYNC` does the same for a whole database.

That last change mattered for more than deletes. To free values on
another thread safely, Redis had to stop sharing objects between the
keyspace and client buffers. Once values were no longer shared, other
threads could safely touch client buffers too, which is what made I/O
threads possible later.

Note the defaults, though. When Redis deletes something on its own,
because of eviction (see [[eviction-policies]]), expiry or a `SET` over
a big old value, it still frees it on the main thread unless you set
the `lazyfree-lazy-*` options to `yes`.

## Data structures, and the compact form of small ones

Redis values are data structures: strings, lists, hashes, sets, sorted
sets and streams, each with its own commands. Inside, most types have
two or more encodings, and Redis picks one per key based on its size.
`OBJECT ENCODING key` tells you which one a key is using.

| Type | Small | Big |
|---|---|---|
| String | `int` (fits in a 64-bit integer), `embstr` (up to 44 bytes, stored in the same allocation as the object header) | `raw` |
| List | `listpack` | `quicklist`, a linked list of listpacks |
| Hash | `listpack`, up to 512 fields of up to 64 bytes | `hashtable` |
| Set | `intset` (integers only, up to 512), `listpack` (up to 128, since 7.2) | `hashtable` |
| Sorted set | `listpack`, up to 128 entries of up to 64 bytes | `skiplist` (see [[skip-list]]) |
| Stream | | a radix tree of listpacks |

The limits are the defaults in `redis.conf` (for Redis 7.0 and later;
6.2 and older used the name `ziplist` for the same idea).

A listpack is one flat block of memory holding length-prefixed entries
back to back. Looking up a field means scanning it, which is O(N). That
sounds wrong for a hash, but N is capped at a few hundred, and a flat
array is kind to the CPU cache: the next entry is right next to the one
you just read. A real hash table gives O(1) lookups, but reaches every
entry through pointers, 8 bytes each on a 64-bit machine. For small
values the compact encodings use up to 10 times less memory, 5 times on
average.

![A small hash with fields name, city and score stored as one flat listpack: each field and value is preceded by its length, all in one allocation, scanned in O(N). An arrow shows that adding field 513 or an entry over 64 bytes converts it to a hash table, where a bucket array points to separate name, city and score entries. The hash table has O(1) lookups but uses pointers; the listpack can use up to 10 times less memory.](img/redis-internals-encodings.svg)

*One hash, two encodings. Redis switches from the top one to the bottom one on its own.*

The switch is automatic and invisible to your code. You can raise the limits to keep bigger values compact, but each
lookup then scans more bytes, so it's a trade of CPU for memory. If you
raise them a lot, Redis suggests benchmarking how long the conversion
takes.

This is why modelling matters. Storing a user as one hash with five
fields is usually much cheaper than five separate string keys: a few
top-level keys use more memory than one key holding a small hash.

## Where threads came in

"Redis is single-threaded" has been less true with each version. The
rule that hasn't changed is that commands run on the main thread.

- **Redis 2.4:** a background thread for slow disk work. The
  append-only file's `fsync` runs there, so the main thread doesn't
  wait for the disk (see [[redis-persistence]]).
- **Redis 4.0:** a background thread for freeing big values (`UNLINK`,
  `FLUSHALL ASYNC`).
- **Redis 6.0:** I/O threads. With `io-threads` set, other threads read
  from sockets, parse RESP and write replies. But the main thread
  waited for all of them to finish each round, and the I/O threads
  busy-waited, so they could sit at full CPU under moderate load.
- **Redis 8.0:** I/O threads redone. Each I/O thread now runs its own
  event loop over its own clients. The main thread hands a new
  connection to the I/O thread with the fewest clients, then only
  receives parsed commands, runs them, and passes replies back. It no
  longer calls `epoll_wait` for normal clients at all. TLS work moved to
  the I/O threads too. Replicas, `MONITOR`, pub/sub and client-tracking
  connections stay on the main thread, because the main thread writes
  to them directly.

The Redis team's own test of the 8.0 design ran `PING` with 15 I/O
threads on a 32-core Ryzen 7 7950X, using `memtier_benchmark` with 50
connections on each of 15 threads, and reached about 1.61 million
operations per second with a p99 of 0.847 ms. That's the ceiling of the
I/O path, not a typical number: `PING` does almost nothing once it
reaches the main thread.

Valkey, a fork of Redis, rebuilt its I/O threads in
Valkey 8.0 (2024) along the same line: commands stay on one thread,
while I/O threads read, parse, write, free memory and even take turns
running `epoll_wait`, which had been more than 20% of the main thread's
time. Its team reported going from about 360,000 to 1.19 million `SET`
requests per second against Valkey 7.2, with 8 I/O threads on an AWS
c7g.16xlarge, a number that also includes a new trick of prefetching
the keys a batch of commands will touch.

## Where it gets tricky

**"Single-threaded" means one thread runs commands, not one thread in
the process.** A busy Redis 8 with I/O threads, a background fsync
thread, a lazy-free thread and a forked snapshot child is using several
cores. What you can't do is make one slow command faster by adding
threads.

**I/O threads only help when I/O is the bottleneck.** Redis's config
file suggests turning them on only with 4 or more cores, leaving one
spare, and only if Redis is already using a lot of CPU. The 8.0 authors
found that with 2 I/O threads, simple `GET` and `SET` barely got faster
than with none. Run `top -H` on the Redis process: if the main thread
is at 100%, more I/O threads won't help, and only more shards or
replicas will.

**One command is atomic; a sequence of commands isn't.** Each command
runs start to finish without interruption, but between your `GET` and
your `SET`, other clients' commands can run. Code that reads a value,
decides in the client, then writes it back has the same
[[race-condition]] it would have anywhere else.

**Blocking comes from surprising places.** Deleting a big key,
expiring many keys at once, overwriting a big value with `SET`, and the
`fork` for a snapshot all run on the main thread by default. None of
them look like slow commands in your code.

**Encodings change under you.** A hash that crosses 512 fields, or gets
one value longer than 64 bytes, is converted and starts using several
times more memory. Memory use can jump for a change that looks tiny.

## What this means when you build

- Treat Redis as a single queue. Keep every command small, check the
  time complexity of anything that touches a whole collection, and
  never run `KEYS` in production. Use `SCAN`.
- Use `UNLINK` instead of `DEL` for big values, and consider the
  `lazyfree-lazy-*` settings if you evict or expire big keys.
- Spread TTLs out instead of expiring a batch of keys at the same
  second.
- Group small related fields into hashes and keep them under the
  listpack limits. Check with `OBJECT ENCODING`.
- Before turning on `io-threads`, find out whether the main thread or
  the network is the bottleneck. If it's the main thread, shard.
- For multi-step logic that must be atomic, you need something beyond
  single commands: [[redis-transactions|transactions or scripts]].
  [[distributed-rate-limiting]] is a place this comes up.

## Further reading

- [Redis serialization protocol specification](https://redis.io/docs/latest/develop/reference/protocol-spec/), Redis. RESP, the wire format a command arrives in.
- [Diagnosing latency issues](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/latency/), Redis. The single-threaded design, slow commands, KEYS, fork cost and the active expiry cycle, from the people who built it.
- [Redis FAQ](https://redis.io/docs/latest/develop/get-started/faq/), Redis. Why the data lives in memory, why CPU is rarely the limit, and when threaded work started.
- [Memory optimization](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/memory-optimization/), Redis. The compact encodings of small values, their limits, and why a flat array can beat a hash table.
- [OBJECT ENCODING](https://redis.io/docs/latest/commands/object-encoding/), Redis. Every internal encoding for every type, with the version each appeared in.
- [redis.conf](https://raw.githubusercontent.com/redis/redis/unstable/redis.conf), Redis. The comments on threaded I/O, lazy freeing and the encoding limits, with their defaults.
- [Lazy Redis is better Redis](http://antirez.com/news/93), Salvatore Sanfilippo, 2015. How a single-threaded server does big jobs in small steps, and how unsharing objects opened the way to threads.
- [Async IO Threads (pull request 13695)](https://github.com/redis/redis/pull/13695), Redis contributors, 2024. The Redis 8.0 I/O thread design, what was wrong with the 6.0 one, and its trade-offs.
- [Unlock 1 Million RPS](https://valkey.io/blog/unlock-one-million-rps/), Dan Touitou and Uri Yagelnik, 2024. Valkey 8.0's take on the same problem, including moving `epoll_wait` off the main thread.
