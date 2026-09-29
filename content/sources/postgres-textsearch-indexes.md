---
id: postgres-textsearch-indexes
title: "PostgreSQL documentation, 12.9 Preferred Index Types for Text Search"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/textsearch-indexes.html
kind: docs
primary: true
---

## Summary

GIN vs GiST for text search (read at version 18.6). GIN is an inverted
index and the preferred choice; GiST stores a lossy signature per
document.

## Key claims

- Two index types: GIN and GiST. "There are two kinds of indexes that can be used to speed up full text searches: GIN and GiST." (12.9)
- GIN is preferred; an entry per lexeme with a compressed list of locations. "As inverted indexes, they contain an index entry for each word (lexeme), with a compressed list of matching locations." (12.9)
- Multi-word searches narrow with the index. "Multi-word searches can find the first match, then use the index to remove rows that are lacking additional words." (12.9)
- GIN doesn't store weights; weighted queries recheck the row. "Thus a table row recheck is needed when using a query that involves weights." (12.9)
- GiST is lossy: fixed-length signature, false matches rechecked against the row. "A GiST index is lossy, meaning that the index might produce false matches" (12.9)
- Default signature 124 bytes, max 2024. "The default signature length (when siglen is not specified) is 124 bytes" (12.9)
- Lossiness costs random table fetches. "Since random access to table records is slow, this limits the usefulness of GiST indexes." (12.9)
- GIN build is faster with more maintenance_work_mem. (12.9)

## Visuals worth redrawing

- An inverted index: lexeme → list of rows (12.9).

## My notes

None.
