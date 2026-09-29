---
id: postgres-page-layout
title: "PostgreSQL documentation, 66.6 Database Page Layout"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/storage-page-layout.html
kind: docs
primary: true
---

## Summary

The manual's description (read at version 18) of the page format used by
every Postgres table and index: a 24-byte header, an array of 4-byte
item identifiers, free space, the items growing from the end, and a
special space for index methods. Also the heap row header.

## Key claims

- Tables and indexes are arrays of fixed-size pages, usually 8 kB. "Every table and index is stored as an array of pages of a fixed size (usually 8 kB, although a different page size can be selected when compiling the server)." (66.6)
- In a table any row can go on any page. "In a table, all the pages are logically equivalent, so a particular item (row) can be stored in any page." (66.6)
- In an index the first page is usually a metapage. "In indexes, the first page is generally reserved as a metapage holding control information" (66.6)
- Five parts: header, item identifiers, free space, items, special space. "There are five parts to each page." (66.6, Table 66.2)
- The header is 24 bytes. "24 bytes long. Contains general information about the page, including free space pointers." (Table 66.2)
- Each item identifier is an (offset, length) pair of 4 bytes. "Each entry is an (offset,length) pair. 4 bytes per item." (Table 66.2)
- New item identifiers come from the start of free space, new items from the end. "New item identifiers are allocated from the start of this area, new items from the end." (Table 66.2)
- The header's first field is the LSN of the last WAL record that changed the page. "The first field tracks the most recent WAL entry related to this page." (66.6)
- The second is a checksum, when checksums are enabled. "The second field contains the page checksum if data checksums are enabled." (66.6)
- pd_lower and pd_upper mark the start and end of free space. (Table 66.3)
- Only one page size per installation. "there is no support for having more than one page size in an installation." (66.6)
- An item identifier doesn't move until freed, so it can be a stable reference while the item moves on the page. "Because an item identifier is never moved until it is freed, its index can be used on a long-term basis to reference an item, even when the item itself is moved around on the page to compact free space." (66.6)
- A row pointer (CTID) is a page number plus an item identifier index. "every pointer to an item (ItemPointer, also known as CTID) created by PostgreSQL consists of a page number and the index of an item identifier." (66.6)
- B-tree pages keep sibling links in the special space; tables don't use it. "For example, b-tree indexes store links to the page's left and right siblings, as well as some other data relevant to the index structure." (66.6)
- A heap row has a fixed header of 23 bytes on most machines, then a null bitmap and the data. "There is a fixed-size header (occupying 23 bytes on most machines), followed by an optional null bitmap, an optional object ID field, and the user data." (66.6.1)
- The row header holds the inserting and deleting transaction ids (t_xmin, t_xmax) and t_ctid, the location of this or a newer version. (Table 66.4)
- Reading a row needs the catalog to know column types. "Interpreting the actual data can only be done with information obtained from other tables, mostly pg_attribute." (66.6.1)
- pd_lsn points just past the WAL record of the last change to the page. "LSN: next byte after last byte of WAL record for last change to this page" (Table 66.3)

## Visuals worth redrawing

- Figure 66.1, the page layout. Redrawn with the slotted-page figure in `database-pages`.

## My notes

- Section number was 66.6 in the version 18 docs.
