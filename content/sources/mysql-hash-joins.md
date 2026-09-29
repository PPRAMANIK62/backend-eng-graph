---
id: mysql-hash-joins
title: Hash Join Optimization (MySQL 8.0 Reference Manual)
author: Oracle Corporation
url: https://dev.mysql.com/doc/refman/8.0/en/hash-joins.html
kind: docs
primary: true
---

## Summary

The MySQL 8.0 manual page on hash joins, which MySQL added in 8.0.18 and
which replaced the block nested loop join entirely in 8.0.20. Covers
when hash joins are used, EXPLAIN output, and memory limits.

## Key claims

- MySQL uses hash joins from 8.0.18. "By default, MySQL (8.0.18 and later) employs hash joins whenever possible." (top)
- Before that, joins with no usable index fell back to block nested loop, which was removed in 8.0.20. "Beginning with MySQL 8.0.20, support for block nested loop is removed, and the server employs a hash join wherever a block nested loop would have been used previously." (top)
- Hash join is used when a join has an equality condition and no index applies. "Beginning with MySQL 8.0.18, MySQL employs a hash join for any query for which each join has an equi-join condition, and in which there are no indexes that can be applied to any join conditions, such as this one:" (top)
- Before 8.0.20 an equi-join condition was required. "Prior to MySQL 8.0.20, a hash join could not be used if any pair of joined tables did not have at least one equi-join condition, and the slower block nested loop algorithm was employed." (middle)
- Outer, semi and anti joins use hash joins from 8.0.20. "In MySQL 8.0.20 and later, hash joins are used for outer joins (including antijoins and semijoins) as well, so this is no longer an issue." (memory section)
- Memory is capped and the join spills to disk files beyond it. "When the memory required for a hash join exceeds the amount available, MySQL handles this by using files on disk." (memory section)
- Spilling can fail if it opens too many files. "If this happens, you should be aware that the join may not succeed if a hash join cannot fit into memory and it creates more files than set for open_files_limit." (memory section)
- The memory cap is join_buffer_size. "Memory usage by hash joins can be controlled using the join_buffer_size system variable; a hash join cannot use more memory than this amount." (memory section)

## Visuals worth redrawing

None.

## My notes

- Plain curl got an error page from dev.mysql.com; a browser user agent
  worked. The 8.4 page says the same without version history.
- The page gives versions, not years; the article pins to versions.
