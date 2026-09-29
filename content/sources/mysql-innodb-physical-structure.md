---
id: mysql-innodb-physical-structure
title: "MySQL 8.4 Reference Manual, 17.6.2.2 The Physical Structure of an InnoDB Index"
author: Oracle
url: https://dev.mysql.com/doc/refman/8.4/en/innodb-physical-structure.html
kind: docs
primary: true
---

## Summary

InnoDB index pages (MySQL 8.4): B-trees with 16KB pages by default, how
full pages get under sequential and random inserts, the fill factor for
sorted index builds, and the 50% merge threshold.

## Key claims

- InnoDB indexes are B-trees, except spatial ones. "With the exception of spatial indexes, InnoDB indexes are B-tree data structures." (17.6.2.2)
- Default page size 16KB, set at initialization. "The default size of an index page is 16KB." (17.6.2.2)
- InnoDB leaves 1/16 of a clustered index page free for later changes. "InnoDB tries to leave 1/16 of the page free for future insertions and updates of the index records." (17.6.2.2)
- Sequential inserts leave pages about 15/16 full; random inserts from 1/2 to 15/16. "If records are inserted in a random order, the pages are from 1/2 to 15/16 full." (17.6.2.2)
- Below the merge threshold, 50% by default, InnoDB tries to merge. "If the fill factor of an InnoDB index page drops below the MERGE_THRESHOLD, which is 50% by default if not specified, InnoDB tries to contract the index tree to free the page." (17.6.2.2)

## Visuals worth redrawing

None.

## My notes

- Postgres never merges partly full B-tree pages (postgres-nbtree-readme).
