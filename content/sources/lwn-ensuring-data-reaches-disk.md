---
id: lwn-ensuring-data-reaches-disk
title: Ensuring data reaches disk
author: Jeff Moyer
url: https://lwn.net/Articles/457667/
published: 2011-09-07
accessed: 2026-09-28
kind: blog
primary: true
---

## Summary

A Red Hat storage developer walks data from an application buffer down
to stable storage, naming every place it can sit: application buffers,
C library buffers, the page cache, and the drive's volatile cache. Then
gives rules for when and how to fsync. Old (2011), but the model holds.

## Key claims

- Data passes through application buffers, library buffers, the page cache, and the device's cache before stable storage. "Data can travel through several layers before it finally reaches stable storage" (I/O buffering)
- Dirty pages can stay in the page cache for an unknown time. "Dirty pages can live in the page cache for an indeterminate amount of time, depending on overall system load and I/O patterns." (I/O buffering)
- The drive may hold data in a volatile cache that's lost on power loss. "If power is lost while data is in this cache, the data will be lost." (I/O buffering)
- With C stdio, fflush moves data to the kernel, then fsync moves it to stable storage. "On line 23, the file stream is flushed, causing the data to move into the" kernel layer. (I/O buffering, code walk-through)
- O_DIRECT skips the page cache but you still need fsync because of the drive cache. "fsync() is still required for files opened with O_DIRECT" (I/O APIs)
- O_SYNC writes data and all metadata synchronously; O_DSYNC only data and the metadata needed to read it. "O_DSYNC: Only file data and metadata needed to access the file data are written synchronously to disk." (I/O APIs)
- Decide by asking whether the data must survive now: scratch or regenerable data may not need fsync; transactions and config files do. "is it important that this data is saved now to stable storage?" (When Should You Fsync?)
- A new file may also need its directory fsynced; this depends on filesystem and mount options. "This behavior is actually file system (and mount option) dependent." (When Should You Fsync?)
- Safe overwrite: temp file, write, fsync, rename, fsync directory. "create a new temp file (on the same file system!)" (When Should You Fsync?)
- Overwriting a file in place risks losing the existing data on power loss, ENOSPC or an I/O error; the temp-file-and-rename update gives readers one copy or the other. "if you encounter a system failure (such as power loss, ENOSPC or an I/O error) while overwriting a file, it can result in the loss of existing data." (When Should You Fsync?) [added for atomic-rename]
- For portability, fsync the directory rather than coding per file system. "just perform fsync() calls on the directories to ensure that your code is portable." (When Should You Fsync?) [added for atomic-rename]
- Write errors often show up only at fsync, msync or close, so check their return values. "Errors from writes are instead often reported during calls to fsync(), msync() or close()." (Checking For Errors)
- Applications can't see whether the drive cache is volatile, so assume it is. "It is best to assume a volatile cache, and program defensively." (Write-Back Caches)
- With barriers turned off (`nobarrier`), fsync doesn't flush the disk cache. "When barriers are disabled for a file system, it means that fsync calls will not result in the flushing of disk caches." (Write-Back Caches)
- (added in review) The barrier mount options applied to ext3, ext4, xfs and btrfs as of 2.6.35. "For ext3, ext4, xfs and btrfs as of kernel version 2.6.35, the mount option is \"-o barrier\" to turn barriers (write-back cache flushes) on (the default)" (Write-Back Caches)

## Visuals worth redrawing

- The layer diagram (application, library, kernel page cache, device
  cache, stable storage). Redraw as the main fsync figure.

## My notes

- 2011: the barrier mount options it names are from kernel 2.6.35; don't
  repeat those as current.
