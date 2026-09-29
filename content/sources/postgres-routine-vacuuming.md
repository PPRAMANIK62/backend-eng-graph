---
id: postgres-routine-vacuuming
title: "PostgreSQL documentation, 24.1 Routine Vacuuming"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/routine-vacuuming.html
kind: docs
primary: true
---

## Summary

The manual's chapter on VACUUM and ANALYZE maintenance (read at version
18.6). Used here for 24.1.3, keeping planner statistics current, and the
autovacuum rule for when ANALYZE runs.

## Key claims

- One of VACUUM's jobs is refreshing statistics. "To update data statistics used by the PostgreSQL query planner." (24.1.1)
- VACUUM keeps the visibility map, which says which pages hold only rows visible to everyone, until the page changes again. "Vacuum maintains a visibility map for each table to keep track of which pages contain only tuples that are known to be visible to all active transactions (and all future transactions, until the page is again modified)." (24.1.4)
- Index-only scans rely on it. "An index-only scan, on the other hand, checks the visibility map first." (24.1.4)
- Bad statistics mean bad plans. "It is important to have reasonably accurate statistics, otherwise poor choices of plans might degrade database performance." (24.1.3)
- Autovacuum runs ANALYZE on the amount of change, not its meaning. "The daemon schedules ANALYZE strictly as a function of the number of rows inserted or updated; it has no knowledge of whether that will lead to meaningful statistical changes." (24.1.3)
- A column whose maximum keeps growing needs fresh statistics more often. "For example, a timestamp column that contains the time of row update will have a constantly-increasing maximum value as rows are added and updated; such a column will probably need more frequent statistics updates" (24.1.3)
- ANALYZE is cheap because it samples. "ANALYZE uses a statistically random sampling of the rows of a table rather than reading every single row." (24.1.3)
- The autovacuum analyze threshold. "analyze threshold = analyze base threshold + analyze scale factor * number of tuples" (24.1.6)
- Partitioned tables aren't analyzed automatically. "Unfortunately, this means that autovacuum does not run ANALYZE on partitioned tables, and this can cause suboptimal plans for queries that reference partitioned table statistics." (24.1.6)
- Nor are temporary tables. "Temporary tables cannot be accessed by autovacuum." (24.1.6)
- Partitions themselves are analyzed as usual. "(Autovacuum does process table partitions just like other tables.)" (24.1.6)
- An update or delete leaves the old row version in place. "In PostgreSQL, an UPDATE or DELETE of a row does not immediately remove the old version of the row." (24.1.2)
- It can't be removed while some transaction might still see it. "the row version must not be deleted while it is still potentially visible to other transactions." (24.1.2)
- Plain VACUUM runs alongside normal work. "Also, the standard form of VACUUM can run in parallel with production database operations." (24.1.1)
- VACUUM FULL locks the table out completely. "VACUUM FULL requires an ACCESS EXCLUSIVE lock on the table it is working on, and therefore cannot be done in parallel with other use of the table." (24.1.1)
- Plain VACUUM marks space for reuse but mostly doesn't give it back to the OS. "However, it will not return the space to the operating system, except in the special case where one or more pages at the end of a table become entirely free and an exclusive table lock can be easily obtained." (24.1.2)
- VACUUM FULL writes a new copy of the table and needs extra disk while it runs. "In contrast, VACUUM FULL actively compacts tables by writing a complete new version of the table file with no dead space." (24.1.2)
- The goal is a steady size, not the minimum. "each table occupies space equivalent to its minimum size plus however much space gets used up between vacuum runs." (24.1.2)
- XIDs are 32 bits and wrap around. "But since transaction IDs have limited size (32 bits) a cluster that runs for a long time (more than 4 billion transactions) would suffer transaction ID wraparound" (24.1.5)
- Every table needs a vacuum at least every two billion transactions. "To avoid this, it is necessary to vacuum every table in every database at least once every two billion transactions." (24.1.5)
- XIDs compare modulo 2^32, so the space is a circle. "Normal XIDs are compared using modulo-2³² arithmetic." (24.1.5)
- Freezing marks rows as old enough to be visible to everyone forever. "VACUUM will mark rows as frozen, indicating that they were inserted by a transaction that committed sufficiently far in the past that the effects of the inserting transaction are certain to be visible to all current and future transactions." (24.1.5)
- Since 9.4 freezing sets a flag bit and keeps the original xmin. "Newer versions just set a flag bit, preserving the row's original xmin for possible forensic use." (24.1.5, Note)
- The anti-wraparound autovacuum runs even when autovacuum is off. "(This will happen even if autovacuum is disabled.)" (24.1.5)
- Near the end, Postgres stops handing out XIDs. "If these warnings are ignored, the system will refuse to assign new XIDs once there are fewer than three million transactions left until wraparound:" (24.1.5)
- Then only reads can start. "In this condition any transactions already in progress can continue, but only read-only transactions can be started." (24.1.5)
- The recovery steps include ending long-running transactions and dropping old replication slots. "End long-running open transactions." (24.1.5, step 2) and "Drop any old replication slots." (24.1.5, step 3)
- Single-user mode isn't the fix any more. "it is not necessary or desirable to stop the postmaster or enter single user-mode in order to restore normal operation." (24.1.5)
- The autovacuum trigger formula. "vacuum threshold = Minimum(vacuum max threshold, vacuum base threshold + vacuum scale factor * number of tuples)" (24.1.6)
- A normal autovacuum gives way to a conflicting lock request. "If a process attempts to acquire a lock that conflicts with the SHARE UPDATE EXCLUSIVE lock held by autovacuum, lock acquisition will interrupt the autovacuum." (24.1.6)
- An anti-wraparound one doesn't. "However, if the autovacuum is running to prevent transaction ID wraparound (i.e., the autovacuum query name in the pg_stat_activity view ends with (to prevent wraparound)), the autovacuum is not automatically interrupted." (24.1.6)
- VACUUM FULL needs disk for the copy. "It also requires extra disk space for the new copy of the table, until the operation completes." (24.1.2)
- VACUUM FULL can give space back to the OS. "Although VACUUM FULL can be used to shrink a table back to its minimum size and return the disk space to the operating system, there is not much point in this if the table will just grow again in the future." (24.1.2)
- The goal of routine vacuuming. "The usual goal of routine vacuuming is to do standard VACUUMs often enough to avoid needing VACUUM FULL." (24.1.2)
- ALTER TABLE can't run during a vacuum. "you will not be able to modify the definition of a table with commands such as ALTER TABLE while it is being vacuumed." (24.1.1)
- Frequent conflicting commands can starve autovacuum. "Regularly running commands that acquire locks conflicting with a SHARE UPDATE EXCLUSIVE lock (e.g., ANALYZE) can effectively prevent autovacuums from ever completing." (24.1.6, Warning)
- Warnings start 40 million XIDs before wraparound. "the system will begin to emit warning messages like this when the database's oldest XIDs reach forty million transactions from the wraparound point:" (24.1.5)
- The launcher's schedule. "The launcher will distribute the work across time, attempting to start one worker within each database every autovacuum_naptime seconds." (24.1.6)
- Plain VACUUM cleans indexes too. "The standard form of VACUUM removes dead row versions in tables and indexes and marks the space available for future reuse." (24.1.2)
- Half the XID circle is older, half newer. "This means that for every normal XID, there are two billion XIDs that are “older” and two billion that are “newer”" (24.1.5)
- Wrapped-around rows become invisible. "all of a sudden transactions that were in the past appear to be in the future — which means their output become invisible." (24.1.5)
- Single-user mode was the old recovery path. "In earlier versions, it was sometimes necessary to stop the postmaster and VACUUM the database in a single-user mode. In typical scenarios, this is no longer necessary, and should be avoided whenever possible" (24.1.5, Note)
- Replication slots hold back XID cleanup (though not multixact cleanup). "Unlike transaction ID wraparound, replication slots do not directly hold back multixact cleanup." (24.1.5.1)

## Visuals worth redrawing

None.

## My notes

- The threshold is compared with rows inserted, updated or deleted since the last ANALYZE.
