---
id: lehman-yao-blink-1981
title: Efficient Locking for Concurrent Operations on B-Trees
author: Philip L. Lehman, S. Bing Yao
url: https://www.csd.uoc.gr/~hy460/pdf/p650-lehman.pdf
kind: paper
primary: true
---

## Summary

The B-link tree paper, ACM Transactions on Database Systems 6(4), 1981.
Adds one "link" pointer from each node to its right sibling so that
readers never lock and writers lock only a few nodes at a time. The
basis of Postgres's B-tree. Read from a course copy of the ACM PDF.

## Key claims

- One extra link pointer per node lets a process recover from concurrent changes. "A single additional “link” pointer in each node allows a process to easily recover from tree modifications performed by other concurrent processes." (Abstract)
- Readers take no locks; updaters lock a small constant number of nodes. "the locking scheme is simpler (no read-locks are used) and only a (small) constant number of nodes are locked by any update process at any given time." (Abstract)
- The storage model: fixed-size pages are the unit of reading and writing. "The disk is partitioned into sections of a fixed size" (2. The Storage Model)

## Visuals worth redrawing

None beyond what the Postgres README describes.

## My notes

- The paper assumes each process has private copies of pages; Postgres
  shares buffers, so it adds short read locks (postgres-nbtree-readme).
