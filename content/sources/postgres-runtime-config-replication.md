---
id: postgres-runtime-config-replication
title: "Replication settings, PostgreSQL documentation section 19.6"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/runtime-config-replication.html
kind: docs
primary: true
---

## Summary

Reference for replication settings in PostgreSQL 18. Used here for the
limits on how much WAL a replication slot may hold back and for
invalidating idle slots.

## Key claims

- max_replication_slots defaults to 10. "The default is 10." (19.6.1, max_replication_slots)
- By default a slot can keep unlimited WAL. "If max_slot_wal_keep_size is -1 (the default), replication slots may retain an unlimited amount of WAL files." (19.6.1, max_slot_wal_keep_size)
- With a limit set, a slot that falls too far behind can lose the WAL it needs and can't continue. "the standby using the slot may no longer be able to continue replication due to removal of required WAL files." (19.6.1, max_slot_wal_keep_size)
- idle_replication_slot_timeout invalidates slots unused for longer than the setting; zero (the default) disables it. "A value of zero (the default) disables the idle timeout invalidation mechanism." (19.6.1, idle_replication_slot_timeout)
- The invalidation happens at a checkpoint. "Slot invalidation due to idle timeout occurs during checkpoint." (19.6.1, idle_replication_slot_timeout)

## Visuals worth redrawing

None.

## My notes

- idle_replication_slot_timeout is new in PostgreSQL 18 (release notes,
  "Allow inactive replication slots to be automatically invalidated").
