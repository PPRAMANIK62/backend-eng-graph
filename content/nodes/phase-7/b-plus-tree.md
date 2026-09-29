---
id: b-plus-tree
title: B+trees
depth: deep
phase: 7
note: >-
  The on-disk tree behind most indexes: high fanout, splits and merges.
needs: [database-pages, indexes]
leads_to: [heap-files, amplification, latches]
compare_with: [lsm-tree, skip-list]
---


# B+trees

A B+tree is a sorted tree built out of [[database-pages|pages]], wide
and shallow, so that finding any key in millions takes only a handful of
page reads. It's the structure behind almost every ordered [[indexes|index]]: the
default index in Postgres, InnoDB's tables and indexes, every [[sqlite|SQLite]]
table. If you want to know why an index lookup is cheap, why random keys
make inserts slower, or what an [[lsm-tree]] is trying to beat, this is
the thing to understand.

## Counting page reads, not comparisons

Take a `users` table with a few million rows and an index on `email`.
You want to find `ada@example.com`.

In memory, you'd reach for a binary search tree: one key per node, two
children, about 22 levels for four million keys. On disk that's a bad
fit. Every node you visit may be a separate read from the drive, and a
read costs the same whether you use 16 bytes of the page or all of it.
When the data is on disk, the cost that matters is the number of pages
you read.

So a B-tree puts as many keys as fit into each node, and makes each node
one page. A node with hundreds of keys has hundreds of children. To see
what that does, pretend each page holds 100 keys (real pages often hold
more):

- 1 level: 100 keys
- 2 levels: 10,000 keys
- 3 levels: 1,000,000 keys

Each extra level multiplies the reach by the fanout. Real indexes with
millions of rows are typically four or five levels deep, and six is
rare. The few pages at the top are touched by every lookup, which makes
them the easiest pages for the [[buffer-pool]] to keep in memory.

## The "+" in B+tree

The original B-tree stores keys and their values in every node. A
B+tree changes two things:

1. **Values live only in the leaves.** The inner nodes hold only
   separator keys and pointers to children. They're a road map, not
   data. A separator doesn't even have to be a key that still exists; it
   only has to send a search the right way.
2. **The leaves are linked.** Each leaf points to its right neighbour
   (Postgres links both ways). Once a search
   reaches the first leaf of a range, it walks sideways and never goes
   back up.

![A three-level B+tree over email addresses. The root holds separator "k". Two inner nodes hold separators "d, g" and "p, t". Six leaf pages at the bottom hold sorted emails and row pointers, linked left to right by sibling pointers. A highlighted path shows a lookup for ada@example.com going root, left inner node, first leaf. A second highlighted path shows a range scan from "d" to "m" reaching one leaf and then following sibling links across three leaves.](img/b-plus-tree-structure.svg)

*A B+tree. Inner nodes only route; data lives in the linked leaves. Adapted from Douglas Comer, "The Ubiquitous B-Tree" (1979), figure 13.*

Both changes pay off. Inner nodes without values fit more separators per
page, so the fanout is higher and the tree shallower. SQLite shows the
cost of skipping the first change: its WITHOUT ROWID tables store row
content in inner nodes too, which takes more room per entry, lowers the
fanout and makes searches cost more. And linked leaves make range scans,
`ORDER BY` and "next key" cheap, which a plain B-tree is bad at.

What the leaves hold depends on the database. In Postgres, a leaf entry
is a key plus the address of a row in the table's heap (see
[[heap-files]]). In InnoDB's primary key and SQLite's rowid tables, the
leaves hold the rows themselves.

In database talk "B-tree" almost always means a B+tree. Postgres calls
its index a B-tree; SQLite calls its leaves-only variant a B*-tree. The
naming has been a mess since the 1970s.

## The rules that keep it shallow

A textbook B+tree keeps three rules:

- **Perfectly balanced.** Every leaf is at the same depth.
- **Half full at least.** Every node except the root is at least half
  full.
- **k keys, k+1 children** in every inner node.

Balance is what guarantees the logarithmic cost. The half-full rule
keeps pages from going mostly empty, so the tree stays shallow and
doesn't waste space. Insert and delete are built to keep these rules.

## Inserting: split, and grow from the top

To insert a key, walk down to the leaf where it belongs and add it in
sorted order. If there's room, you're done.

If the leaf is full, split it:

