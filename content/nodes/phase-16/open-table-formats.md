---
id: open-table-formats
title: Open table formats
depth: deep
phase: 16
note: >-
  Iceberg and Delta: tables made of Parquet files on object storage,
  with snapshots and atomic commits through a catalog or put-if-absent.
  What a lakehouse is built on.
needs: [parquet, object-storage]
leads_to: []
compare_with: [data-warehouse, transactional-sinks, write-ahead-log, mvcc]
---

# Open table formats

An open table format turns a pile of [[parquet|Parquet]] files in an
[[object-storage|object store]] into a table that several engines can
read and change safely. Metadata files, stored next to the data, list
exactly which files make up each version of the table, and a commit
swaps one pointer from the old version to the new one. Apache Iceberg
and Delta Lake are the two you'll meet most (Apache Hudi is a third).
They're what a "lakehouse" is built on.

## Why a directory of Parquet files isn't a table

Start with the simple way. You keep an `events` table in a bucket as
Parquet files, one "directory" (really a key prefix) per day:
`events/day=1/…`, `events/day=2/…`. To query it, an engine lists the
prefix and reads every file it finds. This is how Hive laid out tables
on HDFS, and plenty of data lakes still work this way.

It breaks as soon as the table changes while people read it:

- **No atomicity across files.** Deleting one user's rows means
  rewriting every file that holds them. A reader running at the same
  time sees some files rewritten and some not. If the job crashes
  halfway, the table stays half-changed.
- **Listing is slow.** An object store lists at most 1,000 keys per
  call, at tens to hundreds of milliseconds a call. A table with
  millions of files takes minutes just to find.
- **Statistics cost a request per file.** Parquet keeps min and max
  values per column in each file's footer, so an engine could skip
  files that can't match. But reading every footer on an object store
  can take longer than the query.

In the first few years of Databricks' cloud service (2014 to 2016),
about half of its support escalations came from exactly these
problems: corrupt data after crashed update jobs, inconsistency, and
slow queries over tens of thousands of objects.

## Track files, not directories

The fix every table format uses is the same: stop treating "whatever is
under this prefix" as the table. Instead, keep an explicit list of the
data files in each version, with statistics for each file, and store
that list as files in the same bucket.

Iceberg arranges it as a tree:

