---
id: mysql-storage-engines
title: "MySQL 8.4 Reference Manual, Chapter 18 Alternative Storage Engines"
author: Oracle
url: https://dev.mysql.com/doc/refman/8.4/en/storage-engines.html
kind: docs
primary: true
---

## Summary

MySQL's chapter on its pluggable storage engines (8.4): what a storage
engine is in MySQL, InnoDB as the default, and the others (MyISAM,
MEMORY, CSV, ARCHIVE and more).

## Key claims

- Storage engines handle the SQL operations for different table types. "Storage engines are MySQL components that handle the SQL operations for different table types." (intro)
- InnoDB is the default and general-purpose engine. "InnoDB is the default and most general-purpose storage engine, and Oracle recommends using it for tables except for specialized use cases." (intro)
- Engines are pluggable into a running server. "MySQL Server uses a pluggable storage engine architecture that enables storage engines to be loaded into and unloaded from a running MySQL server." (intro)
- InnoDB stores user data in clustered indexes. "InnoDB stores user data in clustered indexes to reduce I/O for common queries based on primary keys." (MySQL 8.4 Supported Storage Engines)
- MyISAM uses table-level locking, which limits read/write workloads. "Table-level locking limits the performance in read/write workloads, so it is often used in read-only or read-mostly workloads in Web and data warehousing configurations." (same)
- You pick the engine per table, not per server. "You can specify the storage engine for any table." (intro, after the engine list)

## Visuals worth redrawing

None.

## My notes

- Good concrete example that "storage engine" is a swappable layer under
  the same SQL.
