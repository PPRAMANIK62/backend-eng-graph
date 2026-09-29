---
id: cache-invalidation
title: Cache invalidation
depth: deep
phase: 9
note: >-
  Keeping cached data from going stale: TTLs, deletes on write, and
  their races.
needs: [caching-patterns, redis-internals]
leads_to: [cache-stampede]
compare_with: [change-data-capture, dual-writes]
---

# Cache invalidation

Cache invalidation is how you stop a cache from serving a value the
database no longer holds. There are two basic tools: let entries
expire after a time to live (TTL), or remove them when the data
changes. Both are simple to describe. The hard part is that a cache is
written from two directions at once, by readers filling it and by
writers invalidating it, and those two can race.

## Tool one: let entries expire

Give every entry a TTL and it disappears on its own. Nothing has to
tell the cache that the data changed, and the TTL is a hard limit on
how stale a value can be.

The catch is picking the number. A short TTL means more misses and more
database load; a long one means users see old data for longer. Uber's
integrated cache, CacheFront, defaults to 5 minutes. Uber found that
most users wanted changes to show up faster than that, and that
lowering the TTL cut the hit rate without really improving consistency.
TTL alone suits data that changes slowly or where a few minutes of
staleness is fine.

Two refinements are worth knowing. A **soft TTL and a hard TTL**: after
the soft one, the client tries to refresh; if the source is down, it
keeps serving the old value until the hard one. And **negative
entries** (cached "not found" or error results) get a TTL of their
own. Both come from Amazon's
experience running caches in front of services.

## Tool two: delete on write

In the [[caching-patterns|cache-aside pattern]], the writer updates the
database and then deletes the cached key. The next reader misses and
loads the new value.

Two details matter:

- **Delete, don't set.** Writing the new value into the cache sounds
  better (no miss afterwards), but two writers can set their values in
  the opposite order to the one they committed in. A delete gives the
  same result however many times it runs and in whatever order.
  Facebook's memcache chose deletes for exactly that reason.
- **Database first, then cache.** Delete first, and a reader can slip
  in between, miss, read the *old* row and put it back before the
  database changes.

Deletes are cheap to over-send. At Facebook, only 4% of the deletes
issued actually removed something from the cache; the rest were for
keys that weren't cached.

## The race that deletes don't fix

Even in the right order, cache-aside has a hole. It needs a slow reader:

![Sequence diagram with four lanes: a reader, the cache, the database and a writer. The reader misses on key x, and reads x=42 from the database. Before the reader stores it, a writer sets x=43 in the database and the invalidation (delete x) reaches the cache, which is empty anyway. Then the reader's fill of x=42 arrives and is stored. The database holds 43 and the cache holds 42, and nothing will correct it until the entry expires.](img/cache-invalidation-race.svg)

*A fill that arrives after the invalidation leaves the old value in the cache. Adapted from Lu Pan, "Cache made consistent" (Meta, 2022).*

1. A reader misses on `x` and reads `x = 42` from the database.
2. Before the reader stores it, a writer sets `x = 43` and deletes `x`
   from the cache. There's nothing to delete.
3. The reader's `set x = 42` lands.

The database says 43, the cache says 42, and nothing will fix it until
the entry expires or someone writes `x` again. Without a TTL, that's
forever. This is a [[race-condition]] between the read path and the
write path, and both Meta and Uber describe running into it.

There are three common defenses, and big systems use more than one.

**Leases.** Facebook's memcache hands a reader a 64-bit token, bound to
the key, when it misses. The reader must present the token to store the
value. A delete of that key cancels the token, so in the story above the
late `set x = 42` is rejected. It works like load-link/store-conditional
on a CPU: the store only succeeds if nothing touched the value in
between.

**Versions.** Store a version with each value and refuse to overwrite a
newer one with an older one. Uber's CacheFront uses each row's MySQL
timestamp as its version and does the compare-and-set inside [[redis-internals|Redis]] with
an atomic Lua script, because its read path and its invalidation stream
both write to the cache and would otherwise race. Versions have a gap
too: if the newer entry is evicted before the old fill arrives, the
cache has forgotten there was anything newer, and the old value goes
in.

**A TTL as a backstop.** Keep a TTL even when you invalidate. It caps
how long any missed or out-of-order invalidation can hurt.

## Who sends the invalidation

**The application, after each write.** Simple, and it's how most
systems start. But the database write and the cache delete are two
steps in two systems. If the process crashes between them, or the
delete fails, the cache is stale until the TTL runs out: the
[[dual-writes]] problem in a small form. It also can't see changes made
by any other program that writes the database, or an update whose
affected rows you don't know in advance. Uber hit that last one with
conditional updates that change whichever rows match a filter.

**The database's commit log.** Read the log of committed changes and
turn each change into an invalidation. Facebook's daemons (called
mcsqueal) read the SQL each database commits, pull out the keys to
delete, and broadcast them to every cluster in the region. Uber's
CacheFront tails the MySQL binlog through its change data capture
service and invalidates or refreshes the rows in Redis. That's
[[change-data-capture]] used for caching.

