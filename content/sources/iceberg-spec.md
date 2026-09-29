---
id: iceberg-spec
title: Iceberg Table Spec
author: Apache Iceberg project
url: https://iceberg.apache.org/spec/
kind: spec
primary: true
---

## Summary

The Apache Iceberg table format specification (format versions 1 to 3
adopted, 4 in development; read alongside Iceberg Java 1.11.0 docs). A
table is a tree of metadata: a table metadata file points to snapshots,
each snapshot to a manifest list, each manifest list to manifests,
each manifest to data files. A commit writes a new metadata file and
swaps a pointer to it atomically; writers use optimistic concurrency
and retry.

## Key claims

- What it's for. "This is a specification for the Iceberg table format that is designed to manage a large, slow-changing collection of files in a distributed file system or key-value store as a table." (Iceberg Table Spec)
- Format versions: 1, 2 and 3 are adopted; 4 is not yet. "Versions 1, 2 and 3 of the Iceberg spec are complete and adopted by the community." (Format Versioning)
- Version 4 is still in development. "Version 4 is under active development and has not been formally adopted." (Format Versioning)
- Version 3 adds deletion vectors: a bitmap of deleted row positions per data file. "Deletion vectors identify deleted rows of a file by encoding deleted positions in a bitmap." (Deletion Vectors)
- Version 2 added row-level deletes without rewriting data files. "This version can be used to delete or replace individual rows in immutable data files without rewriting the files." (Version 2)
- Goal: serializable isolation, no partial writes, no reader locks. "Writes will support removing and adding files in a single operation and are never partially visible. Readers will not acquire locks." (Goals)
- Goal: planning a scan takes a constant number of remote calls. "Operations will use O(1) remote calls to plan the files for a scan and not O(n) where n grows with the size of the table, like the number of partitions or files." (Goals)
- Tracks files, not directories. "This table format tracks individual data files in a table instead of directories." (Overview)
- Every change makes a new metadata file and swaps it in atomically. "All changes to table state create a new metadata file and replace the old metadata with an atomic swap." (Overview)
- The metadata file holds schema, partitioning, properties and snapshots. "The table metadata file tracks the table schema, partitioning config, custom properties, and snapshots of the table contents." (Overview)
- Data files are Parquet, Avro or ORC. "Version 1 of the Iceberg spec defines how to manage large analytic tables using immutable file formats: Parquet, Avro, and ORC." (Version 1)
- Snapshot = state at a point in time. "A snapshot represents the state of a table at some time and is used to access the complete set of data files in the table." (Overview)
- Manifests list data files with partition data and metrics, and are reused across snapshots. "Manifest files are reused across snapshots to avoid rewriting metadata that is slow-changing." (Overview)
- A manifest list per snapshot, with stats to skip manifests. "The manifests that make up a snapshot are stored in a manifest list file." (Overview)
- Readers stick to the snapshot they loaded. "Readers use the snapshot that was current when they load the table metadata and are not affected by changes until they refresh and pick up a new metadata location." (Optimistic Concurrency)
- Writers retry if their base is no longer current. "If the snapshot on which an update is based is no longer current, the writer must retry the update based on the new current version." (Optimistic Concurrency)
- Of two commits on the same base, only one wins. "When two commits happen at the same time and are based on the same version, only one commit will succeed." (Commit Conflict Resolution and Retry)
- Appends can always be retried; replaces must check their files are still there. "Append operations have no requirements and can always be applied." (Commit Conflict Resolution and Retry)
- Replaces (like compaction) must check their files are still there. "Replace operations must verify that the files that will be deleted are still in the table." (Commit Conflict Resolution and Retry)
- Schema changes must check the schema didn't change. "Table schema updates and partition spec changes must validate that the schema has not changed between the base version and the current version." (Commit Conflict Resolution and Retry)
- Storage needs only in-place writes, seekable reads and deletes; this fits object stores. "These requirements are compatible with object stores, like S3." (File System Operations)
- Files are never changed after they're written. "Once written, data and metadata files are immutable until they are deleted." (File System Operations)
- The rename-based commit for file system tables is deprecated. "The scheme is unsafe in object stores and local file systems." (File System Tables, note)
- Metastore tables commit by check-and-put on a pointer. "The atomic swap needed to commit new versions of table metadata can be implemented by storing a pointer in a metastore or database that is updated with a check-and-put operation" (Metastore Tables)
- A manifest has a row per data file with its partition data and metrics. "Data files in snapshots are tracked by one or more manifest files that contain a row for each data file in the table, the file's partition data, and its metrics." (Overview)
- The manifest list keeps stats per manifest so readers can skip manifests. "Each manifest list stores metadata about manifests, including partition stats and data file counts. These stats are used to avoid reading manifests that are not required for an operation." (Overview)

## Visuals worth redrawing

- The metadata tree: catalog pointer -> metadata file -> snapshots ->
  manifest list -> manifests -> data files (the spec's overview figure).

## My notes

- The spec doesn't say which catalog to use; that's the catalog docs
  and the REST catalog protocol, not opened.
