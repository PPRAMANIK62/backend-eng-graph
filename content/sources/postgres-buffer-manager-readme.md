---
id: postgres-buffer-manager-readme
title: "src/backend/storage/buffer/README (PostgreSQL 18 source)"
author: The PostgreSQL Global Development Group
url: https://github.com/postgres/postgres/blob/REL_18_STABLE/src/backend/storage/buffer/README
kind: code
primary: true
---

## Summary

The developer notes for Postgres's shared buffer manager, on the
REL_18_STABLE branch: pins vs content locks, the buffer mapping hash
table and its partitions, the clock-sweep replacement algorithm, ring
buffers for big scans, VACUUM and bulk writes, and the background
writer.

## Key claims

- Two access controls: pins (reference counts) and content locks. "There are two separate access control mechanisms for shared disk buffers: reference counts (a/k/a pin counts) and buffer content locks." (Notes About Shared Buffer Access Rules)
- An unpinned buffer can be reused for another page at any moment. "An unpinned buffer is subject to being reclaimed and reused for a different page at any instant, so touching it is unsafe." (same)
- Pins can be held a long time; content locks are short. "These locks are intended to be short-term: they should not be held for long." (same)
- A hash table maps page identifiers (buffer tags) to buffers, protected by the BufMappingLock, split into partitions since 8.2. "As of PG 8.2, the BufMappingLock has been split into NUM_BUFFER_PARTITIONS separate locks, each guarding a portion of the buffer tag space." (Buffer Manager's Internal Locking)
- Before 8.1 one system-wide lock guarded the whole buffer manager and became a bottleneck. "Before PostgreSQL 8.1, all operations of the shared buffer manager itself were protected by a single system-wide lock, the BufMgrLock, which unsurprisingly proved to be a source of contention." (same)
- Victims are chosen by clock sweep. "To choose a victim buffer to recycle when there are no free buffers available, we use a simple clock-sweep algorithm, which avoids the need to take system-wide locks during common operations." (Normal Buffer Replacement Strategy)
- Each buffer has a usage counter bumped on every pin, up to a small limit. "Each buffer header contains a usage counter, which is incremented (up to a small limit value) whenever the buffer is pinned." (same)
- The hand skips pinned buffers and decrements nonzero usage counts. "If the selected buffer is pinned or has a nonzero usage count, it cannot be used." (same, step 4)
- A dirty victim must be written out before reuse. "if the selected buffer is dirty, we will have to write it out before we can recycle it" (same)
- Big one-pass reads use a small ring of buffers instead of flushing the whole cache. "a small ring of buffers is allocated using the normal clock sweep algorithm and those buffers are reused for the whole scan." (Buffer Ring Replacement Strategy)
- Sequential scans use a 256KB ring. "For sequential scans, a 256KB ring is used." (same)
- Bulk writes (COPY IN, CREATE TABLE AS) use a 16MB ring, at most 1/8 of shared_buffers. "For bulk writes we use a ring size of 16MB (but not more than 1/8th of shared_buffers)." (same)
- A dirtied ring buffer needs WAL flushed before reuse, so the ring suits read-only scans. "If a ring buffer is dirtied and its LSN updated, we would normally have to write and flush WAL before we could re-use the buffer" (same)
- The background writer writes dirty, unpinned, zero-usage buffers ahead of the clock hand. "The background writer is designed to write out pages that are likely to be recycled soon, thereby offloading the writing work from active backends." (Background Writer's Processing)
- A sequential scan keeps the current page pinned until it has processed every row on it. "sequential scans hold a pin on the current page until done processing all the tuples on the page" (Notes About Shared Buffer Access Rules)
- Choosing a victim takes only a spinlock, not a heavier lock. "A spinlock is used here rather than a lightweight lock for efficiency" (Buffer Manager's Internal Locking)
- VACUUM gets its own ring, sized by a setting. "VACUUM uses a ring like sequential scans, however, the size of this ring is controlled by the vacuum_buffer_usage_limit GUC." (Buffer Ring Replacement Strategy)

## Visuals worth redrawing

- The clock sweep with usage counts. Redrawn in `buffer-pool`.

## My notes

- On the master branch (Postgres 19 development, when this was read)
  the free list is gone and there is a third content lock mode,
  share-exclusive. Not cited; version 18 is what's released.
