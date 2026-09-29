---
id: winand-search-tree
title: "The Search Tree (B-Tree) Makes the Index Fast"
author: Markus Winand
url: https://use-the-index-luke.com/sql/anatomy/the-tree
kind: book
primary: false
---

## Summary

A chapter of "Use The Index, Luke", the free web version of Winand's SQL
Performance Explained. Shows how a B-tree sits on top of a sorted, linked
list of leaf pages, how a lookup walks it, and why its depth stays small.

## Key claims

- Leaf pages are in no particular order on disk; a tree is needed to find the right one. "The index leaf nodes are stored in an arbitrary order—the position on the disk does not correspond to the logical position according to the index order." (The Search Tree)
- Branch entries hold the biggest value of each leaf below. "Each branch node entry corresponds to the biggest value in the respective leaf node." (Figure 1.2 text)
- The tree is balanced. "The structure is a balanced search tree because the tree depth is equal at every position; the distance between root node and leaf nodes is the same everywhere." (The Search Tree)
- A B-tree is not a binary tree. "A B-tree is a balanced tree—not a binary tree." (Note)
- Every write maintains the tree. "It applies every insert, delete and update to the index and keeps the tree in balance, thus causing maintenance overhead for write operations." (The Search Tree)
- Real indexes are shallow. "Real world indexes with millions of records have a tree depth of four or five. A tree depth of six is hardly ever seen." (The Search Tree)
- Nodes hold hundreds of entries. "Databases exploit this concept to a maximum extent and put as many entries as possible into each node—often hundreds." (Logarithmic Scalability)

## Visuals worth redrawing

- Figure 1.2 "B-tree Structure": root, branch and leaf levels with the linked leaf list. Redrawn in the indexes article.
- Figure 1.3 "B-Tree Traversal": a search for 57.

## My notes

- Winand writes for several databases (Oracle, SQL Server, MySQL, Db2, Postgres).
