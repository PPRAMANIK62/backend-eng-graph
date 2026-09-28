---
id: pillai-alice-2014
title: "All File Systems Are Not Created Equal: On the Complexity of Crafting Crash-Consistent Applications"
author: Thanumalayan Sankaranarayana Pillai, Vijay Chidambaram, Ramnatthan Alagappan, Samer Al-Kiswany, Andrea C. Arpaci-Dusseau, Remzi H. Arpaci-Dusseau
url: https://www.usenix.org/conference/osdi14/technical-sessions/presentation/pillai
kind: paper
primary: true
---

## Summary

An OSDI 2014 paper showing that applications keep their files consistent
across crashes only by relying on file system behaviors ("persistence
properties") that nobody specifies and that differ between file systems.
Two tools: BOB reorders block traces under six Linux file systems to find
which properties fail; ALICE explores crash states of eleven applications
and finds 60 vulnerabilities. Read from the PDF linked on the USENIX page
(https://www.usenix.org/system/files/conference/osdi14/osdi14-paper-pillai.pdf).

## Key claims

- POSIX describes what a call does in memory, not what's on disk after a crash. "specifications of how disk state is mutated in the event of a crash are widely misunderstood and debated" (§1)
- Making every change synchronous would be simple but too slow, so apps build complex update protocols. "such an approach is prohibitively slow" (§1)
- Persistence properties come in two kinds: atomicity and ordering. "They break down into two global categories: the atomicity of operations ... and the ordering of operations" (§1)
- 60 vulnerabilities across eleven systems (LevelDB, GDBM, LMDB, SQLite, PostgreSQL, HSQLDB, Git, Mercurial, HDFS, ZooKeeper, VMware Player). "find a total of 60 vulnerabilities, many of which lead to severe consequences." (Abstract, §1)
- Roughly half show up on real file systems (ext3, ext4, btrfs). "many of these vulnerabilities (roughly half) manifest on current file systems" (§1)
- 7 of 11 apps have trouble recovering if system calls aren't persisted in order. "7 of the 11 tested applications have trouble properly recovering from a crash." (§1)
- 10 of 11 apps expect some file system updates to be atomic. "10 of the 11 applications expect atomicity of filesystem updates." (§1)
- Git example: appends must reach disk before a rename, or later commits fail. "if the appends are not persisted before the rename, any further commits to the repository fail." (Figure 1 caption)
- Example difference: appends to one file persist before a later rename of another on ext3 ordered mode, but not on ext4 unless an option is set. "appends to file A are persisted before a later rename of file B in the ordered journaling mode of ext3, but not in the same mode of ext4" (§1)
- A non-atomic append can leave the file size updated but garbage in the new bytes. "it would be possible for the size of the file to be updated without the new data reflected to disk; in this case, the files could contain garbage" (§2.1)
- File systems don't provide atomic multi-block appends. "Current file systems do not provide atomic multi-block appends" (§2.2.1)
- Single-sector overwrites looked atomic on all tested file systems, sometimes only because the disk provides it. (§2.2.1)
- Even with delayed allocation, appends to the same file persist in order. "Even with delayed allocation, successive appends to the same file are persisted in order." (§2.2.2)
- ext2 and btrfs reorder directory operations freely. "Linux ext2 and btrfs freely reorder directory operations" (§2.2.2)
- No standard exists for these properties; defining them is the first step. "there are currently no standards." and "defining and studying persistence properties is the first step towards standardizing them" (§2)
- File systems studied: ext2, ext3, ext4, btrfs, xfs, reiserfs. (§2.2)
- ext4's delayed allocation broke applications when it was introduced. "when delayed allocation was introduced in Linux ext4, it broke several applications" (§1)

## Visuals worth redrawing

- Figure 2, Crash States: two appends to two files and the intermediate states after a crash (garbage from size-only update, partial data, second append without the first). Main figure for `crash-consistency`.
- Figure 1: Git update protocol with ordering arrows.

## My notes

- The PDF footer reads "… • Broomfield, CO" with the 2014 conference dates. The USENIX session page shows an earlier 2014 date (likely the posting date).
