---
id: cmu-15445-indexes1
title: "Lecture #08: Indexes & Filters I (15-445/645 Database Systems)"
author: Andy Pavlo, Carnegie Mellon University
url: https://15445.courses.cs.cmu.edu/fall2024/notes/08-indexes1.pdf
kind: docs
primary: false
---

## Summary

CMU's Fall 2024 lecture on B+trees: the definition, insertion with
splits, deletion with redistribution and merges, clustered indexes, and
design choices (node size, merge threshold, variable-length keys,
in-node search) and optimizations (prefix compression, deduplication,
suffix truncation, pointer swizzling, bulk loading).

## Key claims

- A B+tree keeps data sorted and supports search, sequential access, insert and delete in O(log n). "A B+Tree is a self-balancing tree data structure that keeps data sorted and allows searches, sequential access, insertion, and deletions in O(log(n))." (2 B+Tree)
- Almost every order-preserving index is a B+tree. "Almost every modern DBMS that supports order-preserving indexes uses a B+Tree." (2)
- B-tree vs B+tree: values in every node vs values only in leaves. "B-Trees stores keys and values in all nodes, while B+ trees store values only in leaf nodes." (2)
- Modern implementations borrow sibling pointers from the B-link tree. "Modern B+Tree implementations combine features from other B-Tree variants, such as the sibling pointers used in the Blink -Tree." (2)
- Perfectly balanced: every leaf at the same depth. "It is perfectly balanced (i.e., every leaf node is at the same depth)." (2)
- Every inner node except the root is at least half full. "Every inner node other than the root is at least half full (M/2 − 1 <= num of keys <= M − 1)." (2)
- Inner-node keys are guide posts and may not exist in the leaves. "What this means is that you could potentially have a key in an inner node (as a guide post) that is not found on the leaf nodes." (2)
- Leaf values are either record ids or the tuple data itself. "Two approaches for leaf node values are record IDs and tuple data." (2)
- Leaf split copies the middle key up; inner split pushes it up. "Otherwise split L into two nodes L and L2 . Redistribute entries evenly and copy up the middle key." (2, Insertion)
- Deletion below half full borrows from a sibling or merges. "If redistribution fails, merge L and the sibling." (2, Deletion)
- Clustered index: table stored in primary-key order. "The table is stored in the sort order specified by the primary key, as either heap- or index-organized storage." (2, Clustered Indexes)
- Some databases add a hidden row id primary key when there isn't one. "they will automatically make a hidden row id primary key if a table doesn’t have an explicit one" (2, Clustered Indexes)
- Eager merging can thrash; some systems delay merges. "eager merging could lead to thrashing, where a lot of successive delete and insert operations lead to constant splits and merges." (3.2 Merge Threshold)
- Node size depends on the medium and workload. (3.1 Node Size)
- Suffix truncation: inner nodes only need enough of a key to route. "We can take advantage of this by only storing the minimum prefix that is needed to correctly route probes into the correct node." (4.3 Suffix Truncation)
- Bulk loading builds sorted leaves then the index from the bottom up. "initial insertion of data is much more efficient if we construct a sorted linked list of leaf nodes and then easily build the index from the bottom up" (4.5 Bulk Insert)
- Splits and merges are expensive; B-epsilon trees buffer changes in inner nodes. "Split / merge node operation are expensive." (4.6 Write-Optimized B+ Tree)
- An inner node with k keys has k+1 children. "Every inner node with k keys has k+1 non-null children." (2)

## Visuals worth redrawing

- Figure 1, a small B+tree with inner node keys 5 and 9 and linked leaves.

## My notes

- Their "at least half full" rule is the textbook invariant; Postgres
  doesn't enforce it (see postgres-nbtree-readme), InnoDB uses a 50%
  merge threshold (mysql-innodb-physical-structure).
