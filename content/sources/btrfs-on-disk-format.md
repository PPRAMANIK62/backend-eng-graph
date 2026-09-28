---
id: btrfs-on-disk-format
title: Btrfs on-disk format
author: btrfs developers (btrfs documentation)
url: https://btrfs.readthedocs.io/en/latest/dev/On-disk-format.html
published: unknown
accessed: 2026-09-28
kind: docs
primary: true
---

## Summary

The btrfs developer reference for what's physically on disk: the
superblock and its mirror copies, the trees (root, extent, chunk, dev, FS
trees) and the item types stored in them.

## Key claims

- Apart from the superblock, btrfs is all trees, and the trees are copy-on-write. "Aside from the superblock, Btrfs consists entirely of several trees. The trees use copy-on-write." (Basic structures)
- Btrfs uses logical addresses in its structures; the chunk tree maps them to physical disk offsets. "The chunk tree is used to convert from logical addresses to physical addresses" (Basic structures)
- The primary superblock sits at 64 KiB, with mirrors at 64 MiB and 256 GiB. "The primary superblock is located at 0x10000 (64KiB)." (Superblock)
- Mount reads only the first superblock. "During mount btrfs' kernel module reads only the first super block (at 64KiB), if an error is detected mounting fails." (Superblock)
- Checksum: CRC32c. "Btrfs currently uses the CRC32c little-endian hash function with seed -1." (Superblock, csum_type)
- (added in review) The extent tree tracks allocated extents and block groups. "EXTENT tree (2) ... Holds EXTENT_ITEMs, BLOCK_GROUP_ITEMs" (Objects, Reserved objectids)

## Visuals worth redrawing

None.

## My notes

- The btrfs Introduction page (opened 2026-09-28) lists more checksum
  choices (crc32c, xxhash, sha256, blake2b), so "currently CRC32c" here
  may be the default or out of date. Don't state it as the only option.
