---
id: eviction-policies
title: Eviction policies
depth: deep
phase: 9
note: >-
  LRU, LFU, ARC, W-TinyLFU, S3-FIFO: deciding what to drop when the
  cache is full, and comparing them by hit ratio at each cache size.
needs: [caching]
leads_to: [count-min-sketch]
compare_with: [buffer-pool]
---

# Eviction policies

A [[caching|cache]] is smaller than the data behind it, so when it's
full and a new item arrives, something has to go. The eviction policy
picks the victim. At a fixed cache size, a better choice means more
hits and less load on the database, so this small decision is worth a
lot. There's no single best policy: the right one depends on how your
keys are accessed, and you compare them by hit ratio across cache
sizes on real traces.

## The perfect policy, which you can't have

The best possible choice is simple to state: evict the item that won't
be needed for the longest time. That's Belady's MIN algorithm, and no
policy can beat its hit ratio. It needs to know the future, so no real
cache can run it. It's still useful: simulators replay a recorded trace
and run MIN on it to show the ceiling, and every real policy is judged
by how close it gets.

Real policies guess the future from the past, using two signals:

- **Recency.** Something used a moment ago will probably be used again
  soon.
- **Frequency.** Something used often will probably keep being used.

## LRU: bet on recency

Least Recently Used evicts the item that hasn't been touched for the
longest. You keep a hash map for lookup and a doubly linked list in use
order; every hit moves the item to the front, and the victim is at the
back. Both steps take constant time.

LRU adapts quickly when popularity shifts, and it's the usual default:
Redis recommends `allkeys-lru` if you have no reason to pick something
else.
It has three weaknesses.

- **Scans wipe it out.** Read a million keys once each, say during a
  batch job, and they push every hot key out of the cache, although
  none of them will be read again.
- **It ignores frequency.** A key read a thousand times and a key read
  once rank the same if they were last read at the same moment.
- **It's costly at high throughput.** Two pointers per item is real
  overhead when items are small, and moving an item on every hit means
  taking a lock on every hit.

Because of that last point, fast systems often run an approximation.
Redis doesn't keep a list at all: it samples a few keys at random (5 by
default, set by `maxmemory-samples`) and evicts the one idle longest.
CPU caches and the kernel's page cache also use approximations of LRU
rather than the real thing.

## LFU: bet on frequency

Least Frequently Used evicts the item with the fewest hits. If
popularity never changed, this would be the best you could do without
seeing the future. Popularity does change, though. Plain LFU keeps
yesterday's viral item forever because its count is huge, and it needs
a counter per item, and finding the smallest count takes more than
constant time.

Practical LFU therefore ages its counts. Redis's LFU mode (since Redis
4.0) keeps a small probabilistic counter per key, a Morris counter,
which fits in a few bits because it climbs more slowly the higher it
gets. The counter is decayed over time (by default, every minute), so
old popularity fades.

## Mixing the two

Most modern policies combine recency and frequency. Three worth
knowing:

**ARC (2003).** The Adaptive Replacement Cache keeps two LRU lists: one
for items seen once recently, one for items seen at least twice. It
also remembers the keys (not the values) of items it recently evicted
from each list, called ghost entries. A hit on a ghost tells ARC that
list was too small, so it shifts space toward it. It tunes itself
without any parameter, stays constant-time, and resists scans, since
items seen only once never push out the second list. It pays by
remembering twice as many keys as it holds, and it's covered by an IBM
patent.

**W-TinyLFU (2015).** Instead of only choosing a victim, ask whether
the newcomer is worth *more* than the victim. That's an admission
policy. TinyLFU estimates how often each key was seen recently, using a
tiny [[count-min-sketch]] with 4-bit counters that are all halved
periodically so old popularity fades. When the cache must drop
something, it compares the estimated frequency of the candidate coming
in with the one going out, and keeps the more popular.

A pure admission filter rejects new items that haven't had time to
build up a count, which hurts bursty workloads. So the "W" adds a small
window LRU in front, with no filter: every new item gets in there first
and competes for the main cache only when it falls out of the window.
The main cache is a segmented LRU, 80% of it "protected" for items hit
more than once. In Caffeine 2.0, the Java library where it was built,
the window was fixed at 1%; current Caffeine sizes it adaptively by
hill climbing on the hit rate. The overhead is about 8 bytes per entry,
and it keeps no ghost entries.

**S3-FIFO (2023).** This one starts from an observation about real
traffic: most items that enter a cache are never read again before
they'd be evicted. Across 6594 production traces, a median of 26% of
objects were requested only once in the whole trace, but in a window
holding 10% of the objects, 72% were. So the most useful thing a policy
can do is drop new items fast ("quick demotion").

S3-FIFO uses three plain FIFO queues. New items go into a small queue
(10% of the space). If they're hit again before reaching its end, they
move to the main queue (90%); if not, they're dropped and only their
key goes into a ghost queue. A key that comes back while still in the
ghost queue goes straight into the main queue. The main queue gives
items that were hit a second pass instead of evicting them. Each item
needs only two bits for a small hit count, and hits never move
anything, so there's no lock on the read path. In the paper's CacheLib
prototype, that gave about 6 times the throughput of an optimized LRU at
16 threads.

