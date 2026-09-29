---
id: iceberg-maintenance
title: Maintenance (Apache Iceberg docs)
author: Apache Iceberg project
url: https://iceberg.apache.org/docs/latest/maintenance/
kind: docs
primary: true
---

## Summary

The Iceberg Java docs (1.11.0) page on the chores an Iceberg table
needs: expiring snapshots, removing old metadata files, deleting orphan
files, compacting small data files and rewriting manifests.

## Key claims

- Every write makes a snapshot, usable for time travel or rollback. "Each write to an Iceberg table creates a new snapshot , or version, of a table." (Expire Snapshots)
- Snapshots pile up until expired. "Snapshots accumulate until they are expired by the expireSnapshots operation." (Expire Snapshots)
- Data files stay until no snapshot needs them. "Data files are not deleted until they are no longer referenced by a snapshot that may be used for time travel or rollback." (Expire Snapshots, Info)
- Failed jobs leave orphan files. "In Spark and other distributed processing engines, task or job failures can leave files that are not referenced by table metadata" (Delete orphan files)
- Deleting orphans with too short a retention can corrupt the table. "It is dangerous to remove orphan files with a retention interval shorter than the time expected for any write to complete because it might corrupt the table if in-progress files are considered orphaned and are deleted." (Delete orphan files, Info)
- Streaming writes make small files that need compacting. "For example, streaming queries may produce small data files that should be compacted into larger files ." (Optional maintenance)
- Small files cost metadata and file-open time. "small data files causes an unnecessary amount of metadata and less efficient queries from file open costs." (Compact data files)
- Frequent commits pile up metadata files too. "Tables with frequent commits, like those written by streaming jobs, may need to regularly clean metadata files." (Remove old metadata files)

## Visuals worth redrawing

None.

## My notes

- The example code on the page contains a calendar date; don't copy it.
