---
id: log-structured-hash-table
title: Log-structured hash tables
depth: short
phase: 7
note: >-
  Append every write to a log, keep an in-memory map of offsets.
  Bitcask.
needs: [append-only-log, storage-engine]
leads_to: [lsm-tree]
compare_with: [lsm-tree]
---

# Log-structured hash tables

A log-structured hash table is the simplest [[storage-engine|storage engine]] that
survives a crash and stays fast: every write is appended to a log file,
and an in-memory hash table remembers where the latest value for each
key sits in that file. Bitcask, the default engine of the Riak
database, is the classic example. It's worth knowing because it shows
the log-structured idea with nothing else in the way, and because its
limits explain why the [[lsm-tree]] exists.

## A put, a get and a delete

Start with an empty directory and one open file, the *active* file.
Every write goes to its end, using the same framing as an
[[append-only-log]]. In Bitcask each entry is a [[checksums|CRC]], a timestamp, the
key size, the value size, then the key and the value, with the CRC
covering everything after it.

Say you `put("user:42", "Ada")` while file 2 is the active file. The
engine appends the entry to file 2, then updates an in-memory hash
table, the *keydir*: `user:42 → (file 2, its offset, its size)`.
Bitcask's keydir entry also keeps the timestamp.

Later, with file 2 full and file 3 now active, you
`put("user:42", "Ada L.")`. Nothing is overwritten. A second entry goes
to the end of file 3, at offset 40, and the keydir entry for `user:42`
now points there. The old entry is still in file 2, but nothing points
to it any more.

A `get("user:42")` is one hash lookup in memory, then one read at the
stored file and offset. That's at most one disk seek per read, and
often none, because the operating system's [[page-cache]] may already
hold the bytes.

A `delete("user:42")` can't erase anything either. It appends a special
*tombstone* value for the key and drops the key from the keydir. The
tombstone matters after a restart: without it, the old value would come
back when the files are scanned.

![A keydir in memory maps three keys to a file id and offset. user:42 points to the newest entry near the end of the active file. An older entry for user:42 in an older file is greyed out as garbage, since nothing points to it. A get follows the keydir entry straight to one read on disk.](img/log-structured-hash-table-keydir.svg)

*The keydir holds one pointer per key; old values stay on disk until a merge. Adapted from Justin Sheehy and David Smith, "Bitcask: A Log-Structured Hash Table for Fast Key/Value Data" (2010).*

## Files, merging and hint files

When the active file reaches a size threshold, it's closed and a new
active file starts. A closed file is never written again. Only one
process may open a Bitcask directory for writing.

Overwrites and deletes leave dead entries behind, so disk use only
grows. A background *merge* fixes that: it reads the closed files,
keeps only the entries the keydir still points to, and writes them into
new files. This is [[compaction]] in its simplest form. Riak lets you
trigger it by how much of a file is dead: by default when 60% of a
file's keys are dead, or when it holds 512 MB of dead data.

Next to each merged file, the merge writes a *hint file*: the same
entries without the values, just key, position and size. It exists for
startup.

## Restart and crash recovery

The keydir lives only in memory, so a restart has to rebuild it. The
engine scans every data file in order and replays each entry into a
fresh hash table, with later entries winning. Where a hint file exists,
it scans that instead, which is much smaller.

The data files *are* the log, so there's no separate
[[write-ahead-log]] to replay. After a crash, the only thing that can be
damaged is the tail of the last active file, and recovery checks the
last record or two against their CRCs, the same "keep the good prefix"
rule as any append-only log.

Durability is a separate choice. Riak's default sync strategy leaves
writes in the kernel's buffers, so a power cut can lose the last few.
The `o_sync` option opens the file with `O_SYNC`, which makes every
write wait for [[fsync]]-level durability and costs write throughput.

## What it can't do

**Every key has to fit in memory.** The keydir holds one entry per key,
always. The value can be on disk, but the key and its pointer can't.
If your key count grows past your RAM, this design stops working.

**No range queries.** A hash table has no order. "All keys between
`user:100` and `user:200`" means scanning everything. That, and the
memory limit, are what the [[lsm-tree]] fixes: it keeps keys sorted in
memory and on disk, so neither the whole key set nor a scan needs a
hash table.

**Startup takes a scan.** Hint files make it shorter, but a big store
still reads every hint file to rebuild the keydir.

**No compression.** Bitcask stores values as written.

## What this means when you build

- For a key-value store with a key set that fits in RAM, lots of
  writes, and only point lookups, this design is hard to beat for
  simplicity. It's a sensible first storage engine to write.
- Decide your sync policy on purpose. An unsynced append is fast and
  can be lost; a synced one is durable and slow.
- Plan for merges: they need spare disk space and I/O, and they can
  compete with foreground traffic. Riak lets you confine merges to
  chosen hours for that reason.
- Write tombstones for deletes, and keep them until every older value
  for that key is gone.

## Further reading

- [Bitcask: A Log-Structured Hash Table for Fast Key/Value Data](https://riak.com/assets/bitcask-intro.pdf), Justin Sheehy and David Smith, Basho, 2010. The whole design in six pages: entry format, keydir, merge and hint files.
- [Bitcask (Riak KV 2.2.3 docs)](https://docs.riak.com/riak/kv/2.2.3/setup/planning/backend/bitcask/index.html), Basho. Running it for real: sync strategies, merge triggers and windows, and the keys-in-memory limit.
