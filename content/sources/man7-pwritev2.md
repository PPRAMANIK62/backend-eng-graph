---
id: man7-pwritev2
title: readv(2) / pwritev2(2), Linux manual page (RWF_ATOMIC)
author: Michael Kerrisk and man-pages contributors
url: https://man7.org/linux/man-pages/man2/pwritev2.2.html
published: 2026-02-22
accessed: 2026-09-28
kind: docs
primary: true
---

## Summary

The Linux man page for readv, writev, preadv, pwritev, preadv2 and
pwritev2 (man-pages 6.19). Used for the `RWF_ATOMIC` flag, Linux's API for
writes that are protected from tearing.

## Key claims

- RWF_ATOMIC exists since Linux 6.11. "RWF_ATOMIC (since Linux 6.11)" (DESCRIPTION, preadv2() and pwritev2(), flags)
- It asks for torn-write protection on regular files in block-based filesystems. "Requires that writes to regular files in block-based filesystems be issued with torn-write protection." (RWF_ATOMIC)
- Torn-write protection means all or nothing, never a mix. "all or none of the data from the write will be stored, but never a mix of old and new data." (RWF_ATOMIC)
- Only for pwritev2, and only for the range that call writes. "This flag is meaningful only for pwritev2(), and its effect applies only to the data range written by the system call." (RWF_ATOMIC)
- Length must be a power of two between stx_atomic_write_unit_min and _max. "The total write length must be power-of-2 and must be sized in the range [stx_atomic_write_unit_min, stx_atomic_write_unit_max]." (RWF_ATOMIC)
- The offset must be naturally aligned: 32 KiB at 32 KiB is fine, 32 KiB at 48 KiB is not. "a write of length 32KiB at a file offset of 32KiB is permitted, however a write of length 32KiB at a file offset of 48KiB is not permitted." (RWF_ATOMIC)
- Only with O_DIRECT; buffered writes aren't supported. "Torn-write protection only works with O_DIRECT flag, that is, buffered writes are not supported." (RWF_ATOMIC)
- Durability still needs O_SYNC or O_DSYNC (or equivalent). "O_SYNC or O_DSYNC must be specified for open(2)." (RWF_ATOMIC)

## Visuals worth redrawing

None.

## My notes

- The URL is the pwritev2 alias; the page itself is titled readv(2).
- The page says "regular files in block-based filesystems", not which
  filesystems. LWN (2025-02-20) says ext4 and XFS support came in 6.13;
  I haven't found anything on btrfs.
