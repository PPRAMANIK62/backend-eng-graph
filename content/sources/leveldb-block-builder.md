---
id: leveldb-block-builder
title: leveldb table/block_builder.cc
author: LevelDB authors (Google)
url: https://github.com/google/leveldb/blob/main/table/block_builder.cc
kind: code
primary: true
---

## Summary

The code that builds one block of a LevelDB table. Its header comment
is the spec for the block format: keys are prefix-compressed against
the previous key, with a full key every K entries (a restart point),
and an array of restart offsets at the end for binary search.

## Key claims

- Keys drop the prefix they share with the previous key. "When we store a key, we drop the prefix shared with the previous string." (header comment)
- Restart points store a full key every K keys. "Furthermore, once every K keys, we do not apply the prefix compression and store the entire key.  We call this a \"restart point\"." (header comment)
- The restart array allows binary search. "The tail end of the block stores the offsets of all of the restart points, and can be used to do a binary search when looking for a particular key." (header comment)
- Values aren't prefix-compressed. "Values are stored as-is (without compression) immediately following the corresponding key." (header comment)
- Entry layout: shared_bytes, unshared_bytes, value_length (varint32 each), then the key delta and the value. "shared_bytes: varint32" (header comment)
- The default restart interval is 16 keys. "int block_restart_interval = 16;" (include/leveldb/options.h in the same repository, opened alongside)
- Trailer: restart offsets (uint32 each) and their count. "restarts[i] contains the offset within the block of the ith restart point." (header comment)
- The default block size is 4 KB of uncompressed data. "size_t block_size = 4 * 1024;" (include/leveldb/options.h in the same repository, opened alongside)

## Visuals worth redrawing

- One block with three entries ("apple", "applet", "apply"): shared
  and unshared bytes, and the restart array at the end.

## My notes

- options.h also sets the default block size (4 KB, also in
  leveldb-index) and names Snappy as the default compressor (not used
  in any article).
