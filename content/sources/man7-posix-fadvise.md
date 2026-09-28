---
id: man7-posix-fadvise
title: posix_fadvise(2), Linux manual page
author: Michael Kerrisk and man-pages contributors
url: https://man7.org/linux/man-pages/man2/posix_fadvise.2.html
kind: docs
primary: true
---

## Summary

How a program tells the kernel how it will access a file, so the page
cache can read ahead more, less, or drop pages. man-pages 6.19.

## Key claims

- It's a hint about future access patterns. "The advice is not binding; it merely constitutes an expectation on behalf of the application." (DESCRIPTION)
- `POSIX_FADV_WILLNEED` starts reading a region into the page cache without blocking. "POSIX_FADV_WILLNEED initiates a nonblocking read of the specified region into the page cache." (DESCRIPTION)
- `POSIX_FADV_DONTNEED` tries to drop cached pages, useful when streaming large files. "POSIX_FADV_DONTNEED attempts to free cached pages associated with the specified region." (DESCRIPTION)
- DONTNEED won't free dirty pages; fsync first if you need that. "Any unwritten dirty pages will not be freed." (DESCRIPTION)
- On Linux, SEQUENTIAL doubles the readahead window and RANDOM turns readahead off, for the whole file. "POSIX_FADV_SEQUENTIAL doubles this size, and POSIX_FADV_RANDOM disables file readahead entirely." (VERSIONS)
- Since Linux 6.3, `POSIX_FADV_NOREUSE` lets page replacement ignore accesses to those pages. "Since Linux 6.3, POSIX_FADV_NOREUSE signals that the kernel page replacement algorithm can ignore access to mapped page cache marked by this flag." (DESCRIPTION)
- (added in review) DONTNEED ignores partial pages; use page-aligned ranges. "Requests to discard partial pages are ignored." (NOTES)

## Visuals worth redrawing

None.

## My notes

- Good lab experiment: time a sequential read with NORMAL vs RANDOM advice.
