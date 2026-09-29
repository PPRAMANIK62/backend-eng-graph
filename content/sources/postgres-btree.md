---
id: postgres-btree
title: "PostgreSQL documentation, 65.1 B-Tree Indexes"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/btree.html
kind: docs
primary: true
---

## Summary

The manual's chapter on Postgres's B-tree implementation (read at version
18.6): the page structure, how splits add levels, bottom-up deletion of
old row versions, and deduplication.

## Key claims

- Structure: levels of linked pages, leaf pages point to table rows. "PostgreSQL B-Tree indexes are multi-level tree structures, where each level of the tree can be used as a doubly-linked list of pages." (65.1.4.1)
- Leaves point to rows, internal pages to the level below. "Each leaf page contains tuples that point to table rows. Each internal page contains tuples that point to the next level down in the tree." (65.1.4.1)
- Almost all pages are leaves. "Typically, over 99% of all pages are leaf pages." (65.1.4.1)
- A full leaf splits, and splits can cascade to the root. "Page splits “cascade upwards” in a recursive fashion." (65.1.4.1)
- A root split adds a level. "This adds a new level to the tree structure by creating a new root page that is one level above the original root page." (65.1.4.1)
- Updates leave old versions in indexes; bottom-up deletion cleans them. "B-Tree indexes incrementally delete version churn index tuples by performing bottom-up index deletion passes." (65.1.4.2)
- Before PostgreSQL 14 only simple deletion existed. "Prior to PostgreSQL 14, the only category of B-Tree deletion was simple deletion." (65.1.4.2)
- VACUUM is still needed eventually. "an exhaustive “clean sweep” by a VACUUM operation (typically run in an autovacuum worker process) will eventually be required" (65.1.4.2)
- Deduplication stores a repeated key once with a list of row pointers. "Deduplication works by periodically merging groups of duplicate tuples together, forming a single posting list tuple for each group." (65.1.4.3)
- It is on by default. "Deduplication is enabled by default." (65.1.4.3)

## Visuals worth redrawing

None; the structure is drawn in winand-search-tree.

## My notes

- The metapage sits at a fixed position at the start of the index file.
