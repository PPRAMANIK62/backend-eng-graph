---
id: delta-protocol
title: Delta Transaction Log Protocol
author: Delta Lake project
url: https://github.com/delta-io/delta/blob/master/PROTOCOL.md
kind: spec
primary: true
---

## Summary

The Delta Lake table format spec, read from the master branch. A table
is a directory of Parquet data files plus `_delta_log/`, a log of
numbered JSON commit files and Parquet checkpoints. Each commit file is
one atomic version; writers write data files first, then try to create
the next commit file.

## Key claims

- Goals: serializable writes and snapshot-isolated reads over files in a file system or object store. "**Snapshot Isolation for Reads** - readers can read a consistent snapshot of a Delta table, even in the face of concurrent writes." (Overview)
- All metadata sits beside the data, so no separate metastore is needed to read. "all metadata for a Delta table is stored alongside the data." (Overview, Self describing)
- Transactions use MVCC over files. "Delta's transactions are implemented using multi-version concurrency control (MVCC)." (Overview)
- Writes are two phases: write files, then commit. "First, they optimistically write out new data files or updated copies of existing ones." (Overview)
- Old files are deleted lazily by vacuum, default retention 7 days. "Data files that are no longer present in the latest version of the table can be lazily deleted by the vacuum command after a user-specified retention period (default 7 days)." (Overview)
- One serial history of numbered versions. "A table has a single serial history of atomic versions, which are named using contiguous, monotonically-increasing integers." (Delta Table Specification)
- A commit file is the unit of atomicity. "Delta files are the unit of atomicity for a table, and are named using the next available version number, zero-padded to 20 digits." (Delta Log Entries)
- Transaction ids let outside systems make writes idempotent. "The atomic recording of this information along with modifications to the table enables these external system to make their writes into a Delta table _idempotent_." (Transaction Identifiers)
- Newer feature: catalog-managed tables, where a catalog decides whether a commit succeeded. "With this feature enabled, the [catalog](#terminology-catalogs) that manages the table becomes the source of truth for whether a given commit attempt succeeded." (Catalog-managed tables)

## Visuals worth redrawing

None beyond the Delta paper's figure 2.

## My notes

- The protocol is versioned by reader/writer versions and "table
  features", not by a single spec version number.
