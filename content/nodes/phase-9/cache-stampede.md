---
id: cache-stampede
title: Cache stampedes
depth: short
phase: 9
note: >-
  A popular key expires and every request hits the database at once.
  Request coalescing and early refresh.
needs: [cache-invalidation, caching]
leads_to: []
compare_with: [thundering-herd, http-caching, hot-spots]
---

# Cache stampedes

A cache stampede happens when a popular cached value expires or is
deleted, and every request that arrives while it's being rebuilt misses
and rebuilds it too. The database gets a burst of identical queries for
exactly the data the cache was there to protect. It also goes by
dog-piling or a cache miss storm.

## How big a stampede gets

Take one key that's read 10 times a second, whose value takes 3 seconds
to compute. It expires. For the next 3 seconds, until the first
recompute finishes and stores the value, every request misses: about 30
requests all run the same expensive query. The size is roughly the
request rate times the recompute time.

It can feed on itself. Thirty copies of the query slow the database, so
each one takes longer, so more requests arrive during the gap and join
in. What started as one expiry becomes an overload.

Writes can cause the same thing without any expiry. Under
[[cache-invalidation|delete-on-write]], a hot key that's also written
often gets deleted over and over, and each delete sends its readers to
the database. Facebook's memcache paper calls this a thundering herd.

![Two timelines for one hot key. Top, no protection: the key expires, and every request that arrives during the 3-second recompute misses and runs its own database query. Bottom, with coalescing: the first request to miss loads the value; the others wait for it, or get the old value, and the database sees one query.](img/cache-stampede-coalescing.svg)

*Without protection, every miss during the rebuild queries the database. With coalescing, one does.*

## Three ways to stop it

**Let only one caller rebuild.** This is request coalescing. The first
request to miss becomes the loader; the rest wait for its result, or
are handed the old value.

- *Inside one process*, a small library does it. Go's `singleflight`
  package runs one call per key at a time; duplicate callers wait and
  get the same result (including the same error).
- *Across a fleet*, the shared cache has to arbitrate. The usual trick
  is a lock key: whoever sets it first rebuilds. It costs an extra write
  per rebuild, the lock needs its own expiry (longer than a rebuild,
  shorter than the refresh interval), and if the lock holder dies, no
  one refreshes until the lock expires.
- *Facebook's leases* build this into memcache. On a miss, the server
  hands out a token that lets one client fill the key, and hands out at
  most one token per key every 10 seconds. Other clients are told to
  wait a moment and retry; usually the value is there by then, because
  the lease holder fills it within milliseconds. On a set of keys prone
  to this, peak database queries dropped from 17K/s to 1.3K/s. Clients
  that can live with slightly old data can instead take the
  just-deleted value, marked stale, and not wait at all.

**Refresh early, at random.** Instead of every request seeing the key
as expired at the same instant, let each request decide on its own to
refresh a little early, with a probability that grows as expiry gets
closer. The XFetch algorithm does this with one line: store the value
with `delta`, the time the last recompute took, and recompute when

```
now - delta * beta * log(rand()) >= expiry
```

where `rand()` is a random number between 0 and 1, so
`-delta * beta * log(rand())` is an exponentially distributed gap
scaled by the recompute time, and `beta` defaults to 1. The exponential
shape is what makes it work well: it's been proven optimal among such
schemes, and it doesn't need to know the request rate. On a week of
real Goodreads traffic for one item with a 10-second recompute, most
"stampedes" were one or two refreshes, and none was larger than 8.

The cost is that the value gets refreshed somewhat before it had to be,
and there's no lock, so an occasional duplicate is still possible.

**Refresh in the background.** A separate job recomputes the value on a
schedule, so it never expires under readers. It prevents stampedes
completely, but it's one more process to run and monitor, and it
recomputes keys whether anyone reads them or not. The refresh-ahead
option in some caches ([[caching-patterns]]) is a lighter version.

## Where it gets tricky

**Per-process coalescing isn't per-fleet.** `singleflight` on each of
your servers still lets one load per server through for the same key. That may be
fine, or you may need coalescing in the shared cache too.

**Waiters need a plan.** When one caller rebuilds, the others must wait
(adding latency), fail, or get stale data. Pick one on purpose. And if
the rebuild fails, every waiter shares the failure.

**A stampede on one key vs an empty cache.** Everything here is about
hot keys. A whole cache coming back empty after a restart is the same
problem at a much larger scale, covered in [[caching]].

**Not the same as a thundering herd of retries.** A
[[thundering-herd]] is many clients waking up at once, often retries
after a failure. The shapes are alike (Facebook's paper even uses that
name for the cache case), but the fixes differ: retries get spread out
in time ([[retries-with-backoff]]), cache keys get coalescing or early
refresh. HTTP caches in front of your servers face the same problem;
see [[http-caching]].

## What this means when you build

- Find your hot keys and their recompute cost; rate × cost is the size
  of the stampede you're exposed to.
- Wrap cache loads in per-key coalescing (like `singleflight`) in every
  process. It's cheap.
- For expensive keys, add early probabilistic refresh, or serve stale
  while one caller refreshes.
- Store how long each value took to compute; XFetch needs it, and it
  tells you which keys are dangerous.

## Further reading

- [Optimal Probabilistic Cache Stampede Prevention](https://cseweb.ucsd.edu/~avattani/papers/cache_stampede.pdf), Andrea Vattani, Flavio Chierichetti and Keegan Lowenstein, VLDB 2015. The problem, the usual fixes and their costs, and XFetch with its proof and real-traffic results.
- [Scaling Memcache at Facebook](https://www.usenix.org/system/files/conference/nsdi13/nsdi13-final170_update.pdf), Rajesh Nishtala et al., NSDI 2013. Leases, and serving stale values, against thundering herds on hot keys.
- [singleflight](https://pkg.go.dev/golang.org/x/sync/singleflight), the Go authors. The standard in-process request coalescing API.
