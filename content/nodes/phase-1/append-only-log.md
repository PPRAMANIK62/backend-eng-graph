---
id: append-only-log
title: The append-only log
depth: short
phase: 1
note: >-
  A file you only ever add to: length-prefixed, checksummed records, and
  recovery that drops a torn tail. The phase 1 build.
needs: [binary-encoding, checksums, crash-consistency]
leads_to: [write-ahead-log, log-structured-hash-table, log-segments, audit-logging]
compare_with: []
---

# The append-only log

An append-only log is a file you only ever add to. Each change becomes a record written at the end, and nothing already written is touched again. It's the simplest structure that survives a crash well. SQLite in WAL mode, LevelDB and RocksDB all record changes in a log like this.

## Why appending is safer than overwriting

The hard part of [[crash-consistency]] is that a crash can leave any mix of your writes on disk. Overwriting in place is the worst case, because a half-finished overwrite destroys the old data along with the new.

Appending shrinks the problem. Bytes already in the file are never touched again, and records you've already synced stay safe. A crash can only damage what was written after the last sync. So after a crash, the log should be a clean prefix of good records, possibly followed by a damaged tail.

## One record, byte by byte

A record needs three things: the data, its length, and a way to tell whether it's intact. LevelDB's log is a good model. Each record starts with a 7-byte header, then the data:

```
checksum : uint32, little-endian   CRC32C of type and data
length   : uint16, little-endian   size of data
type     : uint8                   FULL, FIRST, MIDDLE or LAST
data     : length bytes
```

The length is a fixed-width number in a known byte order, as in [[binary-encoding]], so a reader always knows where the record ends. The [[checksums|checksum]] lets the reader check the data before trusting it.

LevelDB adds one more idea. The file is cut into 32 KB blocks, and a record too big for the rest of a block is split into FIRST, MIDDLE and LAST fragments. If a block is damaged, the reader can skip to the next block boundary and carry on.

![Top: one record as a 4-byte checksum, a 2-byte length, a 1-byte type and the data, with the first three forming a 7-byte header. Bottom: a log of three good records followed by a torn one whose header is whole but whose data is cut off; recovery cuts the file back to the end of the last good record.](img/append-only-log-record.svg)

*A LevelDB-style record, and a log with a torn tail. Layout from the LevelDB authors, "leveldb Log format" (GitHub, 2017).*

## Appending and syncing

Writing a record is two steps: append the bytes, then [[fsync]] the file. Only after fsync returns is the record durable. That's the moment you can tell a caller "saved", and not before.

You can also write several records and sync once for all of them. Then every record in that batch becomes durable at the same moment, and none of them may be acknowledged earlier.

## Recovery: keep the good prefix, drop the tail

After a crash, you read the log from the start and check each record:

1. Is there room for a full header before the end of the file?
2. Does the length fit in what's left of the file?
3. Does the checksum over the data match the one stored in the header?

As long as all three hold, the record is good. The first record that fails marks the end of the good prefix. Everything from there on was being written when the power went, so you cut the file back to the end of the last good record and start appending from there.

The ways a tail tears map onto these checks: the header was cut short, the header landed but the data didn't, or the data is only partly there ([[torn-writes]]). A torn tail is normal after a crash, not an error.

SQLite's [[write-ahead-log|write-ahead log]] works on the same principle, with differences worth studying. Each frame holds one database page. A frame counts only if two salt values in its header match the file header, and a checksum that runs over the header and every frame up to that one matches. A transaction is committed only when a frame with a commit marker is written; frames after the last commit marker are ignored. The salts change each time the log file is reused, so leftover frames from an earlier round can't be mistaken for new ones.

## Where it gets tricky

A torn tail and real corruption look the same. A bad record at the end could be an unfinished write or a disk error, and the reader can't tell which. RocksDB turns this into a choice. It has four recovery modes: tolerate a bad tail, treat any error as corruption, stop at the first error and recover to that point (the default since version 6.6), or skip every bad record and keep what it can.

A bad record in the middle is different. Good records after it were written later, so it isn't an ordinary torn tail. Silently cutting the log there would throw away data you told someone was saved. It's safer to stop and report it.

Watch what the checksum covers. LevelDB's CRC covers the type and data but not the length, so a reader must sanity-check the length before using it.

## What this means when you build

- Define the record format first: header fields, widths, byte order, what the checksum covers.
- Acknowledge a write only after the fsync that covers it returns.
- On recovery, keep records up to the first failure and truncate the torn tail.
- Treat a bad record followed by good ones as corruption, not as a torn tail.
- The phase 1 build will be this log, in Go, checked by the [[crash-testing]] harness and compared with SQLite's WAL rules.

## Further reading

- [leveldb Log format](https://github.com/google/leveldb/blob/main/doc/log_format.md), LevelDB authors. The whole record format in one page: blocks, header, fragment types.
- [Database File Format, section 4](https://www.sqlite.org/fileformat2.html), SQLite developers. SQLite's WAL frames, salts, cumulative checksum and commit rule.
- [WAL Recovery Modes](https://github.com/facebook/rocksdb/wiki/WAL-Recovery-Modes), RocksDB team. The four ways to treat a bad record on replay, and why a torn tail and corruption look alike.
