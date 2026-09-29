---
id: postgres-17-release-notes
title: "PostgreSQL 17 release notes"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/release/17.0/
kind: docs
primary: true
---

## Summary

Release notes for PostgreSQL 17.0 (2024). Used here for two changes
about long transactions: the new transaction_timeout setting and the
removal of old_snapshot_threshold.

## Key claims

- transaction_timeout is new in 17. "Add server variable transaction_timeout to restrict the duration of transactions" (E.12.3.1.6 Server Configuration)
- old_snapshot_threshold was removed. "Remove server variable old_snapshot_threshold (Thomas Munro)" (E.12.2 Migration to Version 17)
- What it did: let vacuum remove rows running transactions might still see, with "snapshot too old" errors later. "This variable allowed vacuum to remove rows that potentially could be still visible to running transactions, causing “snapshot too old” errors later if accessed." (E.12.2 Migration to Version 17)
- Logical slots can fail over to a standby, set by a fifth argument to pg_create_logical_replication_slot(). "Enable the failover of logical slots (Hou Zhijie, Shveta Malik, Ajin Cherian)" (E.12.3.1.8 Logical Replication)
- sync_replication_slots turns on the synchronization of failover slots. "Add server variable sync_replication_slots to enable failover logical slot synchronization (Shveta Malik, Hou Zhijie, Peter Smith)" (E.12.3.1.8 Logical Replication)

## Visuals worth redrawing

None.

## My notes

- The page gives the release year as 2024.
