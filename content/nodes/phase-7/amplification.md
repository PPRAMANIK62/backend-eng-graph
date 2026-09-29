---
id: amplification
title: Read, write and space amplification
depth: deep
phase: 7
note: >-
  Read, write and space amplification: the three costs every storage
  engine trades between.
needs: [b-plus-tree, lsm-tree, compaction, ssd-internals]
leads_to: [storage-benchmarks]
compare_with: []
---

# Read, write and space amplification

Every storage engine does more work than you asked for. You write a
128-byte row and the disk sees kilobytes; you read one key and the engine
looks in several places; you store 100 GB and the files take 150.
Read, write and space amplification are the three ratios that measure
that extra work, and they're the clearest way to compare a
[[b-plus-tree|B+tree]] with an [[lsm-tree|LSM tree]], or one
[[compaction]] setting with another.

## Three ratios

Each one divides what the engine did by what you asked for.

- **Write amplification**: bytes written to storage divided by bytes
  written to the database. If your application writes 10 MB/s into
  RocksDB and `iostat` shows the disk writing 30 MB/s, write
  amplification is 3.
- **Read amplification**: the work done per read. The simplest version
  counts disk reads per query: if a lookup has to read 5 pages, read
  amplification is 5. Some people count bytes instead, or add CPU work
  such as key comparisons and decompression.
- **Space amplification**: the size of the database files on disk divided
  by the size of the data in them. Put 10 MB of data in and use 100 MB of
  disk, and space amplification is 10.

The best possible value for each is 1: read exactly the data you want,
write exactly the bytes you changed, store nothing but your data. No
real engine gets there on all three.

These ratios aren't a replacement for big-O. They depend on a specific
workload and setup: how much RAM, how big the database is, what kind of
storage. They exist because constant factors matter once some data lives
on disk. An engine that does 1.2 disk reads per query and one that does
1.5 have the same big-O, and the difference between them can matter a
lot.

## Following one small write

Take a 128-byte row change, and follow it through each kind of engine.
The numbers below are a worked example, not a benchmark.

**In a B+tree** (a clustered one, like InnoDB), the change first goes
into the [[write-ahead-log]], 128 bytes. The row lives on a 4,096-byte
page. In the worst case the [[buffer-pool]] is full of dirty pages, so
bringing this page in forces another page out, and every row change ends
up costing a full page write. That's 4,096 + 128 bytes written for 128
bytes of change: write amplification of 33. It gets better when several
changes land on the same page before it's written back, and worse with
smaller rows.

**In an LSM tree** with leveled compaction (like RocksDB), the row also
goes to the log first: 1. It sits in the memtable until that's flushed
to level 0: 1 more. Then compaction carries it down, level by level.
Moving data from level 0 to level 1 costs about 1. From then on, each
level is about ten times bigger than the one above, so pushing a file
down means merging it with the roughly ten overlapping files below and
rewriting them all. In theory that's about 10 per level. In practice
it has come out nearer 7. With levels 0 to 4, the total is 1 + 1 + 1 + 7 + 7 + 7 = 24.

![Two write paths for a 128-byte row change. Top: a B+tree writes a 128-byte log record and then the whole 4,096-byte page, write amplification 33. Bottom: an LSM tree with leveled compaction writes the row to the log (1), flushes it to level 0 (1), compacts it to level 1 (about 1), then to levels 2, 3 and 4 (about 7 each), write amplification about 24.](img/amplification-write-paths.svg)

*One small write, two engines. Worked numbers, not a benchmark. Adapted from Mark Callaghan, "Read, write & space amplification - B-Tree vs LSM" (2015).*

The two examples use different assumptions, so don't read them as a
contest. The general pattern still holds: an LSM tree tends to write
less than a B+tree. Its writes also come later. A B+tree has to read the
page before it can change it. An LSM tree takes the write into memory,
and does the reading and rewriting in the background, during
[[compaction]].

Other people's sums differ. RocksDB's tuning guide, working through a
500 GB database with an L1 of 512 MB and a multiplier of 10, gets about
1 + 2 + 10 + 10 + 10 = 33. For a large LevelDB database with random
keys, the estimate is up to 50. The exact number depends on how many
levels you have, how skewed the keys are, and what you count.

## Reads: how many places you look

