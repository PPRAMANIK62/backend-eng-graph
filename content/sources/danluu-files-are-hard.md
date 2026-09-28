---
id: danluu-files-are-hard
title: Files are hard
author: Dan Luu
url: https://danluu.com/file-consistency/
kind: blog
primary: false
---

## Summary

A readable tour of the research on saving files safely: the OSDI 2014
crash-consistency paper, file system error handling studies, and disk
error rates. Builds up an undo-log example one bug at a time, adding
fsyncs, a checksum and a directory fsync. Date from the danluu.com
archive list (12/15).

## Key claims

- Worked example: an undo log to change "foo" to "bar" atomically, first without fsync, then with fsync between the log write and the overwrite. "don't allow write to be reordered past pwrite" (Crash Consistency, code comment)
- In data=writeback mode a crash can extend the file size without writing the data, so the log holds garbage; a checksum in the log entry catches it. "the log will contain random garbage." (Crash Consistency)
- A new file may not survive unless the parent directory is fsynced. "it's legal for a filesystem to end up in a state where the log is never created unless we issue an fsync to the parent directory." (Crash Consistency)
- Some fsyncs don't flush to the disk (OS X needs F_FULLFSYNC), and some disks ignore flushes. "OS X requires fcntl(F_FULLFSYNC) to flush to disk" (Crash Consistency)
- Some disks ignore flush commands. "some disks ignore flush directives" (Crash Consistency)
- Most common bug class in the OSDI paper: assuming ordering between syscalls; next, assuming atomicity. "The most common class of error was incorrectly assuming ordering between syscalls." (Filesystem Semantics)
- When the OSDI 2014 authors reported bugs, developers (the page doesn't say which) often answered "POSIX doesn't let filesystems do that" without pointing to text. "developers would often respond “POSIX doesn't let filesystems do that”, without being able to point to any specific POSIX documentation" (Filesystem Semantics) [corrected in review: not specifically file system developers]
- POSIX rename atomicity doesn't cover crashes. "POSIX says that rename is atomic, but this only applies to normal operation, not to crashes." (Crash Consistency, footnote)
- Silent corruption detected only by checksums hit about 0.5% of disks per year in a cited study. "silent data corruption that was only detected by checksumming happened on .5% of disks per year" (Error Frequency)
- Checksum your data; the question is whether corruption destroys one record or the whole database. "whether or not your record format only destroys a single record when corruption happens, or if it destroys the entire database." (Conclusion)

## Visuals worth redrawing

- The undo-log code growing step by step (no fsync → fsync → checksum → directory fsync). Could be a four-step figure.

## My notes

- Secondary, but it's a guide to the primary papers (Pillai 2014, Prabhakaran 2005, Gunawi 2008, Bairavasundaram 2007).
- Some remarks (ext3 versions, OS X) are 2015-era.
