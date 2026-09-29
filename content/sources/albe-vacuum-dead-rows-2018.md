---
id: albe-vacuum-dead-rows-2018
title: Four reasons why VACUUM won't remove dead rows from a table
author: Laurenz Albe (CYBERTEC)
url: https://www.cybertec-postgresql.com/en/reasons-why-vacuum-wont-remove-dead-rows/
kind: blog
primary: false
---

## Summary

A 2018 post (updated 2024) by a Postgres consultant and contributor on
why VACUUM sometimes can't remove dead rows: the xmin horizon, held back
by long-running transactions, abandoned replication slots, orphaned
prepared transactions, or standbys with hot_standby_feedback. Each comes
with the query that finds the culprit.

## Key claims

- Dead rows are left on update or delete, and unvacuumed tables bloat. "If a table doesn't get vacuumed, it will get bloated, which wastes disk space and slows down sequential table scans (and – to a smaller extent – index scans)." (intro)
- VACUUM VERBOSE shows rows it can't remove yet and the oldest xmin. "50000 dead row versions cannot be removed yet," (VACUUM (VERBOSE) output)
- A version is removable only if its deleter is older than the oldest active transaction. "A tuple is not needed if the transaction ID of the deleting transaction (as stored in the xmax system column) is older than the oldest transaction still active in the PostgreSQL database." (main text)
- That cutoff is the xmin horizon. "This value (22300 in the VACUUM output above) is called the “xmin horizon”." (main text)
- Long-running transactions are the first thing that holds it back; find them in pg_stat_activity by backend_xmin and backend_xid, end them with pg_terminate_backend. "You can use the pg_terminate_backend() function to terminate the database session that is blocking your VACUUM." (1)
- A replication slot for a lagging or dead standby holds it back too. "If replication is delayed or the standby server is down, the replication slot will prevent VACUUM from deleting old rows." (2)
- Prepared transactions survive restarts and hold it back until committed or rolled back. "It even has to survive a server restart!" (3)
- hot_standby_feedback makes the primary keep rows a standby query still needs. "Then the standby will keep the primary informed about the oldest open transaction, and VACUUM on the primary will not remove old row versions still needed on the standby." (4)

## Visuals worth redrawing

None.

## My notes

- A reader comment reply says the "oldest xmin" line in VACUUM VERBOSE
  came with PostgreSQL 10.