The log route has real advantages. It sees every committed change, no
matter who made it. It never sees uncommitted data, so a rolled-back
transaction can't pollute the cache. And because the log is durable, a
lost or misrouted invalidation can be replayed; at Facebook, fixing a
bad invalidation used to mean a rolling restart of the whole cache
fleet. Uber's move to the binlog brought the cache in line with the
database within seconds instead of minutes.

The cost is that it's asynchronous. There's a short window after every
write when the cache is still old. A user who saves a change and
reloads can see the old value. Both companies patch that window
directly: Facebook's web server also deletes the key in its own cluster
right after writing, and Uber added an API that invalidates the rows
straight after a write. The log stays as the safety net.

## Replicas make it worse

With read replicas, the cache can be refilled from a replica that
hasn't received the write yet. Delete `x` in a region whose database
replica is behind, and the next reader there loads the old row and
caches it. That is [[replication-lag]] leaking into the cache.

Facebook's fix was to send invalidations from the storage side, along
with replication: the invalidation daemons also run with the replica
databases, so an invalidation doesn't reach a region before the data
it's about. For writes made in a non-master region, a "remote marker"
tells readers the local replica may be stale and sends them to the
master region instead.

## Measuring it

You can't see stale entries by looking at hit ratios. You have to check.

- Facebook sampled one in a million deletes and later checked whether
  the key was still cached anywhere. In the master region, four nines
  of deletes had taken effect within 1 second and five nines within an
  hour; between replica regions it was three nines within a second and
  four within 10 minutes.
- Meta built a service, Polaris, that listens to invalidation events,
  queries the cache like a client and checks whether it eventually
  matches the database. With it, TAO went from six nines to ten nines
  of cache writes consistent within five minutes: fewer than 1 in 10
  billion still wrong after five minutes.
- Uber shadows reads to the database and compares. With binlog-driven
  invalidation, CacheFront measured 99.99% consistent.

Meta's post also shows why this matters. The bug it found sat in an
error handler: after a rare transient error during an invalidation, the
handler dropped the cached item only if its version was *older* than the
invalidation's. The stale item carried the latest version with the old
data, so the drop did nothing and the wrong value stayed. No design
review would have found it; the monitoring did.

## Where it gets tricky

**Stale for a moment vs stale forever.** A brief delay after a write is
normal with any asynchronous invalidation. An entry that *stays* wrong
is a bug. Monitor the second, and decide how much of the first your
users can live with.

**Invalidation causes load.** Deleting a hot key sends every reader to
the database at once, and a key that is written often gets deleted
often. Facebook's leases double as the fix for that, which is covered in
[[cache-stampede]].

**Local caches multiply the problem.** With a cache inside every server,
each copy needs invalidating. You broadcast deletes to all servers, or
live with short TTLs and servers disagreeing for a while.

**Sometimes staleness is the point.** Facebook treats the chance of
reading stale data as a knob, tuned against database load, and its
memcache can hand a reader a just-deleted value marked stale, so code
that can live with it doesn't wait for the database.
Uber made caching opt-in per request, because invalidation can fail or
lag, and flows like reading a user's own cart bypass it.

**HTTP caches are a different world.** Browsers and proxies you don't
run can't be sent a delete; they follow the rules in [[http-caching]],
and a [[cdn]] has its own purge tools.

## What this means when you build

- Always set a TTL, even when you also invalidate.
- On writes: update the database, then delete the key. Don't set it.
- Guard fills against the slow-reader race with a lease, a version
  check, or at least a short TTL.
- Once more than one program writes the data, drive invalidation from
  the database's log instead of from application code.
- For read-your-own-writes, also delete synchronously after the write.
- Measure consistency directly by sampling keys and comparing with the
  database. Don't wait for users to report it.

## Further reading

- [Cache made consistent](https://engineering.fb.com/2022/06/08/core-infra/cache-made-consistent/), Lu Pan (Meta), 2022. The fill-vs-invalidation race, why versions aren't enough, Polaris, and a real bug found with it.
- [Scaling Memcache at Facebook](https://www.usenix.org/system/files/conference/nsdi13/nsdi13-final170_update.pdf), Rajesh Nishtala et al., NSDI 2013. Delete-on-write, leases, invalidation from the commit log, remote markers, and measured invalidation latency.
- [How Uber Serves Over 40 Million Reads Per Second from Online Storage Using an Integrated Cache](https://www.uber.com/blog/how-uber-serves-over-40-million-reads-per-second-using-an-integrated-cache/), Eli Pozniansky, Piyush Patel and Preetham Narayanareddy (Uber), 2024. TTL limits, binlog-driven invalidation, timestamp versions, and measuring consistency.
- [Cache-Aside pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside), Microsoft Azure Architecture Center. Why you update the store before deleting from the cache.
- [Caching challenges and strategies](https://aws.amazon.com/builders-library/caching-challenges-and-strategies/), Matt Brinkley and Jas Chhabra, Amazon Builders' Library. Soft and hard TTLs, negative caching, and local-cache coherence.
