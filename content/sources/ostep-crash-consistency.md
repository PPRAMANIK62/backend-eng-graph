---
id: ostep-crash-consistency
title: "Crash Consistency: FSCK and Journaling (Operating Systems: Three Easy Pieces, chapter 42)"
author: Remzi H. Arpaci-Dusseau, Andrea C. Arpaci-Dusseau
url: https://pages.cs.wisc.edu/~remzi/OSTEP/file-journaling.pdf
published: 2023-11
accessed: 2026-09-28
kind: book
primary: false
---

## Summary

Textbook chapter (OSTEP v1.10) on how a file system keeps its own
structures consistent when power fails in the middle of an update.
Works through one append that needs three block writes, lists what each
partial outcome looks like, then covers fsck, data journaling, metadata
(ordered) journaling, and briefly soft updates and copy-on-write.

## Key claims

- A single append needs three writes: the data block, the inode, the data bitmap. (§42.1, "Db", "I[v2]", "B[v2]")
- Each partial outcome is different: data only (no harm, just lost), inode only (points at garbage, bitmap disagrees), bitmap only (space leak), and so on. (§42.1, list of crash scenarios)
- Inode and bitmap written without data looks consistent but points to garbage. "the file system metadata is completely consistent" (§42.1)
- The goal is to move from one consistent state to another atomically. "What we'd like to do ideally is move the file system from one consistent state ... to another atomically" (§42.1)
- The name. "We call this general problem the crash-consistency problem" (§42.1)
- fsck scans everything after a crash and repairs inconsistencies, but can't fix a consistent-looking inode pointing at garbage. "such an approach can't fix all problems" (§42.2)
- fsck is too slow on big disks. "they are too slow." (§42.2)
- Journaling is write-ahead logging: write a note describing the update first. "Writing this note is the 'write ahead' part" (§42.3)
- Journal protocol: write TxB and contents, wait; write TxE commit block, wait; then checkpoint to final locations. "Journal commit: Write the transaction commit block (containing TxE) to the log; wait for write to complete" (§42.3)
- Writing all five blocks at once is unsafe: the disk may write TxE before the data, and recovery would replay garbage. "it will replay this transaction, and ignorantly copy the contents of the garbage block" (§42.3)
- The disk guarantees 512-byte writes are atomic, so the commit block should be one 512-byte block. "the disk guarantees that any 512-byte write will either happen or not (and never be half-written)" (§42.3)
- A checksum over the transaction lets you write it all at once; a mismatch on recovery means the crash hit mid-write and the update is discarded. "if, during recovery, the file system sees a mismatch in the computed checksum versus the stored checksum in the transaction, it can conclude that a crash occurred during the write" (§42.3, Aside: Optimizing Log Writes)
- Recovery replays committed transactions (redo logging); a crash before commit means the update is skipped. "the pending update is simply skipped." (§42.3, Recovery)
- Replaying the same writes twice during recovery is harmless. "some of these updates are simply performed again during recovery." (§42.3)
- Ordered (metadata) journaling writes data to its final place first and journals only metadata; it's the common form. "given that most I/O traffic to the disk is data, not writing data twice substantially reduces the I/O load" (§42.3)
- Journaling cuts recovery from the size of the disk to the size of the log. "Journaling reduces recovery time from O(size-of-the-disk-volume) to O(size-of-the-log)" (§42.5)
- Other approaches: Soft Updates orders every write; copy-on-write never overwrites in place and flips a root pointer. "This technique never overwrites files or directories in place" (§42.4)
- (added for filesystem) Data journaling writes every data block twice, which halves sequential write bandwidth. "this doubling is especially painful during sequential write workloads, which now will proceed at half the peak write bandwidth of the drive." (§42.3, Metadata Journaling)
- The rule behind ordered mode: write the thing pointed to before the pointer. "this rule of 'write the pointed-to object before the object that points to it' is at the core of crash consistency" (§42.3, Metadata Journaling)
- Metadata journaling is more common than data journaling; NTFS and XFS use it. "For example, Windows NTFS and SGI's XFS both use some form of metadata journaling." (§42.3)
- All ext3 modes keep metadata consistent; they differ only for data. "All of these modes keep metadata consistent; they vary in their semantics for data." (§42.3)
- A journal is reused circularly once transactions are checkpointed. "enables re-use of the log in a circular fashion" (§42.3, Making The Log Finite)
- COW file systems flip the root to point at the new structures. "COW file systems flip the root structure of the file system to include pointers to the newly updated structures." (§42.4)

## Visuals worth redrawing

- The tiny file system (inode bitmap, data bitmap, 8 inodes, 8 blocks) before and after the append. (§42.1)
- The journal layout `TxB I[v2] B[v2] Db TxE` and the metadata-only `TxB I[v2] B[v2] TxE`. (§42.3)

## My notes

- The 512-byte atomic claim is about disks as the book models them; see `torn-writes` for what drives actually promise.
