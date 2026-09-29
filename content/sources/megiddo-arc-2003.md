---
id: megiddo-arc-2003
title: "ARC: A Self-Tuning, Low Overhead Replacement Cache"
author: Nimrod Megiddo, Dharmendra S. Modha (IBM Almaden)
url: https://www.usenix.org/legacy/events/fast03/tech/full_papers/megiddo/megiddo.pdf
kind: paper
primary: true
---

## Summary

FAST 2003 paper introducing ARC. It keeps two LRU lists, one for pages
seen once recently (recency) and one for pages seen at least twice
(frequency), plus "ghost" entries for recently evicted pages, and moves
the split between the two lists with a learning rule. Also a good
summary of LRU, LFU, LRU-2 and Belady's MIN.

## Key claims

- Belady's MIN (evict the page used furthest in the future) is optimal but offline; it is the upper bound. "The policy MIN provides an upper bound on the achievable hit ratio by any on-line policy." (I, related work)
- LRU captures recency but not frequency. "However, while the SDD model captures “recency”, it does not capture “frequency”." (B. Recency)
- LFU's drawbacks: log-time, ignores recent history, keeps stale popular pages. "it requires logarithmic implementation complexity in cache size, pays almost no attention to recent history, and does not adapt well to changing access patterns since it accumulates stale pages with high frequency counts that may no longer be useful." (C. Frequency)
- ARC keeps two LRU lists: seen once recently, and seen at least twice recently. "The basic idea behind ARC is to maintain two LRU lists of pages." (I.B)
- The directory remembers twice as many pages as fit in the cache. "ARC maintains a cache directory that remembers twice as many pages as in the cache memory." (I.B)
- It adapts the split online, without tuning. "ARC dynamically, adaptively, and continually balances between the recency and frequency components in an online and selftuning fashion." (Abstract)
- Constant time per request, like LRU. "The policy ARC is simple-to-implement and, like LRU, has constant complexity per request." (Abstract)
- Scan-resistant. "The policy ARC is scan-resistant: it allows one-time sequential requests to pass through without polluting the cache." (Abstract)
- Remembering evicted pages ("ghost caches") was used before ARC too. "Previously, ghost caches have been employed in a number of cache replacement algorithms such as 2Q, MQ, LRU-2, ALRFU, and LIRS to remember recently evicted cache pages." (related work)
- A hit in a ghost list grows the matching real list. "The fundamental intuition behind learning is the following: if there is a hit in B1 then we should increase the size of T1" (IV.C Learning; B1 and T1 are typeset as math symbols in the PDF)

## Visuals worth redrawing

- The T1/T2 lists with their ghost lists B1/B2 and the moving split p.

## My notes

- The PDF's math font doesn't extract, so the hit-ratio numbers in the
  abstract couldn't be read as text. Not cited.
