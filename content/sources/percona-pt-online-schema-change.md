---
id: percona-pt-online-schema-change
title: pt-online-schema-change
author: Percona
url: https://docs.percona.com/percona-toolkit/pt-online-schema-change.html
kind: docs
primary: true
---

## Summary

The manual for Percona Toolkit's MySQL online schema change tool
(Percona Toolkit 3.7.1 when read): an altered empty copy, chunked row
copy, triggers that mirror writes, then an atomic rename. Lists what
breaks it (no primary key, existing triggers, foreign keys pointing at
the table).

## Key claims

- The original table isn't locked; clients keep reading and writing. "This means that the original table is not locked, and clients may continue to read and change data in it." (DESCRIPTION)
- The steps: empty copy, alter, copy rows, replace. "pt-online-schema-change works by creating an empty copy of the table to alter, modifying it as desired, and then copying rows from the original table into the new table." (DESCRIPTION)
- Triggers carry changes made during the copy. "Any modifications to data in the original tables during the copy will be reflected in the new table, because the tool creates triggers on the original table to update the corresponding rows in the new table." (DESCRIPTION)
- It fails if the table already has triggers. "The use of triggers means that the tool will not work if any triggers are already defined on the table." (DESCRIPTION)
- The swap is one atomic RENAME. "it uses an atomic RENAME TABLE operation to simultaneously rename the original and new tables." (DESCRIPTION)
- Foreign keys that point at the table break the simple swap. "The technique of atomically renaming the original and new tables does not work when foreign keys refer to the table." (DESCRIPTION)
- It needs a primary key or unique index, for the DELETE trigger. "This is necessary because the tool creates a DELETE trigger to keep the new table updated while the process is running." (--alter)
- It pauses when replicas lag. "The tool pauses the data copy operation if it observes any replicas that are delayed in replication." (DESCRIPTION)
- It sets short lock waits so it loses lock fights, not the app. "so that it is more likely to be the victim of any lock contention, and less likely to disrupt other transactions." (DESCRIPTION)
- Chunks are sized by time, 0.5 s by default. "Adjust the chunk size dynamically so each data-copy query takes this long to execute." (--chunk-time, default 0.5)
- drop_swap leaves a moment with no table and no way back. "First, for a short time between dropping the original table and renaming the temporary table, the table to be altered simply does not exist, and queries against it will result in an error." (--alter-foreign-keys-method, drop_swap)
- A fresh table can lack statistics and get bad plans, so it runs ANALYZE first. "This can cause fast, index-using queries to do full table scans until optimizer statistics are updated" (--[no]analyze-before-swap)
- The preferred foreign key method drops and re-adds the constraints on child tables. "This method uses ALTER TABLE to drop and re-add foreign key constraints that reference the new table." (--alter-foreign-keys-method, rebuild_constraints)

## Visuals worth redrawing

None.

## My notes

- The column rename limitation ("Columns cannot be renamed by dropping
  and re-adding") shows the tool copies by column name.