![Two cache structures. Top, W-TinyLFU: new items enter a small window LRU; items evicted from the window meet the TinyLFU filter, which compares their estimated frequency with the main cache's victim and admits the more frequent one into the main segmented LRU (probation and protected segments). Bottom, S3-FIFO: new items enter a small FIFO queue holding 10% of the space; items hit again move to the main FIFO (90%), others are dropped and their key goes to a ghost FIFO; a key found in the ghost queue is inserted straight into the main queue; the main queue reinserts items that were hit.](img/eviction-policies-wtinylfu-s3fifo.svg)

*Two ways to keep one-time items from pushing out popular ones: a frequency filter, or a small probation queue. Adapted from Einziger, Friedman and Manes, "TinyLFU" (figure 5), and Yang et al., "FIFO Queues are All You Need for Cache Eviction" (figure 5).*

The two designs share the key idea: new items get a short probation,
and only the ones that prove themselves get the bulk of the cache.

## Comparing policies

You compare policies by replaying real request traces through each one
at several cache sizes and plotting miss ratio against size. One
number at one size tells you little, because the ranking changes with
size. Two published results show how much it depends on the workload:

- On Twitter's production cache traces, FIFO often did about as well as
  LRU at reasonable cache sizes; LRU pulled ahead mainly when the cache
  was very small.
- In the S3-FIFO paper's comparison against 12 other policies on 14
  datasets, with
  the cache holding 10% of each trace's objects, S3-FIFO had the lowest
  miss ratio on 10 datasets, and the next best policy on only 2.

This project's phase 9 lab plans exactly this comparison for LRU,
W-TinyLFU and S3-FIFO; nothing has been measured yet.

## Where it gets tricky

**The research is still moving, and results disagree.** The S3-FIFO
paper found TinyLFU the closest competitor but worse than FIFO on a
share of traces, and blamed its 1% window for dropping items too fast;
a 10% window fixed much of that. That comparison used fixed windows,
while current Caffeine adapts its window size. Read any "best policy"
chart with the policy's exact configuration in mind.

**Web caches and block caches want different things.** Key-value and
CDN caches are dominated by skewed popularity and one-hit wonders.
Block and file caches see scans: a backup or an unindexed query reading
everything once. Simple FIFO-style policies that shine on web traffic
can be flushed by scans, which is why policies like ARC made scan
resistance a goal. Block traces are also hard because the easy hits
were already served by the database or the page cache above them.

**Every partitioned policy has a bad pattern.** If items are typically
requested twice, with the second request coming after they've left the
small probation queue, plain LRU or FIFO would have hit and W-TinyLFU or
S3-FIFO miss. The S3-FIFO authors point out that this hurts every
design that splits the cache, including TinyLFU, 2Q and LIRS.

**Speed matters, not only hit ratio.** A policy that updates shared
state on every hit can become the bottleneck on many cores. That's a
large part of why FIFO-based designs are back, and why most flash caches
(Memcached Extstore, CacheLib's large-object cache, Apache Traffic
Server, Google's Colossus flash cache) use FIFO: it writes in order,
which flash likes.

**Eviction isn't expiry.** A TTL removes an item because it's no longer
valid; eviction removes a valid item for space. In Redis, the
`volatile-*` policies only consider keys with a TTL, and act like
`noeviction` if none have one. The Twitter study argues that removing
expired items promptly should come before tuning eviction, because
TTLs are what bound the working set of many caches.

## What this means when you build

- Start with LRU or an approximation of it (Redis's default sampling is
  fine); it's rarely a bad choice.
- If you use a library, check which policy it runs. Caffeine, for
  example, uses W-TinyLFU.
- If one-time reads (scans, crawlers, batch jobs) share the cache with
  hot keys, pick a policy with a probation stage: W-TinyLFU, S3-FIFO or
  ARC.
- Decide with your own traces: record keys, replay them at several
  sizes, and plot miss ratio against size.
- Watch evictions next to the hit ratio. A lower hit ratio than you
  expect with lots of evictions suggests the wrong keys are being
  evicted, or the cache is too small.

## Further reading

- [ARC: A Self-Tuning, Low Overhead Replacement Cache](https://www.usenix.org/legacy/events/fast03/tech/full_papers/megiddo/megiddo.pdf), Nimrod Megiddo and Dharmendra S. Modha, FAST 2003. ARC, plus a clear tour of LRU, LFU, LRU-2 and Belady's MIN.
- [TinyLFU: A Highly Efficient Cache Admission Policy](https://arxiv.org/abs/1512.00727), Gil Einziger, Roy Friedman and Ben Manes, 2015 (ACM TOS 2017). Admission filtering, the frequency sketch, and W-TinyLFU.
- [FIFO Queues are All You Need for Cache Eviction](https://jasony.me/publication/sosp23-s3fifo.pdf), Juncheng Yang et al., SOSP 2023. One-hit wonders, S3-FIFO, and a comparison on 6594 traces.
- [Efficiency](https://github.com/ben-manes/caffeine/wiki/Efficiency), Ben Manes, Caffeine wiki. Why Caffeine picked W-TinyLFU over ARC and LIRS, with hit-rate charts against Belady's optimal.
- [Key eviction](https://redis.io/docs/latest/develop/reference/eviction/), Redis docs. Redis's policies, sampled LRU, and LFU with Morris counters.
- [A large scale analysis of hundreds of in-memory cache clusters at Twitter](https://www.usenix.org/system/files/osdi20-yang.pdf), Juncheng Yang, Yao Yue and K. V. Rashmi, OSDI 2020. FIFO vs LRU on real traces, and why TTLs matter.
- [Why Aren't We SIEVE-ing?](https://brooker.co.za/blog/2023/12/15/sieve.html), Marc Brooker, 2023. FIFO-style policies and scans, and why block traces are hard.
