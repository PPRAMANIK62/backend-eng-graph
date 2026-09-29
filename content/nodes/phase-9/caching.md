---
id: caching
title: Caching
depth: deep
phase: 9
note: >-
  Keeping a copy closer to where it's needed. Hit ratios and what a miss
  costs.
needs: [memory-hierarchy]
leads_to: [caching-patterns, eviction-policies, feed-fan-out, metastable-failures, cache-stampede]
compare_with: [http-caching, denormalization, hot-spots]
---

# Caching

A cache keeps a copy of data somewhere faster or closer than where the
data really lives, so a repeat read can skip the slow trip. In a
backend that usually means keeping database results in memory, in your
own process or in a Redis or Memcached fleet. Done well, it cuts
latency and takes most of the read load off the database. It also adds
a second copy that can be wrong, and a second way for the system to
behave when that copy is missing.

## The same trick at every layer

You've met caches before. The CPU keeps recently used memory in its
[[cpu-cache]]; the kernel keeps file pages in the [[page-cache]]; a
resolver keeps DNS answers ([[dns-caching]]); browsers and CDNs keep
HTTP responses ([[http-caching]]). Each is one step of the
[[memory-hierarchy]]: a small, fast layer in front of a big, slow one.

An application cache is the same idea one level up. The slow layer is
a database query or a call to another service, and the fast layer is a
hash table in memory.

It only works if requests repeat. A cache assumes locality (what was
read recently will be read again soon) or skew (a few keys get most of
the reads). Real cache workloads are usually skewed: the popularity of
keys in Twitter's production caches roughly follows a Zipf
distribution, sometimes a very steep one. If every request asks for
something unique, a cache has nothing to reuse and only adds a hop.

## Hit ratio and what a miss costs

Every read is a **hit** (the cache had it) or a **miss** (it didn't,
so you go to the source and usually store the answer). The **hit
ratio** is hits divided by all reads. Redis reports the counts
directly: `keyspace_hits / (keyspace_hits + keyspace_misses)` from
`INFO stats`.

Two simple sums tell you what the cache is worth:

- **Average latency** = hit ratio × time for a hit + miss ratio × time
  for a miss. A miss costs the cache lookup *plus* the full trip to the
  source, so it's slower than having no cache at all.
- **Load on the source** = read rate × miss ratio. The database only
  sees the misses.

The second sum is the one that bites. Production caches often run with
very few misses. At Twitter, eight of the ten busiest cache clusters
had a miss ratio under 5%, and six were close to or under 1%. Facebook
reported pool miss rates from 0.053% (a replicated pool of hot data) to
7.85% (a pool of content that goes out of fashion within hours). Even
so, the misses add up: Meta's TAO serves more than a quadrillion
queries a day, and at a 99% hit rate that is still over 10 trillion
cache fills a day.

Work the sum the other way and you see why a small change in hit ratio
matters. The database load is proportional to the *miss* ratio, not the
hit ratio. When the miss ratio doubles, the database's load doubles,
even though the hit ratio has barely moved.

That's also why a steady miss ratio matters more than a low average.
You size the database for the worst hour, so a cache that usually
misses very little but sometimes misses a lot is worth less than one
with a slightly higher, steady miss ratio. The Twitter study found most
production caches stable over a week, and noted that the ones with
extremely low miss ratios were the most fragile: maintenance and
failures hurt them most.

## Where the cache lives

**In your process.** A hash table inside each server is quick to add,
has no network hop and no extra fleet to run. Three problems come with
it. Each server has its own copy, so two requests from one client can
see different values depending on which server answered. The load on
the database grows with the number of servers, because each one misses
separately. And a freshly started server has an empty cache, so a
deploy that restarts the fleet sends a burst of misses downstream.

**In a separate fleet.** A Redis or Memcached cluster is shared by all
servers, so there's one copy per key, the database sees one miss per
key instead of one per server, and a deploy of your service doesn't
empty it. The cost is another system to run, monitor and scale, whose
availability is different from both your service and the database.
Keys are spread over cache nodes with [[consistent-hashing]], so adding
a node moves only some keys instead of emptying the whole cache.

**Beside the data path or in it.** With a *side* cache, your code
checks the cache, calls the database on a miss and stores the result.
With an *inline* cache, the cache sits in the data path and does that
work itself. Who fills the cache and when writes reach the database is
the subject of [[caching-patterns]].

## Two modes: cache warm, cache empty

Here's the part that surprises people. Adding a cache doesn't just make
the system faster. It gives it two ways to behave.

![Two loops side by side. Left, cache warm: most reads hit, latency is low, the database gets only the misses, so it stays fast and the cache stays full. Right, cache empty: most reads miss, the database gets nearly all the load, latency rises and requests pile up, and the cache never gets the chance to refill. Both loops are stable; a cache flush, a failed cache node or a deploy can move the system from the left one to the right one.](img/caching-two-modes.svg)

*A cache in front of a database gives the system two stable modes. Adapted from Marc Brooker, "Caches, Modes, and Unstable Systems" (2021).*

With the cache warm, the database sees only the misses, stays fast, and
everything is fine. Over time, the database gets scaled down to match
that smaller load.

