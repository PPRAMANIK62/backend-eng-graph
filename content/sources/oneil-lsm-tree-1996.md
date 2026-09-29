---
id: oneil-lsm-tree-1996
title: The Log-Structured Merge-Tree (LSM-Tree)
author: Patrick O'Neil, Edward Cheng, Dieter Gawlick, Elizabeth O'Neil
url: https://www.cs.umb.edu/~poneil/lsmtree.pdf
kind: paper
primary: true
---

## Summary

The paper that named the LSM tree (Acta Informatica, 1996; this is the
authors' preprint). It targets indexes on tables with a very high
insert rate, like a transaction history, where a B-tree would double
the I/O of every transaction. Inserts go into a memory-resident tree C0;
a "rolling merge" moves ranges of entries out into a larger disk tree
C1 (and on into C2, ...), using large sequential multi-page writes.

## Key claims

- The problem: a B-tree index on a fast-growing table is expensive. "standard disk-based index structures such as the B-tree will effectively double the I/O cost of the transaction to maintain an index such as this in real time" (abstract)
- The core idea: defer and batch index changes. "The LSM-tree uses an algorithm that defers and batches index changes, cascading the changes from a memory-based component through one or more disk components in an efficient manner reminiscent of merge sort." (abstract)
- The trade: finds can get slower. "indexed finds requiring immediate response will lose I/O efficiency in some cases, so the LSM-tree is most useful in applications where index inserts are more common than finds that retrieve the entries." (abstract)
- Two components: C0 in memory, C1 on disk. "A two component LSM-tree has a smaller component which is entirely memory resident, known as the C0 tree (or C0 component), and a larger component which is resident on disk, known as the C1 tree (or C1 component)." (section 2)
- The log record is written first, then the entry goes into C0; recovery rebuilds C0 from the log. "As each new History row is generated, a log record to recover this insert is first written to the sequential log file in the usual way." (section 2)
- Inserting into C0 costs no I/O. "The operation of inserting an index entry into the memory resident C0 tree has no I/O cost." (section 2)
- C0 is small because memory costs more than disk; a rolling merge moves entries out when it nears its size limit. "whenever the C0 tree as a result of an insert reaches a threshold size near the maximum allotted, an ongoing rolling merge process serves to delete some contiguous segment of entries from the C0 tree and merge it into the C1 tree on disk." (section 2)
- C1 is a B-tree-like structure packed full and written in multi-page blocks. "The C1 tree has a comparable directory structure to a B-tree, but is optimized for sequential disk access, with nodes 100% full" (section 2)
- Merged blocks go to new disk space, not over the old ones. "the block is written to a new free area on disk." (section 2)
- A find searches C0, then C1. "first the C0 tree and then the C1 tree is searched for the value or values desired." (section 2.2)
- With more components, a find may have to look at each one. "it is necessary for an exact-match find or range find to access each component Ci through its index structure." (section 2.2)
- Deletes are deferred too, as delete entries that cancel the real entry during a merge. "we say the delete node entry migrates out to larger components during merge and annihilates the associated entry when it is encountered." (section 2.3)
- Finds must filter through delete entries meanwhile. "In the meantime, find requests must be filtered through delete node entries so as to avoid returning references to deleted records." (section 2.3)

## Visuals worth redrawing

- Figure 2.1: C0 in memory, C1 on disk.
- Figure 3.1 (not used): the multi-component tree C0 ... CK.

## My notes

- The year and journal come from the paper's own header ("To be
  published: Acta Informatica") and from the reference list in
  luo-lsm-survey-2019 ("proposed in 1996").
- The rolling merge isn't what today's engines do; see the survey.
