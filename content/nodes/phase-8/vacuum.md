---
id: vacuum
title: VACUUM
depth: short
phase: 8
note: >-
  Cleaning up dead row versions: Postgres's VACUUM, table bloat and
  transaction ID wraparound, vs purging an undo log.
needs: [mvcc]
leads_to: [long-running-transactions]
compare_with: [compaction]
---

# VACUUM

`VACUUM` is Postgres's garbage collector for row versions. Every
`UPDATE` and `DELETE` leaves an old version behind in the table, and
something has to clear those out once nobody can see them, or the table
grows without limit. VACUUM also has a second, less obvious job: it
keeps Postgres's 32-bit transaction IDs from wrapping around, which
would otherwise make old data look like it's from the future.

## Dead rows and bloat

Under [[mvcc]], Postgres never overwrites a row. An update writes a new
version and marks the old one as ended; a delete only marks it. The old
version must stay while any running transaction might still see it.
After that it's dead, but it still takes up space in the page.

A plain `VACUUM` finds dead versions, removes them from the table and
its indexes, and marks the space free for new rows. It runs alongside
normal reads and writes. What it doesn't do is shrink the file: space
goes back to the operating system only when whole pages at the end of
the table become empty. So a table settles at its live size plus
whatever dead space builds up between vacuum runs. That extra is
*bloat*.

`VACUUM FULL` is different. It writes a fresh copy of the table with no
dead space and gives the old file back, but it holds an `ACCESS
EXCLUSIVE` lock the whole time, so nothing else can touch the table,
and it needs room on disk for the copy. The aim of routine vacuuming is
to run plain VACUUM often enough that you never need FULL.

The same pass also updates the visibility map, which lets
[[covering-indexes|index-only scans]] skip the table, and can refresh
the planner's [[table-statistics]] with `ANALYZE`.

## Autovacuum decides when

You rarely run VACUUM by hand. The autovacuum launcher checks each
database every minute (`autovacuum_naptime`) and starts workers, three
at most by default, on tables that crossed a threshold:

```
threshold = min(autovacuum_vacuum_max_threshold,
                autovacuum_vacuum_threshold
                + autovacuum_vacuum_scale_factor × rows)
```

The defaults are 50 rows plus 20% of the table, capped at 100 million
rows. The cap is new in PostgreSQL 18. Before it, the 20% rule alone
meant a billion-row table waited for 200 million dead rows. All of
these can be set per table, so a big, busy table can get a lower scale
factor than the rest.

Autovacuum takes a lock (`SHARE UPDATE EXCLUSIVE`) that ordinary reads
and writes don't conflict with, but `ALTER TABLE` and even a manual
`ANALYZE` do. When something asks for a conflicting lock, a normal
autovacuum gives up and lets it in. Run such commands often enough and
autovacuum never finishes.

## Transaction ID wraparound

Postgres decides visibility by comparing transaction IDs (XIDs), and an
XID is 32 bits. They're compared on a circle: for any XID, about 2
billion are "older" and 2 billion "newer". A row whose `xmin` is more
than 2 billion transactions old would suddenly look like it came from
the future, and vanish from every query.

![Left: a circle of transaction IDs with the current XID at the top; the half behind it counts as the past and the half ahead as the future, 2 billion each way; an unfrozen row's xmin drifts round towards the future side. Right: a scale of the age of the oldest unfrozen XID, with PostgreSQL 18 defaults marked: 200 million starts an anti-wraparound vacuum, 1.6 billion triggers the failsafe, 40 million before wraparound brings log warnings, and 3 million before wraparound stops new XIDs.](img/vacuum-xid-wraparound.svg)

*Why old rows must be frozen, and the safety nets on the way to wraparound.*

VACUUM prevents this by *freezing* old rows: marking them as committed
so long ago that they're visible to every transaction, now and later.
Since 9.4 that's a flag bit; the original `xmin` stays for debugging.
Every table must be vacuumed this way at least once every 2 billion
transactions.

Postgres enforces it. When a table's oldest unfrozen XID is 200 million
transactions old (`autovacuum_freeze_max_age`), an anti-wraparound
autovacuum starts, even if autovacuum is turned off, and it doesn't give
way to lock requests. At 1.6 billion (`vacuum_failsafe_age`) vacuum
drops its throttling and skips index cleanup to finish faster. With 40
million XIDs left the server logs warnings. With 3 million left it
refuses to hand out new XIDs, so only read-only transactions can start
until someone vacuums.

## Postgres's VACUUM vs InnoDB's purge

InnoDB keeps old versions in an undo log instead of the table. Its
purge threads work through the history list of committed transactions'
undo records, and remove deleted rows once no snapshot needs them. The
history list length is InnoDB's version of "dead rows waiting". The
underlying rule is the same in both: cleanup can't pass the oldest open
snapshot, which is why a single idle transaction can stall either of
them ([[long-running-transactions]]).

## Where it gets tricky

**Vacuum finishing doesn't mean rows were removed.** If an old
transaction is still open, VACUUM runs but can't remove any version
that transaction might still see, and the table keeps growing. The same
goes for anything else that pins old snapshots, such as a stale
replication slot.

**Wraparound recovery changed.** Old advice said to stop the server and
vacuum in single-user mode. Current docs say not to: vacuum normally,
after ending old transactions and dropping stale replication slots.

## Further reading

- [24.1 Routine Vacuuming](https://www.postgresql.org/docs/current/routine-vacuuming.html), PostgreSQL 18 documentation. Space recovery, freezing, wraparound, and when autovacuum runs.
- [19.10 Vacuuming](https://www.postgresql.org/docs/current/runtime-config-vacuum.html), PostgreSQL 18 documentation. Every threshold and its default.
- [PostgreSQL 18 release notes](https://www.postgresql.org/docs/release/18.0/). The new fixed cap on the autovacuum trigger.
- [Purge Configuration](https://dev.mysql.com/doc/refman/8.4/en/innodb-purge-configuration.html), MySQL 8.4 Reference Manual. InnoDB's purge threads and history list, for comparison.
