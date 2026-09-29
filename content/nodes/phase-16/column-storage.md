---
id: column-storage
title: Column storage
depth: deep
phase: 16
note: >-
  Storing each column together so scans read only what they need and
  compress well.
needs: [oltp-vs-olap, block-compression]
leads_to: [vectorized-execution, parquet]
compare_with: [data-models, lsm-tree]
---

# Column storage

A column store keeps all the values of one column together, instead of
keeping each row together. A query that needs three columns out of
fifty reads only those three, and values from the same column sit side
by side, so they compress very well. It's the layout under almost
every analytical database, and it explains both why they scan so fast
and why they're slow at the things row stores do well.

## Same table, two layouts

Take a `sales` table with an id, a product, a region and a price, and
the query `SELECT SUM(price) FROM sales WHERE region = 'EU'`. It's the
analytical kind of query from [[oltp-vs-olap]]: every row, two
columns.

A row store puts row 1's values, then row 2's, and so on, into each
[[database-pages|page]]. The disk hands back whole pages, so the query reads every value
of every row to use two columns out of four. With a hundred columns
and a query that uses three, nearly everything it reads is waste.

A column store keeps the ids in one place, the products in another,
the regions in a third and the prices in a fourth. The query reads the
region and price columns and nothing else.

![The same four-row sales table stored two ways. As a row store, one page holds id, product, region and price for row 1, then row 2, and so on; the query needs only the region and price cells but the whole page is read. As a column store, each column is its own strip; only the region and price strips are read, the id and product strips are not.](img/column-storage-layouts.svg)

*One query against both layouts. Adapted from Daniel Abadi et al., "The Design and Implementation of Modern Column-Oriented Database Systems", figure 1.1 (2013).*

The rows haven't gone anywhere. Value 1 of every column belongs to row
1, value 2 to row 2, and so on. Modern column stores use that position
as the row id and don't store an id at all. When values are
fixed-width, finding row *i* in a column is arithmetic: the column's
start plus *i* times the width.

That detail matters more than it looks. The obvious way to fake a
column store inside a row store is to split the table into one small
table per column, each carrying the row's id. When Abadi, Madden and
Hachem tried that on a commercial row store (a 2008 study, 60-million-row
fact table), every row of every small table carried about 8 bytes of
row header and about 4 bytes of id next to its 4-byte value. One
integer column took 0.7 to 1.1 GB that way, against 240 MB in the
C-Store column store. Scanning four of those columns cost as much as
scanning the whole original table.

## Why columns compress so well

Values from one column look alike. A region column holds a handful of
distinct strings; a timestamp column holds numbers close to each
other. Compression works best on data like that, and in a row store
every value sits between values of other columns and other types.
The general trade of CPU time for fewer bytes is
[[block-compression]]. Column stores add light encodings that fit one
column's data:

![Three encodings. Run-length encoding turns the sorted column EU, EU, EU, EU, US, US, APAC into EU times 4, US times 2, APAC times 1. Dictionary encoding turns mug, lamp, mug, desk, mug, lamp into codes 0, 1, 0, 2, 0, 1 with a dictionary 0 = mug, 1 = lamp, 2 = desk. Frame of reference turns 1003, 1001, 1007, 1006, 1004 into a base of 1000 followed by 3, 1, 7, 6, 4.](img/column-storage-encodings.svg)

*Three light encodings that only work well when a column's values sit together. The frame-of-reference example is from Abadi et al. (2013), section 4.2.4.*

- **Run-length encoding** stores a run of repeated values once, with
  its length. It shines on sorted columns.
- **Dictionary encoding** swaps each value for a small integer code
  and keeps the lookup table once. A filter on a string can then
  compare integers, which is faster.
- **Frame of reference** stores a base value and a small offset per
  value, for numbers that sit close together.
- **Bit packing** stores each value in as few bits as it needs. A US
  state fits in 6 bits, where a two-letter code takes 16.

Saving disk space is the smaller gain. The bigger one is time: fewer
bytes means less time moving data from disk to memory and from memory
to the CPU, and that's where scans spend their time. You're trading CPU cycles, which are
plentiful, for disk bandwidth, which isn't. Good
engines go one step further and work on the compressed form directly:
a filter over a run-length encoded column can test a run once instead
of every value in it.

## Sort order is a design choice

A column compresses best when it's sorted, because sorted data has
long runs. But a table has one row order, and every column follows
it. C-Store's answer was to store the same columns more than once,
each copy sorted differently (it called them projections), and pick
the copy that suits each query.

ClickHouse sorts the rows of each chunk of a table by the table's
[[primary-keys|primary key]]. It then keeps a small sparse index: the key of the first
row in every block of 8,192 rows. That index is tiny (1,000 entries
cover 8.1 million rows), fits in memory, and lets a query skip every
block whose key range can't match. Pick the sort key well and most of
the data is never read.

