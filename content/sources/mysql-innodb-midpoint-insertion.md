---
id: mysql-innodb-midpoint-insertion
title: "MySQL 8.4 Reference Manual, 17.8.3.3 Making the Buffer Pool Scan Resistant"
author: Oracle
url: https://dev.mysql.com/doc/refman/8.4/en/innodb-performance-midpoint_insertion.html
kind: docs
primary: true
---

## Summary

The two settings that make InnoDB's buffer pool resist big scans:
`innodb_old_blocks_pct` (size of the old sublist) and
`innodb_old_blocks_time` (how long a page must stay old before another
access can make it young). MySQL 8.4.

## Key claims

- innodb_old_blocks_pct defaults to 37, the original 3/8. "The default value of innodb_old_blocks_pct is 37, corresponding to the original fixed ratio of 3/8." (17.8.3.3)
- Scans touch a page a few times in quick succession, then never again. "In these scans, a data page is typically accessed a few times in quick succession and is never touched again." (17.8.3.3)
- innodb_old_blocks_time is a window after first access during which accesses don't promote. "specifies the time window (in milliseconds) after the first access to a page during which it can be accessed without being moved to the front (most-recently used end) of the LRU list." (17.8.3.3)
- Its default is 1000 ms. "The default value of innodb_old_blocks_time is 1000." (17.8.3.3)
- Benchmark before changing them. "always benchmark to verify the effectiveness before changing these settings in any performance-critical or production environment." (17.8.3.3)

## Visuals worth redrawing

None.

## My notes

- This is a two-list approximation of LRU-2 in practice (cmu-15445-buffer-pool
  describes the same idea).
