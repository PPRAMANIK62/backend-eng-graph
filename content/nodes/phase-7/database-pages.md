---
id: database-pages
title: Database pages
depth: short
phase: 7
note: >-
  Fixed-size pages and the slotted layout that holds rows inside them.
needs: [storage-engine]
leads_to: [b-plus-tree, heap-files, buffer-pool, overflow-pages]
compare_with: []
---


# Database pages

A database doesn't read or write rows one at a time. It moves fixed-size
blocks called pages, 8 kB each in Postgres by default, and every table
and [[indexes|index]] is an array of them. Inside a page, rows are held with a
slotted layout that lets them change size and move around without
breaking anything that points at them. Pages are the unit the
[[storage-engine]] reads, caches, logs and checksums.

## Why fixed-size pages

Every page has an id. The engine asks for "page 1,207 of the users
table", and a small mapping layer turns that into a file and an offset.
In the simplest case, one database in one file, the page id can just be
the offset. Either way, one page is one read at one place.

Variable-size pages would leave holes in the file when deleted, so
most engines pick one size and stick to it. [[sqlite|SQLite]] lets each
database file pick a power of two from 512 to 65,536 bytes.

A page is also the smallest thing the engine reads: to see one 100-byte
row, it reads the whole page.

## Three kinds of "page"

The word covers three different sizes:

- **The drive's block**, often 4 KB. The drive promises to write this
  much atomically: all of it or none.
- **The OS page**, 4 KB, the unit of the kernel's [[page-cache]].
- **The database page**, anywhere from 1 to 16 KB depending on the
  database. Postgres uses 8 kB.

When the database page is bigger than the drive's atomic block, a crash
halfway through a write can leave a page half new and half old. That's a
[[torn-writes|torn write]], and databases need extra measures to survive
it.

## The slotted page

Rows vary in length. Packing them one after another breaks as soon as
a row in the middle is deleted or grows.

Most databases use a slotted page instead, like Postgres's:

![A Postgres page drawn as one long box. From the left: a 24-byte page header holding pd_lsn, pd_checksum, pd_lower and pd_upper; an array of 4-byte item identifiers (1, 2, 3) growing to the right; free space in the middle; rows growing leftward from the end (row 3, row 2, row 1); and the special space at the far right, empty for tables. Arrows from each item identifier point to its row. pd_lower marks the end of the item array and pd_upper the start of the rows.](img/database-pages-slotted-page.svg)

*A slotted page, with Postgres's field names. Adapted from the PostgreSQL documentation, "Database Page Layout".*

- **A header** at the start, 24 bytes in Postgres.
- **An array of item identifiers** right after it. Each is 4 bytes: the
  offset and length of one row on this page.
- **The rows themselves**, stored from the end of the page backwards.
- **Free space** in the middle. New item identifiers take space from its
  front, new rows from its back. When the two meet, the page is full.
- **A special space** at the very end, used by indexes. A B-tree page
  keeps links to its left and right neighbours there. Tables leave it
  empty.

SQLite's B-tree pages have the same shape under other names: a page
header, a "cell pointer array" of 2-byte offsets, unallocated space, and
cells packed toward the end so the pointer array can grow.

## Why the indirection matters

Nobody outside the page points at a row directly. They point at a slot.

In Postgres, a row's address (its CTID) is a page number plus the index
of its item identifier: "page 1,207, item 3". An item identifier never
moves until it's freed. So when the engine compacts a page to reclaim
the space left by deleted rows, it can slide rows around and just update
the offsets in the array. Every index entry pointing at "page 1,207,
item 3" is still right. [[heap-files]] shows indexes using exactly this
kind of address.

## What's in the header

In Postgres the header holds, among other things:

- **`pd_lsn`**: the position in the [[write-ahead-log]] just past the
  record for the last change to this page.
- **`pd_checksum`**: a [[checksums|checksum]] of the page, if data
  checksums are turned on.
- **`pd_lower` and `pd_upper`**: where free space starts and ends.

## Rows inside the page

A row is bytes with a small header of its own. In Postgres the fixed
part is 23 bytes on most machines. It holds the ids of the [[transaction|transactions]]
that inserted and deleted this version of the row (`t_xmin` and
`t_xmax`, the raw material of [[mvcc]]), a pointer to a newer version if
there is one, and a bitmap of which columns are null. Then the column
values.

The row doesn't say what types its columns are; the engine looks those
up in its catalog.

Most databases don't let one row span pages. Large values go somewhere
else, with a pointer left behind: see [[overflow-pages]].

## Where it gets tricky

**A row's address is not an id.** In Postgres an update writes a new
version of the row, which gets its own slot, maybe on another page, and
the old version's header points to it. So a row's CTID changes under
you. Applications can't rely on these addresses to mean anything. Use a
[[primary-keys|primary key]].

**Free space inside a page fragments.** Deleted rows leave gaps. Postgres
compacts the page; SQLite tracks the gaps as a chain of "freeblocks"
until they're reused.

**Page size is a one-time choice.** Postgres fixes it when the server is
compiled, and one installation can't mix sizes. Databases built for
read-only work tend to use bigger pages.

## What this means when you build

- Think in pages when you estimate I/O: a query that touches 1,000 rows
  spread over 1,000 different pages can cost up to 1,000 page reads.
- Row size matters. Narrower rows mean more rows per page and fewer
  pages to read.
- Never treat a physical row address as a stable identifier.

## Further reading

- [Database Page Layout](https://www.postgresql.org/docs/current/storage-page-layout.html), PostgreSQL documentation, version 18. The exact Postgres page and row format, field by field.
- [Lecture #03: Database Storage (Part I)](https://15445.courses.cs.cmu.edu/fall2024/notes/03-storage1.pdf), Andy Pavlo, CMU 15-445, 2024. Why fixed-size pages, the three meanings of "page", and the slotted layout in general.
- [Database File Format](https://www.sqlite.org/fileformat2.html), SQLite developers. Section 1.6 shows the same slotted design in SQLite's B-tree pages, with overflow pages and freeblocks.
