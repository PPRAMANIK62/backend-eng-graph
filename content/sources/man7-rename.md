---
id: man7-rename
title: rename(2), Linux manual page
author: Michael Kerrisk and man-pages contributors
url: https://man7.org/linux/man-pages/man2/rename.2.html
kind: docs
primary: true
---

## Summary

The Linux man page for rename, renameat and renameat2 (Linux man-pages
6.19). Defines atomic replacement for other processes, the flags
RENAME_NOREPLACE, RENAME_EXCHANGE and RENAME_WHITEOUT, and the errors.
Says nothing about what's on disk after a power loss.

## Key claims

- Replacing an existing name is atomic for other processes. "If newpath already exists, it will be atomically replaced, so that there is no point at which another process attempting to access newpath will find it missing." (DESCRIPTION)
- Both names may briefly point at the file. "there will probably be a window in which both oldpath and newpath refer to the file being renamed." (DESCRIPTION)
- rename doesn't work across mounts. "EXDEV oldpath and newpath are not on the same mounted filesystem." (ERRORS)
- RENAME_EXCHANGE swaps two paths atomically; RENAME_NOREPLACE fails with EEXIST if the target exists and needs file system support. (DESCRIPTION, renameat2 flags; ERRORS)
- The only crash mentioned is an NFS server crash causing a retried RPC to fail. "The application is expected to deal with this." (BUGS)

## Visuals worth redrawing

None.

## My notes

- The atomicity is about what other processes see while the system runs. Durability needs fsync on the file and the directory; see `lwn-ensuring-data-reaches-disk` and `bornholt-ferrite-2016`.
