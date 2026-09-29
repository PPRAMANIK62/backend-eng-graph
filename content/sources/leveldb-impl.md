---
id: leveldb-impl
title: leveldb Implementation notes (doc/impl.md)
author: LevelDB authors (Google)
url: https://github.com/google/leveldb/blob/main/doc/impl.md
kind: docs
primary: true
---

## Summary

LevelDB's own description of its files and compactions: the log and
memtable, sorted tables (.ldb) in levels, level 0 with overlapping
files, level sizes growing 10x, how a compaction picks files, how
deletion markers are dropped, the MANIFEST and CURRENT files, and
recovery.

## Key claims

- Modelled on a Bigtable tablet. "The implementation of leveldb is similar in spirit to the representation of a single [Bigtable tablet (section 5.3)]" (Files)
- The log becomes a sorted table at about 4 MB. "When the log file reaches a pre-determined size (approximately 4MB by default), it is converted to a sorted table (see below) and a new log file is created for future updates." (Log files)
- The memtable mirrors the log and is read first. "A copy of the current log file is kept in an in-memory structure (the `memtable`). This copy is consulted on every read so that read operations reflect all logged updates." (Log files)
- Sorted tables hold values and deletion markers. "Each entry is either a value for the key, or a deletion marker for the key." (Sorted tables)
- Why deletion markers stay. "(Deletion markers are kept around to hide obsolete values present in older sorted tables)." (Sorted tables)
- Level 0 compacts into level 1 when it has more than four files. "When the number of young files exceeds a certain threshold (currently four), all of the young files are merged together with all of the overlapping level-1 files to produce a sequence of new level-1 files (we create a new level-1 file for every 2MB of data.)" (Sorted tables)
- Level 0 files overlap; other levels don't. "Files in the young level may contain overlapping keys. However files in other levels have distinct non-overlapping key ranges." (Sorted tables)
- Level sizes: 10^L MB. "When the combined size of files in level-L exceeds (10^L) MB (i.e., 10MB for level-1, 100MB for level-2, ...), one file in level-L, and all of the overlapping files in level-(L+1) are merged to form a set of new files for level-(L+1)." (Sorted tables)
- Only bulk I/O. "These merges have the effect of gradually migrating new updates from the young level to the largest level using only bulk reads and writes (i.e., minimizing expensive seeks)." (Sorted tables)
- The MANIFEST is a log of which tables make up each level. "The MANIFEST file is formatted as a log, and changes made to the serving state (as files are added or removed) are appended to this log." (Manifest)
- Flush steps: new memtable and log, write the old memtable to an sstable, add it to level 0. "Write the contents of the previous memtable to an sstable." (Level 0)
- A partly overlapping next-level file is taken whole. "Note that if a level-L file overlaps only part of a level-(L+1) file, the entire file at level-(L+1) is used as an input to the compaction and will be discarded after the compaction." (Compactions)
- Output files are cut at 2 MB, or earlier if they'd overlap too many grandparent files. "We also switch to a new output file when the key range of the current output file has grown enough to overlap more than ten level-(L+2) files." (Compactions)
- Compactions rotate through the key space. "Compactions for a particular level rotate through the key space." (Compactions)
- What compaction drops. "Compactions drop overwritten values. They also drop deletion markers if there are no higher numbered levels that contain a file whose range overlaps the current key." (Compactions)
- Worst-case cost of one compaction: read 26 MB and write 26 MB (one 2 MB file plus about 12 overlapping next-level files). "The compaction will therefore read 26MB and write 26MB." (Timing)
- If compaction falls behind, level-0 files pile up and reads get slower. "This may significantly increase the cost of reads due to the overhead of merging more files together on every read." (Timing)
- One remedy is slowing writes down. "Solution 2: We might want to decrease write rate artificially when the number of level-0 files goes up." (Timing)
- Recovery: read CURRENT, then the MANIFEST, then turn the log into a new level-0 table. "Convert log chunk to a new level-0 sstable" (Recovery)
- CURRENT names the latest MANIFEST. "CURRENT is a simple text file that contains the name of the latest MANIFEST file." (Current)
- Another remedy for level-0 pile-up is a bigger memtable, at a memory cost. "Solution 1: To reduce this problem, we might want to increase the log switching threshold when the number of level-0 files is large. Though the downside is that the larger this threshold, the more memory we will need to hold the corresponding memtable." (Timing)

## Visuals worth redrawing

None in the doc. A level diagram (L0 overlapping, L1..Ln
non-overlapping, 10x per level) can be drawn from the text.

## My notes

- The timing section assumes 100 MB/s disks (hard-drive era), so its
  seconds aren't useful today. The megabyte counts are.
