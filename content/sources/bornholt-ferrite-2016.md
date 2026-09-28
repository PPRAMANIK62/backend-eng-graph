---
id: bornholt-ferrite-2016
title: Specifying and Checking File System Crash-Consistency Models
author: James Bornholt, Antoine Kaufmann, Jialin Li, Arvind Krishnamurthy, Emina Torlak, Xi Wang
url: https://jamesbornholt.com/papers/ferrite-asplos16.pdf
published: 2016-04
accessed: 2026-09-28
kind: paper
primary: true
---

## Summary

ASPLOS 2016 paper that treats a file system's behavior across crashes like
a CPU's memory model: small litmus tests say which outcomes are allowed,
and formal specs describe the whole model. The FERRITE toolkit runs litmus
tests against specs and real file systems, and finds unintuitive ext4
behaviors.

## Key claims

- POSIX doesn't say what can happen after a crash. "But the POSIX file system interfaces do not define the possible outcomes of a crash." (Abstract)
- Crash-consistency models are like memory consistency models. "crash-consistency models, analogous to memory consistency models, which describe the behavior of a file system across crashes." (Abstract)
- A litmus test is a small program showing an allowed or forbidden outcome. "Litmus tests: small programs that demonstrate allowed or forbidden behaviors of file systems across crashes" (§1)
- The replace-via-rename pattern caused the 2009 ext4 incident. "A common replace-via-rename pattern (a) caused the 'ext4 data loss' incident of 2009" (Figure 1 caption)
- In that pattern the rename can reach disk before the data. "In this case, the rename can reach the disk before the writes." (§1)
- Adding fsync before close gives old-or-new. "One possible fix is to add an fsync(fd) before close to ensure atomicity: applications will see either the old or the new data." (§1)
- File system developers argue the reordering is allowed and needed for speed. "file system developers argue that this behavior is allowed by POSIX and, as with relaxed memory orderings, is necessary for performance" (§1)
- ext4 allows rename to be reordered across a write. "The ext4 file system, however, implements a weaker model, which allows rename to be reordered across a write." (§1)
- POSIX's rationale for fsync is the one clear crash promise: data up to the fsync is recorded on disk. "assure that after a system crash or other failure that all data up to the time of the fsync() call is recorded on the disk." (§2, quoting POSIX)
- POSIX is mostly silent on crash guarantees beyond fsync. "But POSIX is largely silent on crash guarantees of calls other than fsync." (§2)
- POSIX rename atomicity is about the no-crash case. "the standard requires rename to be atomic, in the sense that when there is no crash, reading from the destination path can return only the old or new file content" (§2)
- Possible on-disk outcomes of the rename pattern include old, empty, partial and new. (Figure 1c)

## Visuals worth redrawing

- Figure 1: the replace-via-rename code, its ordering edges, and the list of crash outcomes (old, empty, partial, new). Good for `atomic-rename` and `crash-consistency`.

## My notes

- PDF first page: "ASPLOS '16 April 2–6, 2016, Atlanta, Georgia, USA".
