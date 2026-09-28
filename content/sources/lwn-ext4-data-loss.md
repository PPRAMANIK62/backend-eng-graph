---
id: lwn-ext4-data-loss
title: ext4 and data loss
author: Jonathan Corbet
url: https://lwn.net/Articles/322823/
kind: blog
primary: false
---

## Summary

LWN's account of the 2009 ext4 "zero-length files" reports: why ext3
seemed to protect data that applications never fsynced, why ext4's delayed
allocation stopped that, and the heuristics queued for Linux 2.6.30 to
paper over it.

## Key claims

- User report: after a crash, files written during the previous boot were empty. "pretty much any file written to by any application (during the previous boot) was 0 bytes." (quoted bug report, opening)
- ext3 commits its journal every five seconds by default, and in data=ordered mode forces data blocks out before the metadata commit. "any modified data blocks are forced out to disk before the metadata changes are committed to the journal." (middle)
- So ext3 lost at most about five seconds of writes, a property nobody promised. "This outcome is almost an accident resulting from some decisions made in the design of ext3." (Corbet's words, middle)
- Ts'o: apps came to depend on ext3's behavior although POSIX never guaranteed it. "even though POSIX never really made any such guarantee." (Ts'o, quoted)
- Delayed allocation delays choosing disk blocks, which helps performance, and ext4 doesn't write unallocated blocks at journal commit. "So ext4 will not (cannot) write out unallocated blocks as part of the next journal commit cycle." (middle)
- With default settings data could sit a minute or so before flushing. "it can still take a minute or so (with the default settings)" (middle)
- The article's view: fix the apps; use fsync() or fdatasync(). "Applications which want to be sure that their files have been committed to the media can use the fsync() or fdatasync() system calls" (middle)
- Three heuristics queued for 2.6.30: an EXT4_IOC_ALLOC_DA_BLKS ioctl, forced allocation on close of a truncated file, forced allocation when a file is renamed on top of another. "this patch forces block allocation when one file is renamed on top of another." (end)
- 2009 defaults: dirty_expire_centisecs 30 seconds, dirty_writeback_centisecs 5 seconds. (end)

## Visuals worth redrawing

- A timeline: write new file, rename over old, ext3 commit at 5 s includes data; ext4 commits rename at 5 s, data flushed ~60 s later; crash in between → empty file.

## My notes

- The page doesn't name the `auto_da_alloc` mount option. Don't use that name without another source.
- "almost an accident" is Corbet, not Ts'o. (Fixed in `_phase-1-crash.md`.)
