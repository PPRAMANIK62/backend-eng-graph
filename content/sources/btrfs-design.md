---
id: btrfs-design
title: Btrfs design
author: btrfs developers (btrfs documentation)
url: https://btrfs.readthedocs.io/en/latest/dev/dev-btrfs-design.html
published: unknown
accessed: 2026-09-28
kind: docs
primary: true
---

## Summary

The btrfs developer docs on the design: everything is stored in B-trees of
keys and items, data and metadata are protected by copy-on-write, and a
transaction commits by flushing new tree blocks and then writing a
superblock that points to the new root. Snapshots share blocks through
reference counts.

## Key claims

- The copy-on-write design comes from Ohad Rodeh's 2006 IBM work on B-trees, shadowing and clones. "The copy-on-write architecture is based on white paper from Ohad Rodeh" (intro)
- The btree knows only keys, items and a block header. "Internally it only knows about three data structures: keys, items, and a block header" (Btree data structures)
- Each block header has a checksum and a generation (the transaction that allocated it). "The generation field corresponds to the transaction id that allocated the block" (Btree data structures)
- Large files are stored in extents; a rewrite in the middle of an extent can split it into three records. "writing 1MB into the middle of a existing 128MB extent may result in three extent records" (Btree data structures)
- File data checksums live in their own btree, computed after compression. "The data is checksummed after compression is done and it reflects the bytes sent to the disk." (Btree data structures)
- The superblock points to the root tree, which points to the extent trees and subvolumes. "The super block points to the root tree, and the root tree points to the extent trees and subvolumes." (Btree roots)
- Data and metadata are protected by copy-on-write: new writes go to new blocks, and pointers up to the superblock are updated. "any new writes to that logical address in the file or btree will go to a newly allocated block" (Copy on write logging)
- Freed blocks aren't reused until the transaction that freed them commits. "These blocks are not reused for other purposes until the transaction that freed them commits." (Copy on write logging)
- Commit order: flush tree blocks, then write the superblock. "The updated btree blocks are all flushed to disk, and then the super block is updated to point to the new root tree." (Copy on write logging)
- The transaction is complete once the superblock is on disk. "Once the super block has been properly written to disk, the transaction is considered complete." (Copy on write logging)
- Snapshots share blocks; a snapshot of an unchanged subvolume points at the same root block. "both point tree to the same root block on disk." (Btree roots)
- Subvolume trees are reference counted; COW of a node raises the counts of everything it points to. "When a COW operation is performed on a btree node, the reference count of all the blocks it points to is increased by one." (Copy on write logging)

## Visuals worth redrawing

- The tree of roots: superblock → root tree → extent tree and subvolume
  trees, with a snapshot sharing a root block. (Btree roots)
- A COW update: changing one leaf copies the path up to the root. (Copy
  on write logging, described in text)

## My notes

- The page doesn't mention the log tree used for fsync. Don't describe it
  without a source.
- The main btrfs paper (Rodeh, Bacik, Mason, ACM TOS 2013) couldn't be
  opened on 2026-09-28.
