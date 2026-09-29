---
id: postgres-continuous-archiving
title: "PostgreSQL documentation: 25.3 Continuous Archiving and Point-in-Time Recovery (PITR)"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/continuous-archiving.html
kind: docs
primary: true
---

## Summary

The PostgreSQL 18 manual's section on the third backup method: a base
backup plus every archived WAL segment since, replayed to any point in
time. Covers archive_command rules, base and incremental backups, the
recovery procedure, recovery targets and timelines.

## Key claims

- The WAL records every change and exists for crash safety; archiving it gives a third backup method. "we can combine a file-system-level backup with backup of the WAL files." (25.3)
- The base backup doesn't need to be consistent; replay fixes it. "Any internal inconsistency in the backup will be corrected by log replay (this is not significantly different from what happens during crash recovery)." (25.3)
- You can stop replay anywhere: point-in-time recovery. "it is possible to restore the database to its state at any time since your base backup was taken." (25.3)
- Feeding WAL to another machine gives a warm standby. "at any point we can bring up the second machine and it will have a nearly-current copy of the database." (25.3)
- pg_dump output can't be used with WAL replay. "Such dumps are logical and do not contain enough information to be used by WAL replay." (25.3, Note)
- Whole cluster only, and needs lots of archive storage. "As with the plain file-system-backup technique, this method can only support restoration of an entire database cluster, not a subset." (25.3)
- You need an unbroken WAL sequence back to the base backup's start; test archiving first. "you should set up and test your procedure for archiving WAL files before you take your first base backup." (25.3)
- WAL segments are normally 16MB. "The system physically divides this sequence into WAL segment files, which are normally 16MB apiece (although the segment size can be altered during initdb)." (25.3.1)
- The archive command must return zero only on success. "It is important that the archive command return zero exit status if and only if it succeeds." (25.3.1)
- Archive commands should refuse to overwrite existing files. "Archive commands and libraries should generally be designed to refuse to overwrite any pre-existing archive file." (25.3.1)
- If archiving fails, pg_wal fills; a full disk causes a PANIC shutdown. "If the file system containing pg_wal/ fills up, PostgreSQL will do a PANIC shutdown." (25.3.1)
- Archiving that falls behind increases data lost in a disaster. "If archiving falls significantly behind, this will increase the amount of data that would be lost in the event of a disaster." (25.3.1)
- Configuration files are not restored by WAL. "it will not restore changes made to configuration files (that is, postgresql.conf, pg_hba.conf and pg_ident.conf), since those are edited manually rather than through SQL operations." (25.3.1)
- Only completed segments are archived; archive_timeout bounds how old unarchived data can get, a minute or so is reasonable. "archive_timeout settings of a minute or so are usually reasonable." (25.3.1)
- Time between base backups trades archive storage against replay time. "the system will have to replay all those WAL segments, and that could take awhile if it has been a long time since the last base backup." (25.3.2)
- Keep several backup sets. "you should consider keeping several backup sets to be absolutely certain that you can recover your data." (25.3.2)
- Incremental backups hold only changed blocks and need all earlier backups plus pg_combinebackup to restore. "When restoring an incremental backup, it will be necessary to have not only the incremental backup itself but also all earlier backups that are required to supply the blocks omitted from the incremental backup." (25.3.3)
- PostgreSQL won't track which backups an incremental depends on. "Keep in mind that PostgreSQL has no built-in mechanism to figure out which backups are still needed as a basis for restoring later incremental backups." (25.3.3)
- Recovery target: a time, a named restore point, or a transaction ID; time and restore points are the usable ones. "As of this writing only the date/time and named restore point options are very usable, since there are no tools to help you identify with any accuracy which transaction ID to use." (25.3.5)
- The example: stop right before a table was dropped. "If you want to recover to some previous point in time (say, right before the junior DBA dropped your main transaction table), just specify the required stopping point." (25.3.5)
- After recovery, check the database is in the desired state before letting users in. "Inspect the contents of the database to ensure you have recovered to the desired state." (25.3.5)
- Each finished archive recovery starts a new timeline, so you can try several recovery points. "Whenever an archive recovery completes, a new timeline is created to identify the series of WAL records generated after that recovery." (25.3.6)
- (For backups.) A zero exit status means the segment is removed. "Upon getting a zero result, PostgreSQL will assume that the file has been successfully archived, and will remove or recycle it." (25.3.1)
- Refusing to overwrite protects against two servers sharing an archive. "This is an important safety feature to preserve the integrity of your archive in case of administrator error (such as sending the output of two different servers to the same archive directory)." (25.3.1)
- pg_basebackup takes base backups, and incremental ones with --incremental. "The easiest way to perform a base backup is to use the pg_basebackup tool." / "You can use pg_basebackup to take an incremental backup by specifying the --incremental option." (25.3.2, 25.3.3)

## Visuals worth redrawing

- Not a figure in the docs, but the idea draws well: a base backup on a timeline, WAL segments after it, and a recovery target line where replay stops.

## My notes

- The 25.3.5 step list starts with stopping the server and copying the old data directory aside first.
