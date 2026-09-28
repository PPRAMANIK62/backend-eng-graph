---
id: man7-fsync
title: fsync(2), Linux manual page
author: Michael Kerrisk and man-pages contributors
url: https://man7.org/linux/man-pages/man2/fsync.2.html
published: 2026-02-08
accessed: 2026-09-28
kind: docs
primary: true
---

## Summary

The Linux man page for fsync and fdatasync (man-pages 6.19). What they
flush, what they don't (the directory entry), and how write-back errors
are reported.

## Key claims

- fsync writes the file's modified cached data to the device so it survives a crash, including flushing the disk's cache, and blocks until the device says it's done. "This includes writing through or flushing a disk cache if present." (DESCRIPTION)
- It blocks until the device reports completion. "The call blocks until the device reports that the transfer has completed." (DESCRIPTION)
- fsync also flushes the file's metadata (inode). "fsync() also flushes the metadata information associated with the file" (DESCRIPTION)
- fsync on a file doesn't make its directory entry durable; fsync the directory too. "For that an explicit fsync() on a file descriptor for the directory is also needed." (DESCRIPTION)
- fdatasync skips metadata not needed to read the data back (timestamps) but includes size changes. "a change to the file size (st_size, as made by say ftruncate(2)), would require a metadata flush." (DESCRIPTION)
- fdatasync exists to cut disk activity. "The aim of fdatasync() is to reduce disk activity for applications that do not require all metadata to be synchronized with the disk." (DESCRIPTION)
- EIO can be about data written through another descriptor; since Linux 4.13 write-back errors go to every fd that might have written the data. "Since Linux 4.13, errors from write-back will be reported to all file descriptors that might have written the data which triggered the error." (ERRORS, EIO)
- Most local filesystems report the error to all fds open on the file when it was recorded. "Other filesystems (e.g., most local filesystems) will report errors to all file descriptors that were open on the file when the error was recorded." (ERRORS, EIO)
- Old kernels and lesser used filesystems didn't flush disk caches. "The fsync() implementations in older kernels and lesser used filesystems do not know how to flush disk caches." (HISTORY)
- In Linux 2.2 and earlier fdatasync was the same as fsync. (HISTORY)

## Visuals worth redrawing

None.

## My notes

- The man page doesn't say what happens to the dirty pages after an EIO.
  That's in postgres-wiki-fsync-errors and rebello-fsync-failures-2020.
