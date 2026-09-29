---
id: mysql-innodb-multi-versioning
title: "MySQL 8.4 Reference Manual, 17.3 InnoDB Multi-Versioning"
author: Oracle Corporation
url: https://dev.mysql.com/doc/refman/8.4/en/innodb-multi-versioning.html
kind: docs
primary: true
---

## Summary

How InnoDB (MySQL 8.4) keeps old row versions: the current row lives in
the clustered index and is updated in place, and the before-images go to
undo logs in a rollback segment. Also how deleted rows get purged, and
how secondary indexes are handled. dev.mysql.com refused curl ("Technical
Difficulties" page); read via the Internet Archive copy of the same URL.

## Key claims

- Old versions live in undo tablespaces, in a rollback segment. "This information is stored in undo tablespaces in a data structure called a rollback segment." (17.3)
- The rollback segment serves both rollback and consistent reads. "It also uses the information to build earlier versions of a row for a consistent read." (17.3)
- Each row has a 6-byte transaction id of the last writer; a delete is an update with a deleted bit. "A 6-byte DB_TRX_ID field indicates the transaction identifier for the last transaction that inserted or updated the row." (17.3)
- Each row has a 7-byte roll pointer to its undo record. "The roll pointer points to an undo log record written to the rollback segment." (17.3)
- Update undo can only be discarded when no snapshot might need it. "Update undo logs are used also in consistent reads, but they can be discarded only after there is no transaction present for which InnoDB has assigned a snapshot that in a consistent read could require the information in the update undo log to build an earlier version of a database row." (17.3)
- Commit regularly, even read-only transactions, or the rollback segment grows. "It is recommend that you commit transactions regularly, including transactions that issue only consistent reads." (17.3)
- Otherwise the undo tablespace can fill. "Otherwise, InnoDB cannot discard data from the update undo logs, and the rollback segment may grow too big, filling up the undo tablespace in which it resides." (17.3)
- Undo records are usually smaller than the row. "The physical size of an undo log record in the rollback segment is typically smaller than the corresponding inserted or updated row." (17.3)
- Deleted rows are removed later, by purge. "This removal operation is called a purge, and it is quite fast, usually taking the same order of time as the SQL statement that did the deletion." (17.3)
- Clustered index records are updated in place; secondary index records aren't. "Records in a clustered index are updated in-place, and their hidden system columns point undo log entries from which earlier versions of records can be reconstructed." (17.3, Multi-Versioning and Secondary Indexes)
- An updated secondary index column means delete-mark old, insert new, purge later. "When a secondary index column is updated, old secondary index records are delete-marked, new records are inserted, and delete-marked records are eventually purged." (17.3, Multi-Versioning and Secondary Indexes)

## Visuals worth redrawing

None.

## My notes

- Compare postgres-page-layout (t_xmin, t_xmax in every heap row) and
  wu-mvcc-evaluation-2017 (delta storage).
