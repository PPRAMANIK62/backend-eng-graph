---
id: postgres-nbtree-readme
title: "src/backend/access/nbtree/README (PostgreSQL 18 source)"
author: The PostgreSQL Global Development Group
url: https://github.com/postgres/postgres/blob/REL_18_STABLE/src/backend/access/nbtree/README
kind: code
primary: true
---

## Summary

The developer notes for Postgres's B-tree index (REL_18_STABLE branch).
It implements Lehman and Yao's B-link tree: right-links and high keys
let searches cope with concurrent splits. Covers how Postgres departs
from the paper, page deletion (only empty pages, never merges), WAL
logging of splits, suffix truncation and split point choice.

## Key claims

- Postgres implements Lehman and Yao's algorithm. "This directory contains a correct implementation of Lehman and Yao's high-concurrency B-tree management algorithm" (top)
- L&Y adds a right-link and a high key to each page. "Compared to a classic B-tree, L&Y adds a right-link pointer to each page, to the page's right sibling." (The basic Lehman & Yao Algorithm)
- Together they let a search detect a concurrent split. "These two additions make it possible to detect a concurrent page split, which allows the tree to be searched without holding any read locks (except to keep a single page from being modified while reading it)." (same)
- If the search key is above the high key, the page split under you; move right. "If the search key is greater than the high key, the page must've been split concurrently, and you must follow the right-link to find the new page containing the key range you're looking for." (same)
- Keys are made unique by using the heap TID as a tiebreaker. "The requirement that all btree keys be unique is satisfied by treating heap TID as a tiebreaker attribute." (same)
- Postgres does take short page-level read locks because buffers are shared. "we do page-level read locking on btree pages in order to guarantee that no record is modified while we are examining it." (Differences to the Lehman & Yao algorithm)
- Range scans only walk leaf pages once they've descended. "the scan looks only at leaf pages and never at higher tree levels." (same)
- A root split creates a new root one level up. "Our implementation is to split the root in the same way that any other page would be split, then construct a new root page holding pointers to both of the resulting pages" (same)
- Variable-size keys: split by bytes, not item count. "When we split a page, we try to equalize the number of bytes, not items, assigned to pages" (same)
- Only completely empty pages are deleted; partly full pages are never merged. "We consider deleting an entire page from the btree only when it's become completely empty of items." (Deleting entire pages during VACUUM)
- Why not merge: moving items could make a scan in the other direction miss them. "Merging partly-full pages would allow better space reuse, but it seems impractical to move existing data items left or right to make this happen" (Deleting entire pages during VACUUM)
- Inserting increasing keys: a backend caches the rightmost leaf and skips the descent. "We can avoid the cost of walking down the tree in such common cases." (Fastpath For Index Insertion)
- A split is logged as one WAL record for the split level and a second for the parent insert. "An insertion that causes a page split is logged as a single WAL entry for the changes occurring on the insertion's level" (WAL Considerations)
- A crash between the two leaves a page with no downlink; searches still find it through the right-link, and the downlink is fixed later. "The search algorithm works correctly, as the page will be found by following the right-link from its left sibling" (WAL Considerations)
- Suffix truncation shortens pivot keys to improve fan-out. "The goal of suffix truncation of key attributes is to improve index fan-out." (Notes about suffix truncation)
- Postgres stores a left-sibling link as well, for backward scans. "To support scans in the backward direction, we also store a \"left sibling\" link much like the \"right sibling\"." (Differences to the Lehman & Yao algorithm)
- Missing downlinks are added during later inserts. "Our approach is to create any missing downlinks on-the-fly, when searching the tree for a new insertion." (WAL Considerations)
- The Prefix B-Trees paper appeared in ACM TODS Vol 2, No. 1, in 1977 (the README's citation). (Notes about suffix truncation)
- It comes from Bayer and Unterauer's Prefix B-Trees (1977). "The technique was first described by Bayer and Unterauer" (same)

## Visuals worth redrawing

- A concurrent split with the right-link: a reader arriving at the old left page after a split follows the right-link. Drawn in `b-plus-tree`.

## My notes

- The master branch README differed only slightly in this file when read.