Now empty the cache: a restart, a failed node, a key format change that
makes every old entry unreadable. Every read goes to the database. It
was sized for the misses, so it slows down, requests pile up, latency
climbs, and the cache refills slowly or not at all because the fills
themselves are stuck behind a slow database. That loop is stable too.
The system can stay in it until someone sheds load or adds capacity.
This is one of the most common [[metastable-failures]].

Amazon's engineers describe this as a service that has become
*addicted* to its cache: what started as an optimization is now
something the service can't run without. Facebook's memcache paper
shows how seriously large sites take it. A restarted memcached server
took a few hours to get back to 90% of its peak hit rate, so upgrading
a set of servers could take over 12 hours of careful pacing. When cache
servers failed, a small reserve pool called Gutter (about 1% of the
servers) took their traffic, so their keys weren't rehashed onto
servers that might then be overloaded by a [[hot-spots|hot key]]. And when a whole
cluster started cold, it filled from a warm cluster rather than from
the databases, which brought it up in hours instead of days.

CPU caches mostly escape this trap, and the reason is useful. When your
laptop gets slow because its caches are cold, you wait and ask for less.
Slowness reduces the offered load. A web service has no such brake:
users keep sending requests whether or not the cache is warm. Caches
that are safe in distributed systems add that brake back, with
[[load-shedding]], limits on requests to the database, or serving stale
data.

## Where it gets tricky

**The copy goes stale.** A cache holds the value as of when it was
stored. Something has to expire or remove it when the source changes,
and the races around that are the subject of [[cache-invalidation]].
Clients have to tolerate being slightly behind.

**It fills up.** The cache is smaller than the data behind it, so it
needs a rule for what to drop. That's [[eviction-policies]]. Expiry and
eviction are different things: a key's TTL says when it's no longer
valid, eviction decides what to drop when memory runs out. In the
Twitter traces, TTLs (from minutes to days) limited the working
set, and the authors argue that removing expired items quickly should
come before tuning eviction. memcached, for one, only removes expired
items lazily, when they're read or reach the end of its LRU list.

**One hot key can stampede.** When a popular key expires, every
request for it misses at once. See [[cache-stampede]].

**Load tests can miss the bad mode.** Caches love steady, repeated
load. A load test that sends lots of traffic with the usual key mix
keeps the cache warm and never shows you the empty-cache loop. The test
that finds it runs with the cache disabled, or with a different, more
spread-out key mix.

**Errors need caching too.** If a lookup fails or finds nothing and you
store nothing, every retry goes to the source again. Amazon caches
error and not-found results ("negative caching") with a TTL of their
own, and has seen outages made worse by not doing it.

**Not every cache is read-heavy.** More than 35% of the Twitter
clusters were write-heavy (over 30% of operations were writes), and one
busy cluster missed around 70% of the time. Twitter splits its caches
into three uses: in front of storage, for saving computation, and for
transient data. The last two behave differently from a cache shielding
a database.

**It's a new attack surface.** A poisoned entry is served to everyone
until it expires, and the speed difference between a hit and a miss can
tell an attacker what other users just asked for.

## What this means when you build

- Cache only data that's reused across requests, and that clients can
  see slightly stale.
- Emit hit and miss counts, cache size and the request rate to the
  source, and alert on the miss ratio. Watch its worst hour, not its
  average.
- Plan for an empty cache: size the database for it, or cap requests to
  the database and shed load, and test with the cache turned off.
- Prefer a shared cache fleet when a cold start or per-server copies
  would hurt; keep a small in-process cache when a network hop is too
  slow and staleness is fine.
- Treat the cached value's format like a stored format: new code must
  read old entries, or a deploy empties the cache.
- Cache negative results with their own TTL.

## Further reading

- [Caching challenges and strategies](https://aws.amazon.com/builders-library/caching-challenges-and-strategies/), Matt Brinkley and Jas Chhabra, Amazon Builders' Library. Local vs external caches, inline vs side caches, soft and hard TTLs, negative caching, and the "addicted to the cache" failure.
- [Caches, Modes, and Unstable Systems](https://brooker.co.za/blog/2021/08/27/caches.html), Marc Brooker, 2021. Why a cache gives a system two stable modes, and why CPU caches don't have the problem.
- [Scaling Memcache at Facebook](https://www.usenix.org/system/files/conference/nsdi13/nsdi13-final170_update.pdf), Rajesh Nishtala et al., NSDI 2013. A look-aside cache at huge scale: pools, miss rates, Gutter, warmup and upgrades.
- [A large scale analysis of hundreds of in-memory cache clusters at Twitter](https://www.usenix.org/system/files/osdi20-yang.pdf), Juncheng Yang, Yao Yue and K. V. Rashmi, OSDI 2020. Real miss ratios, write-heavy caches, TTLs and popularity skew from 153 production clusters.
- [Key eviction](https://redis.io/docs/latest/develop/reference/eviction/), Redis docs. How to read the hit ratio from `INFO` and what the memory limit does.
- [Cache made consistent](https://engineering.fb.com/2022/06/08/core-infra/cache-made-consistent/), Lu Pan (Meta), 2022. Source of the TAO query and cache-fill counts.
