---
id: compaction
title: Compaction
depth: deep
phase: 7
note: >-
  Merging sorted files: leveled vs tiered, and what each costs.
needs: [sstable, lsm-tree]
leads_to: [amplification]
compare_with: [log-compaction, vacuum, tombstones]
---

# Compaction

Compaction is the background job in an [[lsm-tree]] that merges sorted
files into new ones. It throws away values that newer writes replaced
and data that was deleted, and it keeps the number of files a read has
to check under control. How an engine decides what to merge and when,
its compaction strategy, sets most of its costs: how much it rewrites,
how many places a read looks, and how much disk it needs.

## What one merge does

Every input to a compaction is sorted by key: a flushed memtable, or an
[[sstable]] from an earlier compaction. So the merge is the last pass
of a merge sort. Open an iterator on each input, repeatedly take the
smallest key among them, and write it to the output. When several
inputs hold the same key, the newest version wins and the others are
dropped.

Deletes need care. A delete was written as a *tombstone*, a marker that
hides older values. The merge can't simply drop the tombstone along
with the values it hides, because an even older value might sit in a
deeper level that isn't part of this merge; without the tombstone, that
value would come back. So a tombstone is kept until the merge reaches a
point where nothing older can exist below. LevelDB's rule is exactly
that: drop a deletion marker only when no deeper level has a file whose
key range covers the key.

![Two input files merged. The newer file has a=7, c=del and d=4; the older file has a=1, b=2, c=3 and e=5. The output keeps a=7, b=2, d=4, e=5, drops the older a=1 and c=3, and keeps the tombstone c=del if deeper levels exist. If the output is the bottom level, the tombstone is dropped too.](img/compaction-merge.svg)

*One compaction: newest version wins, and a tombstone lives until nothing older can be below it.*

The output goes to new files, written sequentially. The input files are
deleted only once nothing needs them, after reads that were using them
finish. Nothing is ever rewritten in place.

The simplest version of this is the merge in a
[[log-structured-hash-table]], which rewrites only the live values of
old files. An LSM tree does the same thing, but its files are sorted,
and that lets it be smarter about which files to merge.

## Why it has to run

Every memtable flush adds a file. Without compaction:

- **Reads slow down.** A point read may have to check every file, and a
  range scan has to merge all of them.
- **Space grows.** Every overwrite and every delete leaves the old data
  on disk.

Compaction fixes both, at the cost of reading and writing the same data
again, sometimes many times. The trade between those three costs has
its own page, [[amplification]]; this page is about the strategies.

## Sorted runs and levels

A useful word: a *sorted run* is a set of key/value pairs in key order,
stored in one or more files that don't overlap. A flushed memtable is a
sorted run. A whole level split into many non-overlapping files is also
one sorted run. A read may have to check every run (a [[bloom-filter]] can
make that check cheap), so the number of runs is what drives read cost.

Strategies organise runs into levels, each some factor T larger than
the one above (T is the *size ratio* or *fanout*, often 10). They
differ in one thing: when data is merged into a level, is the run
already there rewritten or not?