![Iceberg's metadata tree. A catalog holds a pointer for the table events. Before a commit it points at v1.metadata.json (dashed, old); the commit swaps it to v2.metadata.json with one check-and-put. v2 lists snapshots 1 and 2. Snapshot 1's manifest list points at manifest A; snapshot 2's manifest list points at manifest A and a new manifest B. Manifest A lists data files 1 and 2; manifest B lists the new file 3. Notes: v1 stays readable until expired, and manifest A is reused rather than rewritten.](img/open-table-formats-metadata-tree.svg)

*A commit adds files at the bottom and swaps one pointer at the top. Adapted from the Apache Iceberg project, "Iceberg Table Spec", Overview.*

- A **table metadata file** holds the schema, the partitioning, and
  the list of snapshots.
- A **snapshot** is the table at one point in time. Each has a
  **manifest list**, with summary stats per manifest so a query can skip
  whole manifests.
- A **manifest** lists data files, each with its partition values and
  per-column metrics.
- **Data files** are Parquet (or ORC or Avro), and are never changed
  after they're written.

Manifests are reused across snapshots, so a commit that adds one file
writes one new manifest, not a copy of the whole list. One of Iceberg's
design goals follows from this: planning a scan takes a fixed number of
remote calls, not a number that grows with the partitions or files.

Delta Lake keeps the same information as a log. Next to the data sits
`_delta_log/`, holding numbered JSON files, one per commit, zero-padded
to 20 digits so they sort in order when listed. Each commit file is a
set of actions: add this file (with its stats), remove that one, change
the schema. The table at version N is what you get by replaying commits
0 to N. To keep replay short, writers also save a Parquet
**checkpoint** of the whole state now and then, by default every 10
commits in the Delta paper's implementation. A reader starts from the
latest checkpoint and lists only the commit files after it.

Either way, it's the idea behind a database's
[[write-ahead-log|write-ahead log]], moved into the object store: the
data can be written in any order, and the metadata decides what counts.

## A commit is one atomic step

A write happens in two phases.

1. **Write the data.** The writer writes new Parquet files under fresh
   random names (Delta uses GUIDs). Nobody sees them yet, because no
   metadata mentions them.
2. **Commit.** The writer creates the new metadata that adds those
   files (and removes any it replaced), then makes it the current
   version in one atomic step.

That one step has to be "only one writer wins". Iceberg does it with a
**catalog**: a service or database that holds each table's pointer to
its current metadata file, and swaps it with a check-and-put that fails
if the pointer moved since you read it. Delta does it by creating the
next commit file, say `…0004.json`, only if it doesn't exist yet.

Both need the storage or catalog to offer a real put-if-absent or
compare-and-swap. When the Delta paper was written (2020), Google Cloud
Storage and Azure Blob Storage had put-if-absent and S3 didn't, so
Databricks ran a separate coordination service for commits to S3. S3
now supports `If-None-Match: *`, which is exactly put-if-absent (see
[[conditional-requests]]). The older trick, committing by renaming a
temporary file to the next version's name, is deprecated in the Iceberg
spec as unsafe on object stores and local file systems.

This is [[optimistic-concurrency]]. A writer assumes nobody else will
commit first. If someone did, its swap fails and it retries on top of
the new version. Whether a retry is allowed depends on what the write
did. An append can always be replayed on the new version. A compaction
that replaced files 1 and 2 with one bigger file can only retry if
files 1 and 2 are still in the table. A schema change retries only if
the schema didn't change in between.

## What snapshots give you

Because every version is a complete, immutable list of files, you get
the features of a database's [[mvcc|multi-version concurrency control]]
over plain files:

- **Readers never block and never see half a write.** A reader loads
  the current metadata once and reads that snapshot until it refreshes,
  whatever commits happen meanwhile. Readers take no locks. Delta's
  write transactions are serializable, in log order, and its reads get
  [[snapshot-isolation]].
- **Time travel and rollback.** Old snapshots stay readable until you
  expire them, so you can query yesterday's table or undo a bad job.
- **Fast planning.** Per-file statistics live in the metadata, so an
  engine can pick the files a query needs without listing or opening
  them.
- **Row-level changes.** Iceberg format version 2 added delete files,
  which mark rows as deleted without rewriting the data file. Version 3
  added deletion vectors, a bitmap of deleted row positions per file.
- **[[exactly-once-processing|Exactly-once]] output from streams.** Delta lets a writer store its
  own ID and progress (say, the input offset) inside the same commit as
  its data. After a crash it reads back what it last committed and
  carries on without duplicates. That's the idea behind
  [[transactional-sinks]].

## Where the lakehouse comes in

"Lakehouse" is Databricks' name for the design this enables. The
common setup it argues against has two tiers: a data lake of open files
on cheap storage, and a separate [[data-warehouse]] loaded from it.
Data gets loaded into the lake and then again into the warehouse (see
[[etl-vs-elt]]), which
adds delay, cost and failure modes, and leaves the warehouse stale. A
lakehouse keeps one copy, in open formats like Parquet, with a table
format for transactions and a fast query engine on top, so SQL and
machine learning read the same files. It's an argument from the
company that sells one, and whether it replaces warehouses is still an
open question, but the table formats underneath are real and widely
used.

## Where it gets tricky

**Nothing cleans up by itself.** Every commit makes a snapshot, and
snapshots pile up until you expire them. Data files are deleted only
when no remaining snapshot needs them, so storage grows until you do.
Failed jobs leave orphan files that no metadata points to; you remove
them with a separate job. Delta's `vacuum` deletes unreferenced files
after a retention period, 7 days by default.

**Deleting orphans too eagerly corrupts the table.** A file written a
minute ago by a running job looks exactly like an orphan, because its
commit hasn't happened yet. Deleting orphans with a retention shorter
than your longest write can delete files that are about to be
committed.

**Small files.** Streaming jobs commit often, and each commit adds
small files and another metadata file. Many small files mean more
metadata and more file-open cost per query, so tables need regular
compaction into bigger files, the same job an [[lsm-tree|LSM tree]]'s
[[compaction]] does.

**Commits are slow, and only per table.** Each commit is a write to
the object store (or catalog) that can take tens to hundreds of
milliseconds. The Delta paper puts the result at several transactions
per second per table, and its transactions cover one table only.
Many writers committing to one table at once will spend time retrying.

**The formats are still moving.** Iceberg format versions 1 to 3 are
adopted and version 4 is in development. Delta has added catalog-managed
tables, where a catalog, not the file system, decides whether a commit
succeeded. Iceberg, Delta and Hudi share the core design and differ in the details, so check which
version and features every engine that touches your table supports.

## What this means when you build

- If more than one job writes a table, or you ever update or delete
  rows, use a table format instead of a bare directory of Parquet.
- Keep the two phases apart: write data files first, commit once at
  the end, and retry the commit on conflict.
- Make sure the commit step really is atomic on your storage:
  a catalog, or put-if-absent on the object store.
- Schedule maintenance from day one: expire snapshots, compact small
  files, remove orphans with a safe retention.
- For a stream job writing to a table, put the job's progress in the
  same commit as its data. That's how the output stays exactly-once.

## Further reading

- [Iceberg Table Spec](https://iceberg.apache.org/spec/), Apache Iceberg project. The metadata tree, snapshots, optimistic commits and the conflict rules, in the format's own words.
- [Maintenance](https://iceberg.apache.org/docs/latest/maintenance/), Apache Iceberg project. Expiring snapshots, orphan files and compaction, and the orphan-file warning.
- [Delta Transaction Log Protocol](https://github.com/delta-io/delta/blob/master/PROTOCOL.md), Delta Lake project. The log format, versions, vacuum retention and catalog-managed tables.
- [Delta Lake: High-Performance ACID Table Storage over Cloud Object Stores](https://www.vldb.org/pvldb/vol13/p3411-armbrust.pdf), Michael Armbrust and others, VLDB 2020. Why directories of files fail on object stores, and the log and commit protocol that fixes it.
- [Lakehouse: A New Generation of Open Platforms that Unify Data Warehousing and Advanced Analytics](https://www.cidrdb.org/cidr2021/papers/cidr2021_paper17.pdf), Michael Armbrust, Ali Ghodsi, Reynold Xin, Matei Zaharia, CIDR 2021. The case for the lakehouse, from Databricks.
- [How to prevent object overwrites with conditional writes](https://docs.aws.amazon.com/AmazonS3/latest/userguide/conditional-writes.html), Amazon Web Services. S3's put-if-absent, which a commit on S3 can now rely on.
