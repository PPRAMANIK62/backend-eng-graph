---
id: postgres-gin
title: "PostgreSQL documentation, 65.4 GIN Indexes"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/gin.html
kind: docs
primary: true
---

## Summary

The manual's chapter on GIN, Postgres's inverted index (read at version
18.6). Used here for what GIN costs on writes and how the pending list
softens it.

## Key claims

- A GIN index maps each key to the rows that contain it. "A GIN index stores a set of (key, posting list) pairs, where a posting list is a set of row IDs in which the key occurs." (65.4.1)
- Built-in operator classes include array_ops, jsonb_ops and tsvector_ops (Table 65.3), and jsonb has two. "Of the two operator classes for type jsonb, jsonb_ops is the default." (65.4.2)
- Updating GIN is slow by nature. "Updating a GIN index tends to be slow because of the intrinsic nature of inverted indexes: inserting or updating one heap row can cause many inserts into the index (one for each key extracted from the indexed item)." (65.4.4.1)
- New entries can wait in an unsorted pending list. "GIN is capable of postponing much of this work by inserting new tuples into a temporary, unsorted list of pending entries." (65.4.4.1)
- Searches pay for a big pending list. "a large list of pending entries will slow searches significantly." (65.4.4.1)
- The pending-list cleanup lands on one write. "an update that causes the pending list to become “too large” will incur an immediate cleanup cycle and thus be much slower than other updates." (65.4.4.1)
- For bulk loads, drop and recreate. "So, for bulk insertions into a table it is advisable to drop the GIN index and recreate it after finishing bulk insertion." (65.4.5)

## Visuals worth redrawing

None.

## My notes

- `fastupdate` turns the pending list on or off per index.