![Left, leveled: each level holds one sorted run; a merge from L0 into L1 rewrites L1's run, which is rewritten by each merge, about T−1 times, before it moves down. Writes are high, reads and space low. Right, tiered: each level holds up to T runs; when L0 is full its three runs are merged into one new run placed beside the existing run in L1, without rewriting it. Writes are low, reads and space higher.](img/compaction-leveled-vs-tiered.svg)

*The two basic shapes. Adapted from Chen Luo and Michael J. Carey, "LSM-based Storage Techniques: A Survey" (2019), figure 3.*

## Leveled compaction

Each level is one sorted run. Merging into level n reads the data
coming down from level n−1 and rewrites the overlapping data already in
level n. A level's run gets merged into over and over, about T−1 times,
until it's full and moves down in turn.

**Costs.** Reads are cheap: at most one run per level. Space is tight:
with T = 10, the levels above the last hold only about a tenth as much
as the last, so old versions can't take much room. Writes are
expensive: in the worst case each level rewrites a byte about T times.
In practice it tends to be less than the fanout, and in RocksDB total
leveled write amplification is often larger than 10.

**The partitioned version.** The original 1996 design merged all of one
level into the next. LevelDB split each level into small files of about
2 MB with non-overlapping key ranges, and merges *some to some*: pick
one file in level n, find the files in level n+1 whose ranges overlap
it, merge them, and replace them. In LevelDB's own worst-case estimate,
one 2 MB file overlaps about 12 files below (10 because the next level
is ten times bigger, plus two at the edges), so one compaction reads
and writes about 26 MB.

Partitioning has good side effects. Each merge is small, so it takes
bounded time and temporary space. Keys inserted in order barely need
merging, because new files don't overlap old ones. And key ranges that
nobody writes to aren't rewritten.

**Which file next.** RocksDB gives each level a score (its size over its
target size, or for level 0, its file count over a trigger) and
compacts the level with the highest score first. LevelDB
picks files within a level round-robin through the key space, so every
range gets its turn. Since RocksDB 8.4, level targets are sized
backwards from the last level by default, which keeps about 90% of the
data in the last level and so bounds space amplification.

## Tiered compaction

Each level can hold up to T sorted runs. New runs are added next to the
ones already there, and when a level has T runs, all of them are merged
into one new run in the next level. The runs already in that next level
aren't read or rewritten. A common way to run tiered skips the idea
of levels and just merges runs of similar size. Cassandra calls this
size-tiered; RocksDB calls it universal.

**Costs.** Writes are cheap: each level writes a byte about once, which
is why tiered is the choice when leveled can't keep up with the write
rate. Reads and space are worse, both by about a factor of T: there are
up to T runs per level to check, and the same key can have a version in
each of them.

**The problems.** Transient space is the big one. Merging the largest
runs means the inputs and output exist at the same time, so a full
compaction can briefly double the disk space used. Big runs also mean
big indexes and filters, and long compactions. And merges are all to
all: if only a few keys get updated, whole large runs are still
rewritten. The lazy schedule makes the I/O spiky, and the number of
runs, and so read speed, varies over time.

## The cost model in one table

Worst-case costs from the survey's cost model, for size ratio T, L levels, and B
entries per page:

| | Leveled | Tiered |
|---|---|---|
| Write cost per entry | O(T·L/B) | O(L/B) |
| Short range query | O(L) | O(T·L) |
| Space amplification | O((T+1)/T) | O(T) |

Leveled pays T in writes to save T in reads and space. Tiered does the
opposite. With Bloom filters, lookups of keys that don't exist cost
nearly nothing either way, and lookups of keys that do exist cost about
one I/O in both. The read penalty of tiered falls mostly on range
scans.

## Hybrids and what real engines use

Real engines mix the two, and a level-by-level view explains them:

- **RocksDB's "leveled" is really tiered at the top.** Flushed memtables
  land in level 0 as separate runs, which aren't merged with each other
  on the way in. That's tiered. Below level 0 it's leveled. This
  *tiered+leveled* shape writes less than pure leveled and uses less
  space than pure tiered.
- **Leveled-N** allows a few runs per level but still merges into an
  existing run, sitting between the two.
- **Cassandra 5.0** offers size-tiered (still the default), leveled
  (for read-heavy work and lots of updates and deletes), time-window
  (for TTL'd time series), and the newer unified strategy, which it
  recommends for new workloads.

## Where it gets tricky

**Compaction has to keep up.** It's background work competing with
foreground I/O. If writes arrive faster than it can merge, level-0 files
pile up, reads slow down and the engine eventually stalls writes (see
[[lsm-tree]]). Leveled compaction can't
handle a write rate far above what its configuration can sustain.

**Tombstones linger.** A delete frees nothing until its tombstone and
every older version meet in a merge that reaches the bottom. A key range
that stops getting writes may never be compacted, so its garbage stays;
RocksDB added a TTL option that forces old files through compaction for
this reason. Cassandra adds a second rule for replication: a tombstone
must also outlive a grace period, ten days by default, so a replica that
missed the delete can't bring the data back.

**Leave free space.** A tiered full compaction can double disk use for a
while. Even leveled needs room for its output files before the inputs
are deleted.

**The names don't match.** "Universal" is RocksDB's tiered and
"size-tiered" is Cassandra's. In RocksDB's universal style a "major
compaction" merges all sorted runs and a "minor" one merges some; in
Cassandra, "major" means a merge of everything that a user asks for,
and "minor" means any automatic compaction. The phrase "LSM tree" itself used to
imply leveled compaction. Ask what someone means before comparing
numbers.

**Not Kafka's compaction.** [[log-compaction]] in a message log shares
the name but solves a different problem.

## What this means when you build

- Start with leveled, partitioned into small files: it's the simplest to
  reason about, bounds space, and is the design LevelDB and RocksDB are
  built around.
- Keep deletion markers until you're writing the bottom level, and test
  that deleted keys never come back after a merge.
- Delete input files only after the new files, and the record of which
  files make up the tree, are safely on disk.
- Watch level-0 file count and how far compaction is behind; slow
  writes down before they stall completely.
- Switch to tiered only for write-heavy work where you can afford the
  space and slower scans.

## Further reading

- [LSM-based Storage Techniques: A Survey](https://arxiv.org/abs/1812.07527), Chen Luo and Michael J. Carey, 2019. Leveling and tiering, partitioning, and the cost model behind the table above.
- [leveldb Implementation notes](https://github.com/google/leveldb/blob/main/doc/impl.md), LevelDB authors. How LevelDB picks files, what it drops, and what one compaction costs.
- [Name that compaction algorithm](https://smalldatum.blogspot.com/2018/08/name-that-compaction-algorithm.html), Mark Callaghan, 2018. A short taxonomy: leveled, tiered, tiered+leveled and leveled-N, and what each minimizes.
- [Leveled Compaction (RocksDB wiki)](https://github.com/facebook/rocksdb/wiki/Leveled-Compaction), RocksDB team. RocksDB's default, with compaction scoring, dynamic level sizes and TTL.
- [Universal Compaction (RocksDB wiki)](https://github.com/facebook/rocksdb/wiki/Universal-Compaction), RocksDB team. Why tiered writes less, and the double-space problem.
- [Compaction overview (Apache Cassandra 5.0)](https://cassandra.apache.org/doc/5.0/cassandra/managing/operating/compaction/overview.html), Apache Cassandra. Strategies in another major engine, and tombstones with grace periods.
