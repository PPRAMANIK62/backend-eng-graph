---
id: lwn-readahead-documentation
title: "Readahead: the documentation I wanted to read"
author: Neil Brown
url: https://lwn.net/Articles/888715/
published: 2022-04-08
accessed: 2026-09-28
kind: blog
primary: true
---

## Summary

A kernel developer explains how Linux readahead works while documenting
`mm/readahead.c` (his documentation was merged for Linux 5.18). Readahead
reads pages the program hasn't asked for yet, betting it will ask soon,
and grows the bet when it pays off.

## Key claims

- Readahead reads file data into the page cache before it's asked for. "Readahead is used to read content into the page cache before it is explicitly requested by the application." (Sync and async, quoting his docs)
- It's triggered by a read or a page fault that misses the cache, or hits a page marked `PG_readahead`. "This flag indicates that the page was loaded as part of a previous readahead request and now that it has been accessed, it is time for the next read-ahead." (Sync and async)
- Each request has a part the caller waits for and a part it doesn't. "Each readahead request is partly synchronous read, and partly async readahead." (Sync and async)
- Once sequential reading is established, readahead runs fully ahead of the reader. "Once a series of sequential reads has been established, there should be no need for a synchronous component and all readahead requests will be fully asynchronous." (When readahead can be skipped)
- The core bet: read more than asked, and read even more if the extra gets used. "A core idea in readahead is to take a risk and read more than was requested." (When readahead can be skipped)
- The docs were merged for Linux 5.18. "which was merged for the 5.18 release" (Sync and async)
- (added in review) The first page of the async part carries PG_readahead. "The first page in this async section will have PG_readahead set as a trigger for a subsequent readahead." (Sync and async)
- (added in review) The code lives in mm/readahead.c. "The main part of the API exported by mm/readahead.c is two functions" (Sync and async)

## Visuals worth redrawing

- None in the article; a timeline of sync part, async part and the
  `PG_readahead` marker page would be easy to draw ourselves.

## My notes

- The article is mostly about naming and FUSE; the useful mechanism is in
  the first half.
