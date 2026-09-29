---
id: leveldb-table-format
title: leveldb File format (doc/table_format.md)
author: LevelDB authors (Google)
url: https://github.com/google/leveldb/blob/main/doc/table_format.md
kind: docs
primary: true
---

## Summary

The on-disk layout of a LevelDB sorted table: data blocks, meta blocks
(filter, stats), a metaindex block, an index block with one entry per
data block, and a fixed 48-byte footer with a magic number. Internal
pointers are BlockHandles (offset and size as varints).

## Key claims

- File layout, top to bottom: data blocks, meta blocks, metaindex block, index block, footer. "[Footer]        (fixed size; starts at file_size - sizeof(Footer))" (layout)
- Pointers inside the file are varint offset and size. "The file contains internal pointers.  Each such pointer is called a BlockHandle" (after layout)
- Data blocks hold sorted key/value pairs, each block optionally compressed. "The sequence of key/value pairs in the file are stored in sorted order and partitioned into a sequence of data blocks." (1)
- The index has one entry per data block, keyed by a separator. "This block contains one entry per data block, where the key is a string >= last key in that data block and before the first key in the successive data block." (4)
- The index value points at the block. "The value is the BlockHandle for the data block." (4)
- The footer points at the metaindex and index and ends with a magic number. "At the very end of the file is a fixed length footer that contains the BlockHandle of the metaindex and index blocks as well as a magic number." (5)
- The magic number. "magic:            fixed64;     // == 0xdb4775248b80fb57 (little-endian)" (5)
- Footer padding makes it fixed length (40 bytes of handles plus the 8-byte magic). "(40==2*BlockHandle::kMaxEncodedLength)" (5)
- Each block on disk is followed by a 5-byte trailer: a compression type byte and a 32-bit CRC. "1-byte type + 32-bit crc" (table/format.h in the same repository, opened alongside, comment on kBlockTrailerSize)
- The filter block holds one filter per 2 KB of data-block offsets. "Currently, \"base\" is 2KB." ("filter" Meta Block)
- The footer is 48 bytes: two handles of at most 10 + 10 bytes each, plus the 8-byte magic. "enum { kEncodedLength = 2 * BlockHandle::kMaxEncodedLength + 8 };" and "enum { kMaxEncodedLength = 10 + 10 };" (table/format.h in the same repository, opened alongside)
- The "stats" meta block is documented but not implemented yet. "TODO(postrelease): record following stats." ("stats" Meta Block)

## Visuals worth redrawing

- The file layout, drawn as stacked blocks with arrows from the footer
  to the index and from index entries to data blocks.

## My notes

- Reading a table: read the footer (fixed size from the end), then the
  index, then binary search it, then read one data block.
