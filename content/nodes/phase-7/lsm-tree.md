---
id: lsm-tree
title: LSM trees
depth: deep
phase: 7
note: >-
  Buffer writes in a memtable, flush sorted files, merge them later.
needs: [write-ahead-log, log-structured-hash-table, skip-list, storage-engine]
leads_to: [sstable, amplification, compaction]
compare_with: [b-plus-tree, log-structured-hash-table, column-storage]
---

# LSM trees

A log-structured merge tree (LSM tree) is a storage engine that never
updates data in place. Writes go into a sorted table in memory; when
that fills up, it's written to disk as a new sorted file, and a
background process keeps merging those files into bigger ones. Writes
become cheap and sequential, and reads get a little harder, since a key
can live in several places. RocksDB, LevelDB and Google's Bigtable are
all built this way, so it's the other half of the
[[storage-engine]] world next to the [[b-plus-tree]].

## The problem it solves

A B+tree keeps each key in exactly one place, on one page. To change a
key, the engine has to find that page, read it, change it and later
write it back. When keys arrive in random order, each insert lands on a
different page somewhere on disk. On a fast-growing table that means
random I/O for every row, and for every index on it.

The 1996 paper that named the LSM tree started from exactly that case:
an index on a history table taking a constant stream of inserts, where
a B-tree index would roughly double the I/O cost of each transaction.
Its answer was to defer and batch the index changes: collect them in
memory, and move them to disk in large sorted chunks, the way a merge
sort works.

The general idea is called *out-of-place* updating. An in-place
structure like a B+tree overwrites the old record. An out-of-place one
writes the new version somewhere new and leaves the old one to be
cleaned up later. That's what makes writes sequential. It's also why a
read may have to look in more than one place.

The simplest out-of-place engine is a [[log-structured-hash-table]]:
one log plus an in-memory hash map of every key. An LSM tree keeps its
data sorted instead, in memory and in every file on disk. That's what
lets it answer range queries, and it means the full set of keys never
has to fit in memory.

## A write, step by step

Here's `put("user:42", "Ada")` in an engine like LevelDB or RocksDB.

1. **Log it.** The change is appended to the
   [[write-ahead-log]]. If the write must survive a power cut, the
   engine [[fsync|fsyncs]] the log before saying yes; RocksDB lets you
   choose that per write, and batches many writes into one fsync with
   [[group-commit]].
2. **Put it in the memtable.** The *memtable* is a sorted in-memory
   structure; in RocksDB it's a [[skip-list]] by default. Inserting
   into it costs no disk I/O. It holds the newest data, so every read checks it
   first.
3. **Freeze and swap.** When the memtable reaches a size limit, it
   becomes read-only, and a fresh memtable and log file take new
   writes. LevelDB switches at about 4 MB by default; RocksDB's
   default memtable is 64 MB, and by default it keeps at most two in
   memory, the active one and one waiting to be flushed.
4. **Flush.** A background thread writes the frozen memtable to disk as
   a new sorted file, an [[sstable]]. It's one sequential write of
   already-sorted data. Once that file is safely on disk, the old log
   file isn't needed and is deleted.
5. **Compact, later.** Flushed files pile up in level 0. [[compaction]]
   merges them into bigger files in the levels below, dropping values
   that newer writes have replaced.

![Memory holds the active memtable and an immutable memtable. A put first appends to the WAL on disk, then goes into the memtable. The full memtable is frozen and flushed as a sorted file into level 0, where files overlap (each covers a to z). Level 1 is one sorted run split into files a-f, g-m, n-s, t-z; level 2 is about ten times bigger. Compaction merges L0 into L1, and merges one L1 file (g-m) with the L2 files it overlaps (g-i, j-m). A get looks newest to oldest and stops at the first hit.](img/lsm-tree-write-read-path.svg)

