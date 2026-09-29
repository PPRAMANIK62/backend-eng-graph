---
id: postgres-runtime-config-vacuum
title: "PostgreSQL documentation, 19.10 Vacuuming"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/runtime-config-vacuum.html
kind: docs
primary: true
---

## Summary

Configuration settings for vacuum and autovacuum (read at version 18.6).
Used here only for the defaults that decide when autovacuum runs ANALYZE.

## Key claims

- Base threshold default. "Specifies the minimum number of inserted, updated or deleted tuples needed to trigger an ANALYZE in any one table. The default is 50 tuples." (autovacuum_analyze_threshold)
- Scale factor default. "The default is 0.1 (10% of table size)." (autovacuum_analyze_scale_factor)
- Both can be set per table. "the setting can be overridden for individual tables by changing table storage parameters." (autovacuum_analyze_threshold)
- Vacuum base threshold. "Specifies the minimum number of updated or deleted tuples needed to trigger a VACUUM in any one table. The default is 50 tuples." (autovacuum_vacuum_threshold)
- Vacuum scale factor. "The default is 0.2 (20% of table size)." (autovacuum_vacuum_scale_factor)
- A fixed cap on the trigger. "The default is 100,000,000 tuples." (autovacuum_vacuum_max_threshold)
- Anti-wraparound autovacuum age. "Vacuum also allows removal of old files from the pg_xact subdirectory, which is why the default is a relatively low 200 million transactions." (autovacuum_freeze_max_age)
- The failsafe. "This is VACUUM's strategy of last resort." and "The default is 1.6 billion transactions." (vacuum_failsafe_age)
- How often each database is checked. "The default is one minute (1min)." (autovacuum_naptime)
- Worker count. "The default is 3." (autovacuum_max_workers)
- What the failsafe does. "When the failsafe is triggered, any cost-based delay that is in effect will no longer be applied, further non-essential maintenance tasks (such as index vacuuming) are bypassed, and any Buffer Access Strategy in use will be disabled resulting in VACUUM being free to make use of all of shared buffers." (vacuum_failsafe_age)
- Per-table overrides. "the setting can be overridden for individual tables by changing table storage parameters." (autovacuum_vacuum_threshold)

## Visuals worth redrawing

None.

## My notes

- With the defaults, a 10-million-row table gets re-analyzed after about a million changed rows (50 + 0.1 × 10,000,000). Arithmetic from the defaults, not a measurement.
