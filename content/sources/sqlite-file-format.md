---
id: sqlite-file-format
title: Database File Format (section 4, The Write-Ahead Log)
author: SQLite developers
url: https://www.sqlite.org/fileformat2.html
kind: spec
primary: true
---

## Summary

SQLite's official file format spec. Section 4 defines the WAL file: a
32-byte header, then frames of a 24-byte header plus one database page.
A frame counts only if its salts match the header and a cumulative
checksum over everything before it matches. Transactions commit with a
commit frame. No page date; it's the living spec.

## Key claims

- The WAL is a header plus frames; each frame holds one page. "A WAL file consists of a header followed by zero or more \"frames\"." (4.1)
- Commit is a frame with a commit marker. "Transactions commit when a frame is written that contains a commit marker." (4.1)
- The WAL always grows from start to end and is reused after checkpoints; checksums and counters separate valid frames from leftovers. "Checksums and counters attached to each frame are used to determine which frames within the WAL are valid and which are leftovers from prior checkpoints." (4.1)
- Header: 32 bytes, eight big-endian 32-bit integers: magic, version (3007000), page size, checkpoint sequence, salt-1, salt-2, checksum-1, checksum-2. (4.1, WAL Header Format)
- Frame header: 24 bytes, six big-endian 32-bit integers: page number, db size after commit (zero if not a commit), salt-1, salt-2, checksum-1, checksum-2. (4.1, WAL Frame Header Format)
- Validity rule: salts match, and the cumulative checksum matches. "A frame is considered valid if and only if the following conditions are true" (4.1)
- The checksum is cumulative: computed over the WAL header's first 24 bytes and every frame up to this one. "the checksum computed consecutively on the first 24 bytes of the WAL header and the first 8 bytes and the content of all frames up to and including the current frame." (4.1)
- The checksum is a Fibonacci-weighted sum over 32-bit words, not a CRC. "The outputs s0 and s1 are both weighted checksums using Fibonacci weights in reverse order." (4.2)
- On reset, salt-1 is incremented and salt-2 randomized, which invalidates old frames. "These changes to the salts invalidate old frames in the WAL that have already been checkpointed but not yet overwritten" (4.4)
- Readers use only frames that are commits or followed by a commit. "the last valid instance of page P that is followed by a commit frame or is a commit frame itself becomes the value read." (4.5)
- Checkpoint syncs the WAL, copies pages into the database, then syncs the database; syncs act as write barriers. "The xSync operations serve as write barriers" (4.3)
- (added for phase 7, pages and B-trees) The database file is a sequence of same-size pages, a power of two from 512 to 65536 bytes. "The size of a page is a power of two between 512 and 65536 inclusive." (1.2)
- Two B-tree variants: table b-trees keep all data in the leaves, index b-trees keep only keys. "\"Table b-trees\" use a 64-bit signed integer key and store all data in the leaves." (1.6)
- An interior page holds K keys and K+1 child pointers; a pointer is a 32-bit page number. "A \"pointer\" in an interior b-tree page is just the 32-bit unsigned integer page number of the child page." (1.6)
- Large index keys spill to overflow pages so every interior page holds at least 4 keys. "every internal page is able to store at least 4 keys." (1.6)
- A cell whose payload is too big keeps only its first bytes on the page; the rest goes to a linked list of overflow pages. "then only the first few bytes of the payload are stored on the b-tree page and the balance is stored in a linked list of content overflow pages." (1.6)
- A B-tree is identified by its root page number, stored in sqlite_schema. "Hence, b-trees are identified by their root page number." (1.6)
- One table b-tree per rowid table, one index b-tree per index; WITHOUT ROWID tables use index b-trees. "WITHOUT ROWID tables use index b-trees rather than table b-trees" (1.6)
- Page regions in order: file header (page 1 only), page header, cell pointer array, unallocated space, cell content, reserved region. "A b-tree page is divided into regions in the following order:" (1.6)
- The page header is 8 bytes for leaf pages, 12 for interior pages. "The b-tree page header is 8 bytes in size for leaf pages and 12 bytes for interior pages." (1.6)
- The cell pointer array is K 2-byte offsets, in key order. "The cell pointer array consists of K 2-byte integer offsets to the cell contents." (1.6)
- Cells are placed toward the end of the page so the pointer array can grow. "SQLite strives to place cells as far toward the end of the b-tree page as it can, in order to leave space for future growth of the cell pointer array." (1.6)
- Freed space inside the cell area is tracked as a chain of freeblocks. "A freeblock is a structure used to identify unallocated space within a b-tree page." (1.6)
- (added for overflow-pages) Overflow pages are a linked list. "Overflow pages form a linked list." (1.7)
- Each overflow page starts with the next page's number. "The first four bytes of each overflow page are a big-endian integer which is the page number of the next page in the chain, or zero for the final page in the chain." (1.7)
- The cell keeps a pointer to the first overflow page. "A 4-byte big-endian integer page number for the first page of the overflow page list - omitted if all payload fits on the b-tree page." (1.6, cell formats)

## Visuals worth redrawing

- WAL header and frame header as byte-offset tables side by side with the LevelDB record header.

## My notes

- Compared with LevelDB: big-endian, per-frame pages instead of arbitrary records, cumulative checksum instead of per-record CRC, salts to tell old frames from new after the file is reused.