1. Make a new leaf, and move the upper half of the entries into it.
2. Copy the first key of the new leaf up into the parent, with a pointer
   to the new leaf.
3. If the parent is now full too, split it the same way, except that an
   inner node pushes its middle key up instead of copying it (there are
   no values to keep at that level).

![Before and after a leaf split. Before: a parent with separators "d, g" and a full leaf holding d, e, f with no room for the new key "ea". After: the leaf is split into two leaves, "d, e" and "ea, f", linked to each other; the first key of the new right leaf, "ea", is copied up into the parent, which now holds "d, ea, g".](img/b-plus-tree-leaf-split.svg)

*A leaf split. One insert changes three pages: the old leaf, the new leaf and the parent.*

Splits can cascade all the way up. When the root itself splits, a new
root is made above it with two children. That's the only way the tree
gets taller, and it adds a level to every path at once. That's why a
B+tree never goes out of balance: it grows at the top, not at the
bottom.

Real engines bend the textbook in a few ways:

- **Split by bytes, not by count.** With variable-length keys there is
  no fixed number of keys per page. Postgres packs in as many as fit and
  splits so each half gets about the same number of bytes.
- **Leave room on purpose.** A freshly built Postgres B-tree packs
  leaves only to 90% by default (the `fillfactor` setting), so the first
  new keys don't cause an immediate split. InnoDB tries to leave 1/16
  of each clustered index page free.
- **Increasing keys are special.** If keys always arrive in order, like
  a sequence, every insert goes to the rightmost leaf. Postgres caches
  that leaf and skips the walk down. InnoDB pages fill to about 15/16
  when inserts are sequential, but only between half and 15/16 when they
  come in random order. This is the physical reason behind the advice in
  [[primary-keys]] about random UUIDs.

## Deleting: merge, or don't

Deleting follows the same path. Find the leaf and remove the entry. In
the textbook version, if the leaf drops below half full, it borrows
entries from a neighbour, and if that doesn't work, merges with it and
removes a separator from the parent. Merges can cascade up and shrink
the tree by a level.

Here production systems disagree with the textbook, and with each
other:

- **InnoDB** tries to merge a page once it drops below a merge threshold,
  50% by default.
- **Postgres** never merges partly full pages. It deletes a page only
  once it's completely empty. Moving entries into a neighbour could make
  a scan running in the opposite direction miss them, and preventing
  that isn't worth it.

Eager merging has its own problem: a workload that deletes and inserts
around the same keys can make the tree split and merge the same pages
over and over.

## Many threads in one tree

A database has many connections reading and writing the same index. Two
things can go wrong: two writers change one page at once, or a reader
walks down while a writer is splitting the page it's heading to.

The structures that protect pages here are [[latches]]: short-lived locks
on in-memory data, held for one operation. (They're not the transaction
[[explicit-locking|locks]] you see in SQL, which protect rows for a
whole transaction.)

The classic protocol is **latch crabbing**. Walking down, latch the
child, then release the parent if the child is "safe": not full, for an
insert, so a split can't reach back up. The weak spot is the root. A
naive writer latches the root exclusively on every insert, and then all
writers queue there. The common fix is optimistic: take shared latches
down to the leaf, bet that it won't split, and start over with exclusive
latches in the rare case it does.

Postgres takes another route, from Lehman and Yao's 1981 **B-link
tree**. Every page gets a pointer to its right sibling and a "high key",
the upper bound of keys allowed on it. A reader never holds a latch on
more than the one page it's reading. If it lands on a page that was
split after it read the parent, it sees that its key is above the page's
high key, and simply follows the right link to the new page. Splits
can't make a search lose its way.

