---
id: oneil-lru-k-1993
title: The LRU-K Page Replacement Algorithm For Database Disk Buffering
author: Elizabeth J. O'Neil, Patrick E. O'Neil, Gerhard Weikum
url: https://www.cs.cmu.edu/~natassa/courses/15-721/papers/p297-o_neil.pdf
kind: paper
primary: true
---

## Summary

SIGMOD 1993 paper. Plain LRU decides on too little information (only
the last reference), so it can't tell hot pages from pages touched once.
LRU-K tracks the last K references per page to estimate how often each
page is used. Read from a CMU course copy of the ACM PDF.

## Key claims

- LRU-K tracks the times of the last K references to popular pages. "The basic idea of LRU-K is to keep track of the times of the last K references to popular database pages" (Abstract)
- LRU-K tells frequently used pages from rarely used ones better than conventional algorithms, in their simulations. "the LRU-K algorithm surpasses conventional buffering algorithms in discriminating between frequently and infrequently referenced pages." (Abstract)
- Plain LRU looks only at the time of the last reference, so it can't tell a hot page from one touched once until it has wasted memory on it. (1.1, paraphrase; the sentence itself has OCR errors in the text layer)
- Example 1.1: random customer lookups through a clustered B-tree alternate index leaf pages and record pages. Each leaf page is referenced far more often than each record page, so the leaves are the ones worth keeping. "we should buffer all the B-tree leaf pages" (Example 1.1)
- Under LRU the buffer instead holds whatever was touched last, roughly half leaf pages and half record pages. "the pages held in memory buffers will be the hundred most recently referenced ones." (Example 1.1)
- Example 1.2: sequential scans swamp the cache with pages unlikely to be used again. "cache swamping by sequential scans causes interactive response time to deteriorate noticeably." (Example 1.2)

## Visuals worth redrawing

None.

## My notes

- The text layer has OCR errors ("reduee", "reeord"); only clean
  sentences are quoted.