*The write path (numbered) and the shape on disk. Level sizes follow LevelDB's 10× rule. Adapted from the LevelDB implementation notes and Chen Luo and Michael J. Carey, "LSM-based Storage Techniques: A Survey" (2019).*

Nothing on disk is ever changed after it's written. The log is only
appended to, SSTables are written once and then only read, and
compaction writes new files and deletes old ones. Engines lean on that
immutability to keep crash recovery and concurrency control simple.

## A read, step by step

Because a key can have versions in several places, a read looks from
newest to oldest and stops at the first match:

1. the active memtable,
2. any immutable memtables waiting to be flushed,
3. each level-0 file, newest first (they overlap, so all of them may
   need checking),
4. then at most one file in each lower level, since in LevelDB's
   layout files in the same level below 0 don't overlap.

The first version found is the newest, so it wins. If it's a deletion
marker, the answer is "not found".

That could mean many file reads for one key, so engines don't read
blindly. Each SSTable can carry a [[bloom-filter]], kept in memory, that says
whether the key definitely isn't in that file, and a block index that
points to the one block to read if it might be. For a key that doesn't
exist at all, most lookups never touch disk.

A range scan can't use Bloom filters. It opens an iterator on every
memtable and every relevant file at once, and merges their sorted
streams, newest version winning, the way a merge sort's final pass
does. Bigtable called this reading from a "merged view" of the memtable
and the SSTables. It's efficient because every input is already sorted,
but it still touches every level.

## Deletes are writes too

You can't remove a key from an immutable file, so a delete is an insert
of a special entry: a *tombstone* (also called an anti-matter
entry). It hides older values of the key for any read that reaches it
first.

The tombstone has to live until every older value below it is gone.
LevelDB's rule: compaction drops overwritten values right away, but
drops a deletion marker only when no deeper level has a file whose key
range covers that key. Until then, deleted data still takes space, and
the tombstone itself does too. The original paper did the same thing
with "delete node entries" that travel down and cancel the real entry
when a merge meets it.

## Keeping it in shape

Every flush adds a file. Left alone, reads would get slower and slower,
and old versions would fill the disk. [[compaction]] is the process that
merges files to fix both. LevelDB's layout, which RocksDB inherited:

- **Level 0** takes flushed memtables as they are. Its files can
  overlap. When there are more than four, they're merged with the
  overlapping level-1 files.
- **Level 1 and below** each hold one sorted run, split by key range
  into files (2 MB each in LevelDB). A level's files don't overlap.
- **Each level is about 10× the one above**: 10 MB for level 1, 100 MB
  for level 2, and so on. When a level goes over its limit, one of its
  files is merged with the overlapping files one level down.

Merging uses only large sequential reads and writes. The same data does
get rewritten several times as it moves down, which is the main cost of
the design; [[amplification]] puts numbers on it. How and when files
are merged (leveled, tiered, and hybrids of the two) is the subject of
[[compaction]].

## Crash recovery

After a crash the memtable is gone, but everything in it is in the log.
Recovery replays the log into a new memtable, and in LevelDB turns it
straight into a new level-0 file. It only has to redo, never undo,
because a memtable is flushed only after every write in it has
finished (a *no-steal* policy).

The engine also has to know which SSTables make up the tree right now,
since compaction keeps replacing them. LevelDB and RocksDB write every
change to the file set (file added, file deleted) to a small log of
their own, the MANIFEST, and a file called CURRENT names the latest
MANIFEST. Recovery reads CURRENT, then the MANIFEST, then replays the
data log. More on the general pattern in [[crash-recovery]].

## Where it came from

The 1996 paper's LSM tree had a memory component C0 and one or more
disk components C1, C2, …, each a B-tree-like structure packed 100%
full. A *rolling merge* continually moved ranges of entries from one
component into the next, writing merged blocks to new disk space.

