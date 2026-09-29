---
id: postgres-hot
title: "PostgreSQL documentation, 66.7 Heap-Only Tuples (HOT)"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/storage-hot.html
kind: docs
primary: true
---

## Summary

Postgres's optimization (read at version 18.6) that lets an update skip
new index entries when no indexed column changed and the new row version
fits on the same page.

## Key claims

- Under MVCC every update writes a new row version, which can mean new index entries. "updates require new versions of rows to be added to tables. This can also require new index entries for each updated row" (66.7)
- Condition 1: no indexed column changes. "The update does not modify any columns referenced by the table's indexes, not including summarizing indexes." (66.7)
- BRIN is the only summarizing index in core. "The only summarizing index method in the core PostgreSQL distribution is BRIN." (66.7)
- Condition 2: room on the same page. "There is sufficient free space on the page containing the old row for the updated row." (66.7)
- Then no new index entries are needed. "New index entries are not needed to represent updated rows, however, summary indexes may still need to be updated." (66.7)
- Lower fillfactor makes HOT more likely. "You can increase the likelihood of sufficient page space for HOT updates by decreasing a table's fillfactor." (66.7)
- You can watch the rate. "The system view pg_stat_all_tables allows monitoring of the occurrence of HOT and non-HOT updates." (66.7)
- Old versions in a HOT chain are cleaned up without vacuum. "row versions other than the oldest and the newest can be completely removed during normal operation, including SELECTs, instead of requiring periodic vacuum operations." (66.7)
- Indexes keep pointing at the first version, which becomes a redirect. "Indexes always refer to the page item identifier of the original row version." (66.7)
- The redirect points at the oldest version someone may still see. "its item identifier is converted to a redirect that points to the oldest version that may still be visible to some concurrent transaction." (66.7)
- Without a lower fillfactor HOT still happens, as pages gain free space. "If you don't, HOT updates will still happen because new rows will naturally migrate to new pages and existing pages with sufficient free space for new row versions." (66.7)
- Why it exists. "To help reduce the overhead of updates, PostgreSQL has an optimization called heap-only tuples (HOT)." (66.7)

## Visuals worth redrawing

None.

## My notes

- This is why adding an index on a column you update often costs more than
  the index itself: those updates stop being HOT.
