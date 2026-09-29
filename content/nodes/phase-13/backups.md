---
id: backups
title: Backups
depth: short
phase: 13
note: >-
  Logical vs physical backups, and point-in-time recovery from the WAL.
needs: [write-ahead-log]
leads_to: [disaster-recovery, soft-deletion]
compare_with: [replication]
---

# Backups

A backup is a copy of your data, kept apart from the live system, that
you can restore from after something destroys or corrupts the original.
There are two kinds: logical backups that export the data as commands,
and physical backups that copy the database's files. Add the
[[write-ahead-log]] to a physical backup and you can restore to any
moment you like, which is how you undo a bad `DROP TABLE`.

## Logical: export the data

A logical backup writes out the data in a form the database can load
again. In PostgreSQL that's `pg_dump`, which produces a file of SQL
statements that recreate the tables and their rows.

- The dump is a consistent snapshot as of the moment it started, and it
  doesn't block normal reads and writes while it runs.
- It loads into newer PostgreSQL versions, and onto a different machine
  architecture. It's the only method that does.
- It's small: indexes aren't copied, only the commands to rebuild them.

The costs show up at restore time. By default `psql` keeps going after an error and leaves you with a
partial restore; running it as a single transaction makes it all or
nothing, but then one small error can roll back hours of loading.
`pg_dump` also leaves out cluster-wide things like roles, which need
`pg_dumpall --globals-only`. And a dump is only as fresh as the last
time you ran it.

## Physical: copy the files

A physical backup copies the database's data directory as it sits on
disk. It can be faster to take than a dump, but it's bigger, and tied
to the server version.

You can't just `tar` the directory while the server is running: `tar`
doesn't take an atomic snapshot, and the server has data in memory that
isn't on disk yet. Either stop the server, or take a frozen filesystem
snapshot. A snapshot restores like a crash: the server starts, sees an
unclean shutdown and replays its log, the same as [[crash-recovery]].
And you can't restore one table from these files, because commit status
for every transaction lives in separate files (`pg_xact`). It's the
whole cluster or nothing.

## Point-in-time recovery: a physical backup plus the log

The WAL already records every change for crash safety. If you keep
every WAL segment the server produces, instead of letting it recycle
them, you get a third method:

1. Take a **base backup**, a physical copy made while the server runs
   (`pg_basebackup`). It doesn't even need to be consistent, because
   replaying the log fixes it up.
2. **Archive WAL continuously.** Each finished segment, normally 16 MB,
   is handed to an `archive_command` that copies it somewhere safe.
3. To restore, put the base backup back and **replay archived WAL**,
   stopping wherever you choose: a timestamp, a named restore point, or
   a transaction ID.

![Timeline of point-in-time recovery. A base backup is taken at the left. WAL segments are archived continuously after it. A DROP TABLE happens at a moment marked in red. Recovery restores the base backup and replays archived WAL up to a recovery target just before the DROP TABLE, then starts a new timeline, leaving the original history's later WAL untouched in the archive.](img/backups-point-in-time-recovery.svg)

*Point-in-time recovery: a base backup, the archived WAL after it, and a recovery target set just before the mistake.*

The payoff is point-in-time recovery. Someone drops the orders table at
17:15 and you notice at noon the next day: restore the base backup,
replay WAL up to 17:14, and the table is back. Each finished recovery
starts a new **timeline**, a separate branch of WAL history, so the
original history stays in the archive and you can try again with a
different target if 17:14 was the wrong choice.

## Where it gets tricky

**Your archive command has to be honest.** PostgreSQL deletes a WAL
segment once the command returns zero, so it must return zero only when
the copy really succeeded. It should also refuse to overwrite an
existing file in the archive, so two servers pointed at one archive
can't clobber each other.

**A stuck archive fills the disk.** If archiving keeps failing,
unarchived segments pile up in `pg_wal/`. If that filesystem fills, the
server does a PANIC shutdown. Committed data is safe, but the database
is down until you free space. Archiving that falls behind also means
more data lost if disaster strikes then.

**Quiet servers archive late.** Only full segments are archived.
`archive_timeout` forces a switch; about a minute is usually reasonable.

**Configuration isn't in the WAL.** `postgresql.conf` and `pg_hba.conf`
are edited by hand, so WAL replay won't bring them back. Back them up
separately.

**Incremental backups need their whole chain.**
`pg_basebackup --incremental` copies only changed blocks, but restoring
needs the full backup and every incremental after it, combined with
`pg_combinebackup`. PostgreSQL doesn't track that chain for you.

**Replicas are not backups.** A replica copies a `DELETE` as faithfully
as an `INSERT`. See [[replication]], and the comparison in
[[disaster-recovery]]. For bad deletes, [[soft-deletion]] is a faster
first line of defense than any restore.

## What this means when you build

- For anything that matters, use a base backup plus WAL archiving, and
  keep several base backups, not one.
- Set up and test WAL archiving before your first base backup; a
  restore needs an unbroken WAL sequence from the backup onward.
- Take logical dumps too, for moving between versions and restoring a
  single table.
- Monitor the archiver, and alert when it fails or falls behind.
- Space base backups by how long a replay you can accept.
- A backup is only proven by restoring it; that's the job of
  [[disaster-recovery]] drills.

## Further reading

- [25.3 Continuous Archiving and Point-in-Time Recovery (PITR)](https://www.postgresql.org/docs/current/continuous-archiving.html), PostgreSQL 18 manual. Base backups, WAL archiving rules, incremental backups, recovery targets and timelines.
- [25.1 SQL Dump](https://www.postgresql.org/docs/current/backup-dump.html), PostgreSQL 18 manual. What `pg_dump` and `pg_dumpall` capture, and how restores can go partly wrong.
- [25.2 File System Level Backup](https://www.postgresql.org/docs/current/backup-file.html), PostgreSQL 18 manual. Why a plain file copy needs a stopped server or an atomic snapshot.