Read amplification depends heavily on what's cached, so any comparison
has to state its assumptions. A common one: for a B+tree, every level
but the leaves is in memory; for an LSM tree, everything but the data
blocks of the largest level is in memory. Under those assumptions a
point lookup costs at most one disk read in both engines.

The difference moves to the CPU. A B+tree is one tree. An LSM tree is
really many: the memtable, each sorted run in level 0, and each level
below that. In the RocksDB setups one engineer measured, that was 10 to
20 trees to search.
A [[bloom-filter]] per [[sstable]] lets a point lookup skip most of them,
but not for free: the filter still has to be found and checked. On
read-only tests where the database mostly fit in RocksDB's block
cache, the number of trees changed RocksDB's throughput by up to about 5x for range queries and
point queries without bloom filters, and about 2x for point queries
with them.

Range scans are where LSM trees pay most. Bloom filters answer "is this
key here?", not "are there keys between A and B?", so a scan has to look
in every level-0 file and every non-empty level.

So "read amplification" really has two parts: pages read from storage,
and CPU spent per query. On a cached workload the second one is usually
the problem.

## Space: what's on disk that isn't your data

A B+tree wastes space inside its pages. After random inserts and
updates, leaf pages sit between half and two-thirds full, which means
space amplification of 1.5 to 2. InnoDB also keeps about 20 bytes per
row for transactions and consistent reads. And compression doesn't help
as much as you'd hope, because on-disk pages have a fixed size: a 16 KB
page that compresses to 5 KB still takes a whole 8 KB slot, wasting 3 KB.

An LSM tree packs its files tightly, so its waste is different: old
versions of rows, and deleted rows, that compaction hasn't removed yet.
With leveled compaction and each level ten times the one before, all
the upper levels together are about 11% of the last level, so the worst
case is around 1.11. That assumes the last level is full; if it's only a
little bigger than the level above, space amplification can go past 2.
RocksDB can avoid this by sizing each level from the size of the one
below.
Tiered compaction (RocksDB calls it universal) keeps more old versions
around, typically around 2, and can need twice the space again
temporarily while it merges the largest files.

Compression pushes space amplification down, below 1 if it works well.
[[block-compression]] fits LSM trees well because their files are
written once and never changed in place.

## You can have two

Here's the pattern behind all of this. Suppose you push one ratio to its
best possible value:

- **Perfect writes**: append every change to a log and never reorganize
  it. Write amplification is 1. Reads have to search an ever-growing
  log, and space grows with every update.
- **Perfect space**: store the data as a dense array with no index.
  Space amplification is 1, updates are in place, and every read scans
  everything.
- **Perfect reads**: put every value at a position computed from its key,
  so you always read exactly one slot. Now the space is as big as the
  largest key you might ever see.

The RUM conjecture (Read, Update, Memory, from a 2016 paper) generalizes
this: if you put an upper bound on two of the three overheads, the
third gets a lower bound it can't go below. It's a conjecture, not a
proof, but engine builders lean on it: the RocksDB team cites it for
why they can't cut all three at once. You pick which two you care
about.

![A triangle with corners labelled read-optimized, write-optimized and space-optimized. Hash indexes and B+trees sit near the read corner, LSM trees and append-only logs near the write corner, and compression, bloom filters and sparse indexes near the space corner. An arrow from an LSM tree with tiered compaction to one with leveled compaction points away from the write corner, toward reads and space.](img/amplification-rum-triangle.svg)

*Where common structures sit. Tuning moves an engine around the triangle, not out of it. Adapted from Athanassoulis et al., "Designing Access Methods: The RUM Conjecture" (EDBT 2016), figure 1.*

The knobs in a real engine are moves along those edges:

- **Level size multiplier.** Bigger means fewer levels, so less space
  and read amplification, but more write amplification. Facebook's
  production RocksDB mostly used 10, a few 8.
- **Compaction style.** Leveled compaction spends writes to keep reads
  and space low. Tiered compaction writes less, but reads can get worse
  and space always does.
- **Block size.** Bigger blocks compress better and shrink the index,
  but each read pulls in more data. In a B+tree, bigger pages make both
  reads and writes worse.
- **Bloom filter bits per key.** RocksDB's default of 10 gives about 1%
  false positives. More bits mean fewer wasted reads and more memory and
  space.

## Why each one costs money

Write amplification caps how fast you can write. If the disk sustains
500 MB/s and write amplification is 50, the database can take 10 MB/s.
Cutting write amplification in half doubles that ceiling. On flash it
also wears the drive: every extra byte counts against its endurance
rating (see [[ssd-internals]]).

