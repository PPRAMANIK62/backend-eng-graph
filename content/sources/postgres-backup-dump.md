---
id: postgres-backup-dump
title: "PostgreSQL documentation: 25.1 SQL Dump"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/backup-dump.html
kind: docs
primary: true
---

## Summary

The PostgreSQL 18 manual's section on logical backups with pg_dump and
pg_dumpall: what a dump is, how to restore it, what it leaves out, and
how to handle large databases.

## Key claims

- A dump is a file of SQL commands that recreates the database as it was. "The idea behind this dump method is to generate a file with SQL commands that, when fed back to the server, will recreate the database in the same state as it was at the time of the dump." (25.1)
- pg_dump is an ordinary client and can run from any host with access. "This means that you can perform this backup procedure from any remote host that has access to the database." (25.1)
- Dumps load into newer versions; file-level backups and archiving are version-specific. "pg_dump's output can generally be re-loaded into newer versions of PostgreSQL, whereas file-level backups and continuous archiving are both extremely server-version-specific." (25.1)
- A dump is a consistent snapshot as of when it started, and doesn't block normal work. "Dumps created by pg_dump are internally consistent, meaning, the dump represents a snapshot of the database at the time pg_dump began running." (25.1)
- By default psql keeps going after an error, leaving a partial restore. "Either way, you will only have a partially restored database." (25.1.1)
- A single-transaction restore is all or nothing, but one small error can roll back hours of work. "When using this mode, be aware that even a minor error can rollback a restore that has already run for many hours." (25.1.1)
- Run ANALYZE after restoring. "After restoring a backup, it is wise to run ANALYZE on each database so the query optimizer has useful statistics" (25.1.1)
- pg_dump leaves out roles and tablespaces; pg_dumpall covers them. "pg_dump dumps only a single database at a time, and it does not dump information about roles or tablespaces (because those are cluster-wide rather than per-database)." (25.1.2)
- pg_dumpall's per-database snapshots aren't synchronized. "This means that while each database will be internally consistent, the snapshots of different databases are not synchronized." (25.1.2)
- Parallel dump with -j needs the directory format. "Parallel dumps are only supported for the "directory" archive format." (25.1.3)
- The custom format compresses and lets you restore tables selectively. "This will produce dump file sizes similar to using gzip, but it has the added advantage that tables can be restored selectively." (25.1.3)
- (For backups.) The only method that crosses machine architectures. "pg_dump is also the only method that will work when transferring a database to a different machine architecture, such as going from a 32-bit to a 64-bit server." (25.1)
- Roles and tablespaces alone. "Cluster-wide data can be dumped alone using the pg_dumpall --globals-only option." (25.1.2)

## Visuals worth redrawing

None.

## My notes

- Pairs with postgres-backup-file (physical copy) and postgres-continuous-archiving (base backup plus WAL).