Today's engines keep the idea and drop the mechanism. Google's Bigtable
(2006) gave the modern shape: a sorted memtable, immutable SSTables on
disk, a "minor compaction" that turns a full memtable into an SSTable,
and "merging" and "major" compactions that combine SSTables. LevelDB
is modelled on a single Bigtable tablet, and added levels made of
small, non-overlapping files, so a merge touches only part of a
level. RocksDB started as a fork of LevelDB 1.5. The rolling merge
itself isn't used by today's systems because it's too complex to
implement; merging whole immutable files is simpler.

## Where it gets tricky

**Writes are fast only while compaction keeps up.** Flushing and
compaction run in the background, and if they fall behind, level-0
files pile up. Every read then checks more files, and eventually the
engine has to slow or stop writes until compaction catches up: a *write
stall*. Slowing writes down on purpose is one of the fixes in LevelDB's
design. In RocksDB, write throughput depends directly on compaction
speed, and running compaction on several threads can raise sustained
write rates by as much as 10× on SSDs. So an LSM tree's
headline write speed is really "as fast as compaction can merge".

**Reads of data that exists can still be slow.** Bloom filters help
with keys that aren't there. A key that was written long ago is at the
bottom, so a read may pass through filters and indexes of every level
before finding it. Range scans pay the most: most LSM engines can't do
efficient range scans, because a scan has to look into many files.

**Deleting doesn't free space.** Until compaction reaches the bottom,
a delete makes the database bigger, and reads still have to step over
the tombstones.

**The memtable size is a trade.** A bigger memtable holds more writes
before a flush, which is one way to cope with a
pile-up in level 0. But it costs memory, and every flush is also what
keeps the log short: the less has been flushed, the more log there is
to replay after a crash.

**"LSM tree" means a family, not one design.** The original paper,
Bigtable, LevelDB and RocksDB share the out-of-place idea but differ in
how they merge. When someone compares "LSM vs B+tree", ask
which compaction style and settings they mean.

## What this means when you build

- Lean toward an LSM engine when writes dominate, and toward a B+tree
  when reads, especially range scans, dominate. [[amplification]] is how
  to reason about it with numbers.
- Budget I/O and CPU for compaction, not only for your own queries. If
  the disk is busy with your traffic, compaction falls behind and
  writes stall.
- Choose keys so data you read together sorts together. Everything in
  an LSM tree is ordered by key.
- Watch the level-0 file count and how far compaction is behind. They
  warn you before stalls do.
- Decide per write whether it needs an fsync'd log entry. Without one,
  a crash can lose the memtable's newest writes.

## Further reading

- [The Log-Structured Merge-Tree (LSM-Tree)](https://www.cs.umb.edu/~poneil/lsmtree.pdf), Patrick O'Neil, Edward Cheng, Dieter Gawlick and Elizabeth O'Neil, 1996. The original paper: why B-tree indexes hurt high insert rates, and the C0/C1 design with rolling merges.
- [LSM-based Storage Techniques: A Survey](https://arxiv.org/abs/1812.07527), Chen Luo and Michael J. Carey, 2019. Section 2 is the clearest explanation of the modern LSM tree, with its cost model.
- [Bigtable: A Distributed Storage System for Structured Data](https://static.googleusercontent.com/media/research.google.com/en//archive/bigtable-osdi06.pdf), Fay Chang and others, 2006. Sections 5.3 and 5.4: memtable, SSTables and compactions in a production system.
- [leveldb Implementation notes](https://github.com/google/leveldb/blob/main/doc/impl.md), LevelDB authors. Levels, level 0, when compaction runs, what it drops, and recovery with the MANIFEST.
- [RocksDB Overview](https://github.com/facebook/rocksdb/wiki/RocksDB-Overview), RocksDB team. The memtable, WAL and SST files in a modern engine, and why compaction speed limits writes.
- [MemTable (RocksDB wiki)](https://github.com/facebook/rocksdb/wiki/MemTable), RocksDB team. Memtable sizing, flush triggers and the default skip list.
