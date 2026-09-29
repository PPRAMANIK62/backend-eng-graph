---
id: log-segments
title: Log segments and retention
depth: short
phase: 10
note: >-
  A log stored as a chain of segment files with an offset index, where
  retention deletes whole old segments. The phase 10 broker's disk
  format.
needs: [append-only-log, log-based-messaging]
leads_to: [log-compaction, consumer-lag]
compare_with: []
---

# Log segments and retention

A log broker like Kafka doesn't keep a partition in one ever-growing
file. It splits it into a chain of segment files, each named after the
first offset it holds, with a small index next to each one. That split
is what makes two jobs cheap: finding a record by its offset, and
throwing old data away.

## From one file to a chain of files

Start with an [[append-only-log]]: records go on the end and are never
changed. A [[log-based-messaging|log-based broker]] keeps one such log
per partition and lets each consumer read from any offset it likes. If
that log were a single file, deleting the oldest week of data would
mean rewriting the file, and finding offset 170,500 would mean
scanning from the start.

So Kafka gives each partition a directory (`my-topic-0`,
`my-topic-1`) and fills it with segments. Only the newest one, the
active segment, takes appends. When it reaches `segment.bytes` (1 GiB
by default in Kafka 4.3), or has been open for `segment.ms` (7 days by
default), the broker closes it and starts a new one. A closed segment
is never written again.

Each segment's file name is the offset of its first record, padded to
20 digits. The first is `00000000000000000000.log`; if the next one
starts at offset 170,410, it's `00000000000000170410.log`. The
directory listing is already a sorted map of where each range of
offsets lives.

## Finding offset N in two steps

Say a consumer asks for offset 170,500.

**Which segment?** The broker keeps its segments in a sorted map keyed
by base offset, and takes the largest base offset that's not above N.
Here that's 170,410.

**Where in the file?** Each segment has a `.index` file beside its
`.log` file. The index is sparse: the broker adds an entry only after
about 4,096 bytes of new data (`index.interval.bytes`), not for every
record. Each entry is 8 bytes: the offset relative to the segment's
base offset (4 bytes) and the byte position in the `.log` file (4
bytes). Storing 90 instead of 170,500 is what lets the offset fit in 4
bytes.

The index file is memory-mapped, and a binary search finds the last
entry at or below the target. From that byte position the broker scans
forward through the `.log` file to the batch holding offset 170,500,
and sends the bytes from there. A sparse index stays small, and the
scan covers only about one index interval of data.

![Three segment files for one partition, named by base offset 0, 170410 and 340820; the last is the active segment taking appends. The oldest is greyed out and marked as deleted whole by retention. For a fetch of offset 170500: step 1 picks segment 170410 as the largest base offset not above 170500; step 2 binary-searches its sparse .index, whose entries are pairs of relative offset and byte position, and finds the entry for relative offset 85; step 3 scans forward in the .log file from that position to the batch holding offset 170500.](img/log-segments-lookup.svg)

*A partition's segments, and the two lookups that find an offset. Layout from the Kafka 4.3 source (LogSegment, OffsetIndex).*

A second index, `.timeindex`, maps timestamps to offsets.

## Retention deletes whole files

Retention never removes single records. It works a segment at a time,
under the default `delete` policy (the other one is [[log-compaction]]):

- **By time.** A segment is expired when its newest record's timestamp
  is older than `retention.ms` (7 days by default in Kafka 4.3).
- **By size.** `retention.bytes` caps each partition (not the whole
  topic); the broker deletes the oldest segment until the partition
  fits. It's off by default.

If both are set, either one can delete a segment. Deleting is just
removing a file (after `file.delete.delay.ms`, a minute by default).
Nothing is rewritten, and readers aren't blocked: the segment list is
copy-on-write, so a fetch that's binary-searching it sees a consistent
snapshot while a delete goes on.

The file is the unit, so segment size sets how precise retention is.
Big segments mean fewer files, but a segment waits for its newest
record to expire, so its oldest records outlive their retention time.
Small segments mean tighter retention and many more files.

A consumer that falls behind retention asks for an offset whose
segment is gone. It gets an out-of-range error and has to reset its
position or fail. That's the practical meaning of `retention.ms`: a
deadline for how far behind [[consumer-lag]] can get.

## Crashes only touch the active segment

Closed segments never change, so after a crash only the active one
can have a torn tail. On startup Kafka walks the newest segment record
by record, checks that each one fits in the file and that its CRC
matches, and cuts the file at the first bad one. That's the same
[[crash-recovery|recovery]] as any append-only log, and it catches both lost data and
garbage a crash can leave when the file size was updated but the
blocks weren't.

The index files carry no checksum at all. They're rebuilt from the
`.log` file after a crash, which is safe because everything in them
can be derived from it.

## Where it gets tricky

**Kafka's own docs are behind the code.** The implementation page
still says an offset is the byte position of a message, and describes
the segment lookup without the `.index` files. Offsets are logical
record numbers, and the index is what maps them to byte positions. Go
by the source.

**Retention is by the newest timestamp.** One record with a late
timestamp keeps its whole segment alive, whatever the order of records
inside it.

## What this means when you build

- Name segment files by their base offset, so opening a partition is a
  directory listing and a sort.
- Keep a sparse index you can rebuild from the log. Then it needs no
  checksum, and losing it in a crash costs a rebuild, not data.
- Make retention delete files, never records. Size segments for how
  precise you want it to be.
- Run crash recovery on the active segment only.

## Further reading

- [Implementation, Log](https://kafka.apache.org/43/implementation/log/), Apache Kafka 4.3 docs. Directory layout, file naming, how reads find a segment, deleting by segment and recovery on startup. Out of date on offsets.
- [Topic Configs](https://kafka.apache.org/43/configuration/topic-configs/), Apache Kafka 4.3 docs. Segment size and roll time, index interval, retention by time and size, and their defaults.
- [Kafka storage log package](https://github.com/apache/kafka/tree/4.3.0/storage/src/main/java/org/apache/kafka/storage/internals/log), Apache Kafka 4.3.0 source. LogSegment, LogSegments and OffsetIndex: the real index format and lookup.