Space amplification decides how many machines you buy. The RocksDB team
at Facebook found their SSD servers ran out of space long before they
ran out of IO: the data had to be spread over so many nodes that each
one got few queries. Fitting twice as much data on each SSD would have
meant far fewer nodes. That was the case for moving
MySQL from InnoDB to MyRocks: across their installations, RocksDB used
about half the space of compressed InnoDB and wrote 10 to 15% as many
bytes.

Read amplification decides latency and how many reads per second one
machine can serve.

## Where it gets tricky

**People define the ratios differently.** One definition counts bytes
(data read divided by data wanted), another counts disk reads per query,
another adds CPU work. Two reports can both say "read amplification 3"
and mean different things. Ask what was counted.

**Compaction reads don't have an obvious home.** An LSM tree reads files
back to compact them. Are those read amplification or write
amplification? A reasonable answer is write amplification, because they
happen on behalf of writes (a B+tree also reads pages in order to write
them). But `iostat` doesn't know why a read happened, so a physical read rate from
`iostat` includes both.

**The drive has its own write amplification.** The SSD's flash
translation layer copies live data around during garbage collection,
underneath whatever the engine writes (that's in [[ssd-internals]]).
Writing large sequential files, as an LSM tree does, doesn't make that
go away. Different LSM levels hold data with very different lifetimes,
and when short-lived and long-lived data end up in the same erase block,
the drive has to copy the long-lived data out.

**Faster isn't the same as more efficient.** An engine with high read
amplification can hide the latency by issuing its disk reads in
parallel. Response time looks fine, but it's still doing more IO per
query, so at high concurrency it serves fewer queries than an engine
with lower read amplification.

**The numbers depend on the workload.** Sequential inserts into an LSM
tree can skip compaction entirely, so write amplification is 1 or 2.
Skewed keys that keep hitting the upper levels write less than uniform
random keys. A number measured on one workload doesn't carry over.
That's why [[storage-benchmarks]] have to describe the workload and the
state of the engine.

## What this means when you build

- When you compare two engines, report all three ratios, not just
  throughput. A faster engine may be paying for its speed in one of the
  other ratios.
- Measure them directly: disk bytes written over bytes the application
  wrote, disk reads per query, and database size over data size.
  Normalize `iostat` and CPU numbers by queries per second.
- Decide which resource you're short of. Flash wear and ingest rate
  point at write amplification; disk cost points at space; latency and
  reads per second point at read amplification.
- Tune one knob at a time, and expect the other two ratios to move.
- Remember the drive underneath has its own write amplification.

## Further reading

- [Read, write & space amplification - pick 2](http://smalldatum.blogspot.com/2015/11/read-write-space-amplification-pick-2_23.html), Mark Callaghan, 2015. The short post that set up the framework and its definitions.
- [Read, write & space amplification - B-Tree vs LSM](http://smalldatum.blogspot.com/2015/11/read-write-space-amplification-b-tree.html), Mark Callaghan, 2015. The worked numbers for a B-tree and a leveled LSM, and how to measure the ratios in a benchmark.
- [Designing Access Methods: The RUM Conjecture](https://openproceedings.org/2016/conf/edbt/paper-12.pdf), Manos Athanassoulis and others, EDBT 2016. The ratio definitions, the extreme cases and the conjecture that you can only bound two.
- [Optimizing Space Amplification in RocksDB](https://www.cidrdb.org/cidr2017/papers/p82-dong-cidr17.pdf), Siying Dong and others, CIDR 2017. Why space mattered most at Facebook, the knobs that trade it, and MyRocks against InnoDB.
- [RocksDB Tuning Guide](https://github.com/facebook/rocksdb/wiki/RocksDB-Tuning-Guide), RocksDB team, wiki. Working definitions, how to observe each ratio, and which options move which one.
- [Benchmarking the leveldb family](http://smalldatum.blogspot.com/2014/07/benchmarking-leveldb-family.html), Mark Callaghan, 2014. Why write amplification climbs toward 50 on a large database, and how sequential loads hide it.
- [Read-only benchmarks with an LSM are complicated](http://smalldatum.blogspot.com/2021/02/read-only-benchmarks-with-lsm-are.html), Mark Callaghan, 2021. CPU read amplification, and why the number of trees in an LSM changes read throughput.