## Putting rows back together, as late as possible

A query that filters on region and sums price has to line the two
columns up at some point. A naive column store rebuilds whole rows
first and then runs an ordinary row-by-row plan, which throws much of
the advantage away. Better engines filter the region column on its
own, keep the list of positions that matched, and fetch prices only at
those positions. That's called late materialization.

The 2008 study took C-Store's tricks away one at a time to see where
the speed came from. Compression gave up to an order of magnitude
where the data suited it. Late materialization gave about a factor of
3 across the board. Passing blocks of values between operators,
instead of one row at a time, and a join trick gave about 1.5 on
average. Column layout alone, without compression and late
materialization, didn't beat a well-tuned row store by much. A column
store is a layout plus an executor built for it; the executor side is
[[vectorized-execution]].

## Writes are the hard part

What makes scans fast makes writes slow. One new row means one write
per column instead of one write. If a column is compressed, the block
has to be decompressed, changed and compressed again. If it's sorted,
the new value belongs somewhere in the middle.

So column stores don't write new rows straight into their main
storage:

- **C-Store** put new rows in a small write-optimized store. A
  background tuple mover shifted them into the compressed column store
  in batches, and queries read both and merged the results. MonetDB
  and VectorWise keep recent changes in separate structures in a
  similar way.
- **ClickHouse** writes each insert as a new, immutable, sorted part
  with one file per column. Background merges combine small parts into
  bigger ones, much like [[compaction]] in an [[lsm-tree]]. Its
  developers ask clients to insert in bulk, around 20,000 rows at a
  time, or to use a mode that buffers small inserts on the server.
  Deleting rows the thorough way rewrites every column of every part.
  The lighter way marks rows in a hidden bitmap column, makes every
  later query filter them out, and leaves the real removal to a future
  merge.

## Where it gets tricky

**You can't get this by indexing a row store.** It's tempting to think
a row store with one table per column, or an index on every column,
does the same job. The 2008 study tried both, plus a materialized view
for every query, which is the best case for a row store. C-Store was
still about six times faster than the plain row store, and three times
faster than the one with materialized views. The gap came from row
headers, stored ids, and an executor that works one row at a time.

**"Wide-column" is not columnar.** Cassandra, HBase and Bigtable are
called wide-column stores, which sounds like column storage. They're
row stores underneath, not columnar engines.

**Real formats slice the table first.** Most systems don't keep one
file per column for the whole table. They cut the table into
horizontal chunks of rows and store each chunk column by column: ClickHouse's parts, and the row groups of a
[[parquet]] file. You still read only the columns you need, one chunk
at a time, and each chunk can carry min and max values that let a
query skip it.

**One whole row is expensive.** Reading a full record means one read
per column, where a row store needs one. A column store is the wrong
place for "fetch order 1042".

## What this means when you build

- Use a column store for scans and aggregates over many rows, and a
  row store for lookups and single-row writes.
- Select only the columns you need. `SELECT *` on a column store reads
  every column and gives away its main advantage.
- Load in batches of thousands of rows, not one row per insert.
- Choose the sort key for the filters you run most. It decides both how
  well columns compress and how much data a query can skip.
- Treat updates and deletes as rare and slow, often finished later in
  the background. Model analytical data as append-only where you can.

## Further reading

- [Column-Stores vs. Row-Stores: How Different Are They Really?](https://www.cs.umd.edu/~abadi/papers/abadi-sigmod08.pdf), Daniel Abadi, Samuel Madden and Nabil Hachem, 2008. Why a row store can't fake a column store, and which column-store techniques matter most.
- [The Design and Implementation of Modern Column-Oriented Database Systems](https://www.cs.umd.edu/~abadi/papers/abadi-column-stores.pdf), Daniel Abadi et al., 2013. The survey: virtual ids, encodings, late materialization, and how column stores handle updates.
- [C-Store: A Column-oriented DBMS](https://www.vldb.org/archives/website/2005/program/paper/thu/p553-stonebraker.pdf), Mike Stonebraker et al., 2005. Trading CPU for disk bandwidth, projections in several sort orders, and the write store plus read store design.
- [ClickHouse - Lightning Fast Analytics for Everyone](https://www.vldb.org/pvldb/vol17/p3731-schulze.pdf), Robert Schulze et al., 2024. A current column store: immutable sorted parts, granules and sparse indexes, and how it deletes.
- [What is OLAP?](https://clickhouse.com/docs/concepts/olap), ClickHouse. Why wide-column stores aren't columnar, among other definitions.
- [Apache Parquet format specification](https://github.com/apache/parquet-format), Apache Parquet contributors. Row groups and column chunks: the sliced layout in a file format.
