---
id: kernelnewbies-linux-3-18
title: Linux 3.18
author: KernelNewbies
url: https://kernelnewbies.org/Linux_3.18
kind: docs
primary: false
---

## Summary

The KernelNewbies release summary for Linux 3.18, the release that
merged overlayfs.

## Key claims

- Linux 3.18 added overlayfs. "This release adds support for overlayfs, which allows to combine two filesystem in a single mount point" (Summary)
- The classic use was live CDs. "it is most often used for live CDs, where a read-only OS image is used as lower filesystem and a writeable RAM-backed filesystem is used as the upper one." (1.1. Overlayfs)
- After open, operations go straight to the underlying filesystem. "Overlayfs differs from other "union filesystem" implementations in that after a file is opened all operations go directly to the underlying, lower or upper, filesystems." (1.1. Overlayfs)

## Visuals worth redrawing

None.

## My notes

- Earlier union filesystems (unionfs, aufs) never made it into mainline.
  That's in LWN's 2010 article on the hybrid union patches, read but not
  cited.
