---
id: mysql-replication-formats
title: "MySQL 8.4 Reference Manual, 19.2.1 Replication Formats"
author: Oracle Corporation
url: https://dev.mysql.com/doc/refman/8.4/en/replication-formats.html
kind: docs
primary: true
---

## Summary

How MySQL writes changes to the binary log for replicas (MySQL 8.4):
as SQL statements, as row changes, or mixed. Row-based is the default.
Opened with WebFetch because curl got an error page; quotes are as
WebFetch returned them.

## Key claims

- Statement-based: the source logs SQL statements and the replica runs them again. "When using statement-based binary logging, the source writes SQL statements to the binary log. Replication of the source to the replica works by executing the SQL statements on the replica." (19.2.1)
- Row-based: the source logs how individual rows changed. "When using row-based logging, the source writes events to the binary log that indicate how individual table rows are changed." (19.2.1)
- Row-based is the default. "Row-based logging is the default method." (19.2.1)
- Mixed: statement-based by default, switching to rows in some cases. "When using mixed-format logging, a statement-based log is used by default." (19.2.1)
- Statement-based has trouble with stored routines and triggers. "With statement-based replication, you may encounter issues with replicating stored routines or triggers. You can avoid these issues by using row-based replication instead." (19.2.1)

## Visuals worth redrawing

None.

## My notes

- The nondeterminism argument (random(), CURRENT_TIMESTAMP) is stated
  in postgres-different-replication-solutions, not here.
