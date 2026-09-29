---
id: caching-patterns
title: Caching patterns
depth: short
phase: 9
note: >-
  Cache-aside, read-through, write-through and write-behind: who fills
  the cache, and when a write reaches the database.
needs: [caching]
leads_to: [cache-invalidation]
compare_with: []
---

# Caching patterns

Once you put a [[caching|cache]] in front of a database, two questions
decide how the pieces are wired: who fills the cache on a miss, and when
a write reaches the database. The four common answers have names:
cache-aside, read-through, write-through and write-behind. Each one
trades a little speed, simplicity or safety for another.

## Four ways to wire a cache

![Four small diagrams, each with an app, a cache and a database. Cache-aside: the app reads the cache, on a miss reads the database and fills the cache; on a write it updates the database and deletes the key. Read-through: the app reads the cache, and on a miss the cache itself loads from the database. Write-through: the app writes the cache, which writes the database and only then returns. Write-behind: the app writes the cache, which returns at once and writes the database later in batches.](img/caching-patterns-four.svg)

*Who fills the cache, and when a write reaches the database, in each pattern.*

**Cache-aside** (also called lazy loading or look-aside). Your code does
all the work. To read, it asks the cache; on a miss it queries the
database, stores the result in the cache and returns it. To write, it
updates the database and then deletes the cached key, so the next read
loads the new value. The cache is just a key-value store beside the
data path and knows nothing about the database.

This is the most common pattern, and it's how Facebook ran memcache in
front of MySQL. Only data someone actually asked for gets cached,
so the cache stays small. The cost is that the first read of anything,
and every read after it's deleted or expires, pays the cache round trip
*and* the database round trip.

**Read-through.** The read path looks the same from outside, but the
cache does the loading. You give the cache a loader, and on a miss it
calls the database itself, stores the value and returns it. Your code
only ever talks to the cache. Products built for this, like Oracle
Coherence with its "cache store" plug-in, also keep database access in
one place: only the cache servers talk to the database, so the load on
it is more predictable and your application code holds no database
logic.

**Write-through.** A write goes to the cache, and the cache writes it
to the database before the write returns. Reads after a write find the
new value already in the cache, so there's no miss and no window where a
reader sees the old value. It doesn't make writes any faster: you still
wait for the database. And it fills the cache with everything written,
including data nobody reads again, so it's almost always combined with
lazy loading and a TTL to push unread data out.

**Write-behind** (write-back). A write goes to the cache and returns at
once. The cache queues the change and writes it to the database later,
after a delay you configure. If the same key changes several times in that
window, the database sees one write, and many keys can go in one
transaction. Writes get fast and the database gets fewer of them.

The price is that, until the queue drains, the cache is the only place
the change exists. The data is only as safe as the cache cluster's
memory, not a disk, and the database lags behind. Worse, the
database write now happens after your caller was told "done": it must
not fail, or you need a way to undo things. Updates can reach the
database out of order, and nothing stops them conflicting with another
program that writes the same tables.

A fifth, less common option is **refresh-ahead**: the cache reloads
entries that are being read and are close to expiring, in the
background, so readers rarely wait on a miss. It only helps if the cache
guesses right which entries will be needed; wrong guesses are wasted
database load.

## Where it gets tricky

**"Write-through" means two things.** In a product like Coherence, the
cache writes the database. In most application code (and in AWS's Redis
guidance), write-through means *your code* updates the database and
then writes the new value into the cache. The second is really two
separate writes to two systems with no transaction around them, and a
crash between them leaves them different: the problem in
[[dual-writes]].

**Delete, don't update, and mind the order.** In cache-aside, update the
database first, then delete the key. Delete first, and a reader can
slip in between, miss, read the old row and put it back in the cache.
Deleting rather than writing the new value is safer because a delete
can be repeated without harm. Even in the right order, a slow reader can
still put back an old value; those races are [[cache-invalidation]].

**Concurrent misses.** In cache-aside, if a hundred requests miss the
same key at once, a hundred queries hit the database. That's the
[[cache-stampede]] problem.

## What this means when you build

- Start with cache-aside plus a TTL. It's the easiest to reason about,
  and a lost or evicted entry only costs a miss, never a wrong answer.
- On writes, update the database, then delete the key.
- Use write-through when readers must see their own writes and the
  data is read often. Keep a TTL anyway.
- Treat write-behind as a durability decision, not a caching one:
  you're choosing to acknowledge writes the database doesn't have yet.

## Further reading

- [Cache-Aside pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside), Microsoft Azure Architecture Center. The read and write steps, why the order of update and delete matters, and when not to use it.
- [Caching Data Sources](https://docs.oracle.com/en/middleware/fusion-middleware/coherence/14.1.2/develop-applications/caching-data-sources.html), Oracle Coherence 14.1.2 docs. Read-through, write-through, write-behind and refresh-ahead from people who build them, including what write-behind demands.
- [Caching patterns](https://docs.aws.amazon.com/whitepapers/latest/database-caching-strategies-using-redis/caching-patterns.html), AWS whitepaper on Redis. Lazy loading vs write-through and why you combine them with a TTL.
- [Scaling Memcache at Facebook](https://www.usenix.org/system/files/conference/nsdi13/nsdi13-final170_update.pdf), Rajesh Nishtala et al., NSDI 2013. Look-aside at scale, and why they delete instead of update.
