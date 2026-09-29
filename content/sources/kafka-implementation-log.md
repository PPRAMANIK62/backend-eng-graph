---
id: kafka-implementation-log
title: Implementation, Log (Apache Kafka 4.3 docs)
author: Apache Kafka project
url: https://kafka.apache.org/43/implementation/log/
kind: docs
primary: true
---

## Summary

The Kafka 4.3 docs page on how a partition's log is laid out on disk:
one directory per partition, segment files named by the first offset
they hold, appends to the last file, rolling at a size limit, reads
that find the segment first, deletes one whole segment at a time, and
the recovery check on startup. Parts of it are old text that no longer
matches the code (see My notes).

## Key claims

- One directory per partition. "A log for a topic named “my-topic” with two partitions consists of two directories (namely my-topic-0 and my-topic-1) populated with data files containing the messages for that topic." (Log)
- Each segment file is named after the first offset it contains. "Each log file is named with the offset of the first message it contains." (Log)
- The first file name. "So the first file created will be 00000000000000000000.log" (Log)
- Offsets were chosen over producer-made GUIDs to avoid a heavy index. "the complexity of maintaining the mapping from a random id to an offset requires a heavy weight index structure which must be synchronized with disk" (Log)
- Appends always go to the last file, which rolls at a size limit. "The log allows serial appends which always go to the last file. This file is rolled over to a fresh file when it reaches a configurable size (say 1GB)." (Writes)
- A read first finds the segment, then the position inside it. "The actual process of reading from an offset requires first locating the log segment file in which the data is stored, calculating the file-specific offset from the global offset value, and then reading from that file offset." (Reads)
- A consumer that asks for an offset that no longer exists gets an error and must reset or fail. "when the client attempts to consume a non-existent offset it is given an OutOfRangeException and can either reset itself or fail as appropriate to the use case." (Reads)
- Data is deleted one segment at a time, by time or size. "Data is deleted one log segment at a time. The log manager applies two metrics to identify segments which are eligible for deletion: time and size." (Deletes)
- A segment's age is its newest record's timestamp. "the largest timestamp in a segment file (order of records is not relevant) defining the retention time for the entire segment." (Deletes)
- Size-based retention is off by default. "Size-based retention is disabled by default." (Deletes)
- Deletes don't block reads: the segment list is copy-on-write. "we use a copy-on-write style segment list implementation that provides consistent views to allow a binary search to proceed on an immutable static snapshot view of the log segments while deletes are progressing." (Deletes)
- On startup, the newest segment is checked entry by entry. "On startup a log recovery process is run that iterates over all messages in the newest log segment and verifies that each message entry is valid." (Guarantees)
- Bad entries are cut off. "In the event corruption is detected the log is truncated to the last valid offset." (Guarantees)
- A crash can add garbage, not only lose data, because the size and the blocks aren't written in order. "the file can gain nonsense data if the inode is updated with a new size but a crash occurs before the block containing that data is written." (Guarantees)
- What "valid" means in recovery: size fits and CRC matches. "A message entry is valid if the sum of its size and offset are less than the length of the file AND the CRC32 of the message payload matches the CRC stored with the message." (Guarantees)
- The stale offset definition the page still carries. "a 64-bit integer offset giving the byte position of the start of this message in the stream of all messages ever sent to that topic on that partition." (Log)

## Visuals worth redrawing

None on the page. A segment chain (files named by base offset, the
last one active) is our own drawing.

## My notes

- Stale in places. It says an offset gives "the byte position of the
  start of this message", but offsets have been logical numbers per
  record for a long time; the code (kafka-storage-log-code) maps
  logical offsets to byte positions through an index file. It also
  describes the segment lookup as an "in-memory range" and doesn't
  mention the .index files. Use the code for the index.
