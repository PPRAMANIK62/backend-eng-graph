---
id: kafka-storage-log-code
title: Kafka storage log package source (Apache Kafka 4.3.0)
author: Apache Kafka project
url: https://github.com/apache/kafka/tree/4.3.0/storage/src/main/java/org/apache/kafka/storage/internals/log
kind: code
primary: true
---

## Summary

The Java package in Kafka 4.3.0 that holds a partition's log:
LogSegment (a data file plus its indexes), LogSegments (the map of
segments by base offset), OffsetIndex (the sparse offset-to-position
index), SkimpyOffsetMap (the compaction map), and the producer state
used to drop duplicate batches (ProducerStateManager, ProducerStateEntry,
ProducerAppendInfo, UnifiedLog), plus LogFileUtils and TimeIndex. Read at tag 4.3.0.

## Key claims

- A segment is a data file plus an index from logical offsets to file positions. "Each segment has two components: a log and an index." / "The index is an OffsetIndex that maps from logical offsets to physical file positions." (LogSegment.java, class comment)
- File names. "A segment with a base offset of [base_offset] would be stored in two files, a [base_offset].index and a [base_offset].log file." (LogSegment.java, class comment)
- Segments also have a time index. `private final LazyIndex<TimeIndex> lazyTimeIndex;` (LogSegment.java)
- Segments are kept in a sorted map keyed by base offset, and a lookup takes the floor entry. "the segments of the log with key being LogSegment base offset and value being a LogSegment" and `segments.floorEntry(offset)` (LogSegments.java)
- The offset index is sparse. "This index may be sparse: that is it may not hold an entry for all messages in the log." (OffsetIndex.java, class comment)
- Each index entry is 8 bytes: a 4-byte offset relative to the segment's base offset, and a 4-byte file position. "The physical format is a 4 byte "relative" offset and a 4 byte file location for the message with that offset." (OffsetIndex.java, class comment)
- Worked example of relative offsets. "So, for example, if the base offset was 50, then the offset 55 would be stored as 5." (OffsetIndex.java, class comment)
- Lookups binary-search a memory map of the index for the greatest entry at or below the target. "The index supports lookups against a memory-map of this file. These lookups are done using a simple binary search variant to locate the offset/location pair for the greatest offset less than or equal to the target offset." (OffsetIndex.java, class comment)
- The index has no checksum and is rebuilt after a crash. "No attempt is made to checksum the contents of this file, in the event of a crash it is rebuilt." (OffsetIndex.java, class comment)
- A read looks up the index, then scans the data file forward from that position. `return log.searchForOffsetFromPosition(offset, Math.max(mapping.position(), startingFilePosition));` (LogSegment.java, translateOffset)
- An index entry is added once more than index-interval bytes were appended since the last one. `if (bytesSinceLastIndexEntry > indexIntervalBytes) {` (LogSegment.java, append)
- The compaction map stores a hash of each key, not the key, and entries can't be deleted. "This hash table uses a cryptographically secure hash of the key as a proxy for the key for comparisons and to save space on object overhead." (SkimpyOffsetMap.java, class comment)
- Default hash is MD5; an entry is the hash plus an 8-byte offset. "Create an instance of SkimpyOffsetMap with the default hash algorithm (MD5)." and "the number of bytes in the hash plus an 8 byte offset" (SkimpyOffsetMap.java)
- The broker keeps metadata for at most 5 recent batches per producer. `public static final int NUM_BATCHES_TO_RETAIN = 5;` (ProducerStateEntry.java)
- A batch is a duplicate if its epoch matches and its first and last sequence match a cached batch. "Return the batch metadata of the cached batch having the exact sequence range, if any." (ProducerStateEntry.java, batchWithSequenceRange)
- On a duplicate, the broker answers with the offsets of the batch it already wrote. "If we find a duplicate, we return the metadata of the appended batch to the client." (UnifiedLog.java, analyzeAndValidateProducerState)
- The next batch's first sequence must be exactly one more than the last, wrapping to 0 after the int maximum. `return nextSeq == lastSeq + 1L || (nextSeq == 0 && lastSeq == Integer.MAX_VALUE);` (ProducerAppendInfo.java, inSequence)
- A gap raises OutOfOrderSequenceException. "Out of order sequence number for producer " (ProducerAppendInfo.java, checkSequence)
- If the producer's state is gone (e.g. its records were deleted by retention), any sequence is accepted. "If there is no current producer epoch (possibly because all producer records have been deleted due to" (ProducerAppendInfo.java, checkSequence)

- File name suffixes in a partition directory: `".log"`, `".index"`, `".timeindex"`, `".snapshot"` (producer state), `".cleaned"` and `".swap"` (compaction). "Suffix of a temporary file that is being used for log cleaning" / "Suffix of a temporary file used when swapping files into the log" (LogFileUtils.java)
- The time index maps timestamps to offsets, sparse, 12-byte entries. "An index that maps from the timestamp to the logical offsets of the messages in a segment." / "The index is stored in a file that is preallocated to hold a fixed maximum amount of 12-byte time index entries." (TimeIndex.java, class comment)
- The broker keeps per-producer state: last sequence, epoch, last offset. "Maintains a mapping from ProducerIds to metadata about the last appended entries" (ProducerStateManager.java, class comment)
- The epoch fences zombie writers. "The epoch is used for fencing against zombie writers." (ProducerStateManager.java, class comment)
- Producer IDs expire from disuse or when their last entry is deleted; compaction keeps each producer's latest entry. "producer ids can be expired due to lack of recent use or if the last written entry has been deleted from the log" / "For compacted topics, the log cleaner will ensure that the most recent entry from a given producer id is retained in the log provided it hasn't expired due to age." (ProducerStateManager.java, class comment)

## Visuals worth redrawing

- The .log and .index pair with sparse entries pointing into the data
  file. Our own drawing.

## My notes

- The docs page kafka-implementation-log is older than this code in
  places; prefer the code for the index format.
