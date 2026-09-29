---
id: postgres-index-types
title: "PostgreSQL documentation, 11.2 Index Types"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/indexes-types.html
kind: docs
primary: true
---

## Summary

The manual's overview of Postgres's built-in index types (read at version
18.6): B-tree, Hash, GiST, SP-GiST, GIN and BRIN, and which operators each
one can serve.

## Key claims

- The list of types, B-tree by default. "PostgreSQL provides several index types: B-tree, Hash, GiST, SP-GiST, GIN, BRIN, and the extension bloom." (11.2)
- B-tree is the default. "By default, the CREATE INDEX command creates B-tree indexes, which fit the most common situations." (11.2)
- B-tree handles equality and ranges on sortable data. "B-trees can handle equality and range queries on data that can be sorted into some ordering." (11.2.1)
- B-tree serves anchored LIKE patterns only. "for example, col LIKE 'foo%' or col ~ '^foo', but not col LIKE '%bar'." (11.2.1)
- B-tree can return rows in sorted order. "B-tree indexes can also be used to retrieve data in sorted order." (11.2.1)
- Hash stores a 32-bit hash code, so only equality. "Hash indexes store a 32-bit hash code derived from the value of the indexed column. Hence, such indexes can only handle simple equality comparisons." (11.2.2)
- GiST is a framework, not one index. "GiST indexes are not a single kind of index, but rather an infrastructure within which many different indexing strategies can be implemented." (11.2.3)
- GiST can do nearest-neighbour searches. "GiST indexes are also capable of optimizing “nearest-neighbor” searches" (11.2.3)
- SP-GiST supports non-balanced structures. "SP-GiST permits implementation of a wide range of different non-balanced disk-based data structures, such as quadtrees, k-d trees, and radix trees (tries)." (11.2.4)
- GIN is an inverted index for values with many parts. "GIN indexes are “inverted indexes” which are appropriate for data values that contain multiple component values, such as arrays." (11.2.5)
- BRIN stores summaries of block ranges. "BRIN indexes (a shorthand for Block Range INdexes) store summaries about the values stored in consecutive physical block ranges of a table." (11.2.6)
- BRIN works when values follow the physical row order. "Thus, they are most effective for columns whose values are well-correlated with the physical order of the table rows." (11.2.6)
- B-tree operators, and constructs built from them. "Constructs equivalent to combinations of these operators, such as BETWEEN and IN, can also be implemented with a B-tree index search." (11.2.1; the operators listed are < <= = >= >)
- B-tree also serves null tests. "Also, an IS NULL or IS NOT NULL condition on an index column can be used with a B-tree index." (11.2.1)
- GiST ships operator classes for 2-D geometry, including overlap (&&). "the standard distribution of PostgreSQL includes GiST operator classes for several two-dimensional geometric data types" (11.2.3)
- Nearest-neighbour example. "SELECT * FROM places ORDER BY location <-> point '(101,456)' LIMIT 10;" (11.2.3)
- SP-GiST ships operator classes for points. "the standard distribution of PostgreSQL includes SP-GiST operator classes for two-dimensional points" (11.2.4)

## Visuals worth redrawing

None.

## My notes

- Operator lists per type are in the page; the article names only the common ones.
