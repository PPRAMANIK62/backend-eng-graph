---
id: mysql-innodb-parameters
title: "MySQL 8.4 Reference Manual, 17.14 InnoDB Startup Options and System Variables"
author: Oracle
url: https://dev.mysql.com/doc/refman/8.4/en/innodb-parameters.html
kind: docs
primary: true
---

## Summary

The reference for every InnoDB setting (MySQL 8.4). Used here only for
`innodb_flush_method`: how InnoDB opens and flushes its data files.

## Key claims

- On Unix the default flush method is O_DIRECT where supported. "On Unix-like systems, the default value is O_DIRECT if supported otherwise defaults to fsync." (innodb_flush_method)
- With O_DIRECT, InnoDB opens data files with O_DIRECT and still calls fsync. "InnoDB uses O_DIRECT (or directio() on Solaris) to open the data files, and uses fsync() to flush both the data and log files." (innodb_flush_method, O_DIRECT)
- O_DIRECT_NO_FSYNC skips fsync after each write and can lose data with a non-battery-backed device cache. "Data loss is possible if redo log files and data files reside on different storage devices, and an unexpected exit occurs before data file writes are flushed from a device cache that is not battery-backed." (innodb_flush_method, O_DIRECT_NO_FSYNC)

## Visuals worth redrawing

None.

## My notes

- Matches the point in the fsync article: O_DIRECT skips the page cache
  but not the drive's cache.
