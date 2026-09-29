---
id: overflow-pages
title: Overflow pages and TOAST
depth: short
phase: 7
note: >-
  Where a database puts a value too big for one page: overflow pages,
  and Postgres's TOAST.
needs: [database-pages]
leads_to: []
compare_with: []
---

# Overflow pages and TOAST

A database stores rows in fixed-size [[database-pages|pages]] (8 kB is
common in Postgres). Postgres won't let a row span two pages, and
SQLite keeps each row's cell on one B-tree page. So what
happens when a row holds a 50 kB JSON document or a 3 MB image? The
engine keeps a small part of the row on its page and stores the big
value somewhere else, with a pointer to it. How it does that decides
what big values cost you.

## SQLite: a chain of overflow pages

SQLite stores a table as a [[b-plus-tree|B-tree]], one cell per row.
When a cell's payload is too big for its page, SQLite keeps only the
first bytes on the B-tree page and spills the rest onto overflow pages.

The overflow pages form a linked list. The cell ends with the page
number of the first one. Each overflow page starts with four bytes
holding the number of the next page in the chain (zero on the last),
and the rest of the page is data.

So reading a big value means following the chain, one page at a time.
Index keys can overflow too: SQLite spills large keys so that every
interior page still holds at least four keys. Otherwise one huge key
could leave an interior page with room for almost nothing, and the tree
would grow tall.

## Postgres: TOAST

Postgres pages are commonly 8 kB, and a row (a tuple) can't span pages.
Its answer is TOAST, the Oversized-Attribute Storage Technique:

1. When a row being stored is wider than about 2 kB, TOAST kicks in.
2. It first tries to compress the big values in place.
3. If the row is still too wide, it moves values out of line into a
   separate TOAST table that belongs to the main table. Each value is
   cut into chunks of about 2,000 bytes, four to a page, stored as
   ordinary rows, and the main row keeps a pointer.

Only variable-length types (text, bytea, jsonb and the like) can be
TOASTed, and one value can be at most 1 GB.

Each column has a strategy you can change with `ALTER TABLE ... SET
STORAGE`:

| Strategy | Compress | Move out of line |
|---|---|---|
| `PLAIN` | no | no |
| `MAIN` | yes | only as a last resort |
| `EXTERNAL` | no | yes |
| `EXTENDED` (default for most types) | yes, first | yes, if still too big |

## Why keep big values out of the way

Moving big values out of the row sounds like extra work, but it usually
pays. Queries mostly filter on small columns. With the big values
elsewhere, the main table is much smaller, so more of its rows fit in
the [[buffer-pool]], and sorts are more likely to fit in memory. The big values are only fetched when a query actually
selects them, at the moment the results go back to the client.

## Where it gets tricky

**`SELECT *` isn't free.** Every TOASTed column you select means extra
reads from the TOAST table, and decompression. Name the columns you
need.

**Compression can slow partial reads.** A compressed value has to be
decompressed as a whole. `EXTERNAL` stores values uncompressed, which
takes more space but lets substring reads of long text and bytea fetch
only the chunks they need.

## What this means when you build

- Big values in rows are fine, but know where they end up: out of line
  and possibly compressed. Keep hot, small columns separate from big
  cold ones in your queries.
- Avoid `SELECT *` on tables with large text, jsonb or bytea columns.
- For files in the megabytes, consider [[object-storage]] with a key in
  the row instead of the bytes themselves.
- If you only read slices of big text, look at the `EXTERNAL` storage
  strategy.

## Further reading

- [TOAST](https://www.postgresql.org/docs/current/storage-toast.html), PostgreSQL docs, version 18. The thresholds, chunking, the four storage strategies, and why out-of-line storage keeps the main table small.
- [Database File Format](https://www.sqlite.org/fileformat2.html), SQLite developers. Sections 1.6 and 1.7: how a too-big cell spills onto a linked list of overflow pages.