![A reader looking for key 45 reads the parent, which points to page A covering keys up to 60. Before the reader gets to A, a writer splits A: A now holds keys up to 40 and a right link to new page B, which holds 41 to 60. The reader arrives at A, sees 45 is above A's high key of 40, follows the right link to B and finds 45 there.](img/b-plus-tree-blink-move-right.svg)

*A search that arrives after a split moves right. Based on the Lehman and Yao design as described in Postgres's nbtree README.*

## A split is several writes

A split changes the old page, the new page and the parent. A crash can
land between any of them. In Postgres, a split is logged in the
[[write-ahead-log]] as one record for the level that split and a second
for the insert into the parent. If the crash falls between the two, the
new page has no pointer from its parent. The right link from its left
sibling still leads there, so searches still work, and the next insert
that passes by adds the missing pointer. How the log repairs the rest is
[[crash-recovery]].

## Where it gets tricky

**The half-full rule is a textbook rule.** Real B+trees relax it both
ways: Postgres keeps partly empty pages rather than merge them, and
freshly built indexes deliberately start below full. The price is pages
that sit partly empty.

**Every change rewrites a page.** Changing one 50-byte entry means the
whole page is dirty and gets written out again, plus a log record. On
write-heavy workloads with keys scattered across the index, that adds
up; it's what [[amplification|write amplification]] measures, and what
[[lsm-tree|LSM trees]] trade reads to avoid. For a sorted structure that
lives only in memory, compare the [[skip-list]].

**Modern B+trees shrink their inner keys.** Separators only need to be
long enough to route a search. Postgres truncates unneeded trailing
columns from them to raise the fanout, an idea from Bayer and
Unterauer's prefix B-trees (1977). Postgres also stores a duplicated key
once with a list of row pointers (deduplication, on by default), and
since version 14 removes old row versions from leaves in "bottom-up"
passes.

**The name doesn't tell you the variant.** "B-tree", "B+tree" and
"B*-tree" get mixed up in docs and even in the 1970s literature. Look at
what the leaves hold and whether they're linked.

## What this means when you build

- An index lookup costs about one page per level, and the upper levels
  tend to stay cached. Depth grows with the log of the table size,
  so a table ten times bigger rarely costs a whole extra read.
- Keys that arrive in order (sequences, time-ordered ids) keep inserts
  on one hot rightmost page with full, tidy leaves. Random keys spread
  inserts, split pages everywhere and leave them half empty.
- Short keys mean more keys per page and a shallower tree. In InnoDB,
  where every secondary index stores the primary key, that counts twice.
- In Postgres, pages that deletes leave partly empty stay that way; only
  completely empty pages are removed from the tree.
- If you build one: pages as nodes, variable-length keys, split by
  bytes, right links, and log every split.

## Further reading

- [The Ubiquitous B-Tree](http://carlosproal.com/ir/papers/p121-comer.pdf), Douglas Comer, 1979. The classic survey: why page reads are the cost, B-tree vs B+-tree, and the "B*-tree" naming mess.
- [Lecture #08: Indexes & Filters I](https://15445.courses.cs.cmu.edu/fall2024/notes/08-indexes1.pdf), Andy Pavlo, CMU 15-445, 2024. The B+tree invariants, insert and delete step by step, and the design choices real systems make.
- [Lecture #10: Index Concurrency Control](https://15445.courses.cs.cmu.edu/fall2024/notes/10-indexconcurrency.pdf), Andy Pavlo, CMU 15-445, 2024. Latches vs locks and latch crabbing.
- [Efficient Locking for Concurrent Operations on B-Trees](https://www.csd.uoc.gr/~hy460/pdf/p650-lehman.pdf), Philip Lehman and S. Bing Yao, 1981. The B-link tree: one right link per node, no read locks.
- [src/backend/access/nbtree/README](https://github.com/postgres/postgres/blob/REL_18_STABLE/src/backend/access/nbtree/README), PostgreSQL 18 source. How a production B+tree implements Lehman and Yao, why it never merges pages, how splits are logged, suffix truncation.
- [B-Tree Indexes](https://www.postgresql.org/docs/current/btree.html), PostgreSQL documentation, version 18. Leaf vs inner pages, deduplication and bottom-up deletion.
- [The Physical Structure of an InnoDB Index](https://dev.mysql.com/doc/refman/8.4/en/innodb-physical-structure.html), MySQL 8.4 Reference Manual. Page fill under sequential and random inserts, and the 50% merge threshold.
- [CREATE INDEX](https://www.postgresql.org/docs/current/sql-createindex.html), PostgreSQL documentation, version 18. The B-tree fillfactor and its default of 90.
- [Clustered Indexes and the WITHOUT ROWID Optimization](https://www.sqlite.org/withoutrowid.html), SQLite developers. Why SQLite's rowid tables keep content only in the leaves, and what storing it in inner nodes costs in fanout.
- [Clustered and Secondary Indexes](https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html), MySQL 8.4 Reference Manual. Why every InnoDB secondary index carries the primary key.
- [The Search Tree (B-Tree) Makes the Index Fast](https://use-the-index-luke.com/sql/anatomy/the-tree), Markus Winand. How deep real indexes get and why.
