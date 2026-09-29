---
id: postgres-backup-file
title: "PostgreSQL documentation: 25.2 File System Level Backup"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/backup-file.html
kind: docs
primary: true
---

## Summary

The PostgreSQL 18 manual's section on physical backups by copying the
data directory: why the server must be stopped or the copy must be an
atomic snapshot, why single tables can't be restored this way, and the
size trade-off against a dump.

## Key claims

- The server must be shut down for a plain copy to be usable. "The database server must be shut down in order to get a usable backup." (25.2, restriction 1)
- tar doesn't take an atomic snapshot. "in part because tar and similar tools do not take an atomic snapshot of the state of the file system, but also because of internal buffering within the server" (25.2, restriction 1)
- Single tables can't be restored from files, because commit status lives in pg_xact. "This will not work because the information contained in these files is not usable without the commit log files, pg_xact/*, which contain the commit status of all transactions." (25.2, restriction 2)
- A frozen filesystem snapshot works while running, and looks like a crash on restore. "when you start the database server on the backed-up data, it will think the previous server instance crashed and will replay the WAL log." (25.2)
- Snapshots across several filesystems must be simultaneous. "it might not be possible to use snapshot backup because the snapshots must be simultaneous." (25.2)
- A file backup is usually bigger than a dump, since dumps skip index contents. "Note that a file system backup will typically be larger than an SQL dump. (pg_dump does not need to dump the contents of indexes for example, just the commands to recreate them.)" (25.2)
- (For backups.) A file backup may be quicker to take. "However, taking a file system backup might be faster." (25.2)

## Visuals worth redrawing

None.

## My notes

- The crash-like restore is the same replay as crash recovery.
