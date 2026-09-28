---
id: biriukov-page-cache-eviction
title: Page Cache eviction and page reclaim (Linux Page Cache for SRE, chapter 4)
author: Viacheslav Biriukov
url: https://biriukov.dev/docs/page-cache/4-page-cache-eviction-and-page-reclaim/
published: 2025-10              # "Last updated: Oct 2025"
accessed: 2026-09-28
kind: blog
primary: false
---

## Summary

How Linux decides which page cache pages to throw out: active and
inactive LRU lists per cgroup, promotion on second access, and shadow
entries to spot thrashing. Also shows evicting a file by hand with
`POSIX_FADV_DONTNEED` and vmtouch.

## Key claims

- Eviction is driven by a pair of active and inactive lists per cgroup, one pair for file pages. "Its core building block is a per cgroup pair of active and inactive lists" (Theory)
- New pages go to the inactive list; a second access promotes a page to the active list. "a new file operation to the page h promotes the page to the active LRU list by putting it at the head." (Theory, worked example)
- The idea is LRU: pages not used lately are likely not needed soon. "In general, Linux should choose pages that have not been used recently (inactive)" (Theory)
- Entries enter at the head of each list and move toward the tail; a newly loaded page goes to the head of the inactive list, and older pages there get evicted. "New elements are added to the head of the linked list, and the elements in between gradually move toward the end." (Theory)
- Shadow entries and refault distance help when the working set is about the size of memory. "Shadow entries help to mitigate the memory thrashing problem." (Theory)
- The real algorithm is more complex than the two-list picture (PG_referenced flag, NUMA nodes double the lists). "the real process of pages promotion and demotion is much more complicated and sophisticated." (Theory)
- cgroups are the main way to split and control page cache per service. "The primary approach to control and tune Page Cache is the cgroup subsystem." (intro)
- `vmtouch -e` or `posix_fadvise(..., POSIX_FADV_DONTNEED)` evicts one file's pages. (Manual pages eviction with POSIX_FADV_DONTNEED, example output shows 32768 pages (128M) evicted)

## Visuals worth redrawing

- The inactive/active list diagrams with page "h" moving between them.
  Redraw as one figure with three steps.

## My notes

- Doesn't cover MGLRU in the part I read; the kernel has an alternative
  multi-generation LRU (docs.kernel.org admin-guide/mm/multigen_lru). Not
  used in the article, no note made.
