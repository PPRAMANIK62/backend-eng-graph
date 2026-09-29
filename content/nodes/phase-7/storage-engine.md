---
id: storage-engine
title: Storage engines
depth: short
phase: 7
note: >-
  The part of a database that lays data on disk and finds it again.
  Update in place vs log-structured.
needs: [filesystem, page-cache]
leads_to: [database-pages, lsm-tree, log-structured-hash-table]
compare_with: []
---


# Storage engines

A storage engine is the part of a database that decides how rows are laid
out in files and how they're found again. Everything above it (SQL
parsing, planning, [[transaction|transactions]] as you see them) asks it for rows by key
or by scan. Picking a database often means picking a storage engine, and
much of what makes a database fast at some things and slow at others
comes from this layer.

## One layer, swappable in some databases

MySQL makes the layer visible. Its storage engines are components that
handle the SQL operations for different table types, and you choose one
per table. InnoDB is the default in MySQL 8.4 and the one Oracle
recommends for almost everything. MyISAM is still there, but it locks
whole tables, which limits it to read-mostly work. Engines can even be
loaded into and unloaded from a running server. The same `SELECT` runs
on either; what changes is how the rows sit on disk and what each
operation costs.

## Files, and pages inside them

Every disk-based engine starts from the same place. The data lives in
files on a [[filesystem]]. The operating system has no idea what's in
them; only the database can decode its own format. Some databases
spread their data over many files; [[sqlite|SQLite]] keeps a whole
database in a single file.

Inside those files, engines work in fixed-size blocks called
[[database-pages|pages]], not in rows or bytes. A page id maps to a file
and an offset. To read one row, the engine reads the whole page that
holds it into memory, into its [[buffer-pool]] or the kernel's
[[page-cache]], and works on it there.

From there, engines split into two families, depending on what happens
when you change a row.

## Update in place

Say you run `UPDATE users SET name = 'Ada' WHERE id = 42`.

An update-in-place engine finds the page that holds row 42, changes the
row inside that page, and later writes the page back to the same spot in
the file. Each row has a home, and the engine keeps it there. A separate
[[indexes|index]], such as a [[b-plus-tree]], tells it which page is home. Most engines
built this way lay out rows in pages with the slotted layout covered in
[[database-pages]], and keep a table either as a loose pile of pages
with separate indexes ([[heap-files]]) or inside the primary key's
B+tree.

This design has a few costs you can predict:

- **Whole-page I/O for small changes.** Changing a few bytes still
  means reading and writing the whole page.
- **Random I/O.** Twenty updates to twenty rows can mean twenty pages in
  twenty different places.
- **Fragmentation.** Deleted rows leave holes in pages that aren't
  always filled.

Overwriting pages in place has one more risk. A drive only promises
to write its own small block atomically, so a crash in the middle of
writing a bigger database page can leave it half old, half new
([[torn-writes]]). Engines that overwrite pages need extra measures for
that, such as [[full-page-writes]] next to a [[write-ahead-log]].

## Log-structured

A log-structured engine never changes a page that's already on disk.
The same update becomes a new record, "key 42 now has name Ada", that
goes into a sorted structure in memory, the memtable. When that fills
up, the engine writes it out as a new sorted, immutable file. Writes are
sequential, and nothing is overwritten.

Reads pay for it. To find key 42, the engine checks the memtable, then
the files on disk from newest to oldest, until it finds the latest
version. Over time the files pile up, so a background job,
[[compaction]], merges them and keeps only the newest value for each
key. That merging rewrites data many times, which is the write
amplification these engines are known for.

This family runs from simple ([[log-structured-hash-table|an append-only
log with an in-memory map]]) to the [[lsm-tree]].

![Two columns. Left, update in place: an UPDATE of row 42 reads page 7 from the data file, changes the row inside the page, and writes page 7 back to the same place. Right, log-structured: the same UPDATE adds a new record for key 42 to the in-memory memtable; the memtable is later written out as a new sorted file, and compaction merges older files, dropping the old version of key 42.](img/storage-engine-two-families.svg)

*The same update in the two families of storage engine.*

## Where it gets tricky

**Neither family finds a row by itself.** A heap of pages and a pile of
log files are both unsorted from the point of view of a query, so both
need an index to find anything. A third layout, index-organized storage,
puts the rows inside the index itself; InnoDB tables work this way, and
[[heap-files]] explains the trade.

**"Log-structured" doesn't mean "has a log".** Update-in-place engines
also append to a log, the write-ahead log, for crash safety. The
difference is where the data finally lives: in pages that get
overwritten, or in files that never are.

**Neither is simply faster.** Log-structured engines get fast
sequential writes and pay with slower reads and costly compaction.
Update-in-place engines pay on writes instead, with random I/O and
whole-page rewrites. Which wins depends on the workload. Comparing the costs properly needs
the three kinds of [[amplification]].

## What this means when you build

- When you pick a database, you're picking its storage engine's
  trade-offs. Ask what a write and a point read cost on disk.
- In MySQL, check which engine a table uses; use InnoDB unless you know
  why not.
- Expect update-in-place engines to suffer on random-write-heavy loads,
  and log-structured ones to need compaction headroom (disk and I/O).

## Further reading

- [Lecture #03: Database Storage (Part I)](https://15445.courses.cs.cmu.edu/fall2024/notes/03-storage1.pdf), Andy Pavlo, CMU 15-445, 2024. Files, pages, page ids and why the database, not the OS, owns the format.
- [Lecture #04: Database Storage (Part II)](https://15445.courses.cs.cmu.edu/fall2024/notes/04-storage2.pdf), Andy Pavlo, CMU 15-445, 2024. The problems with updating pages in place, log-structured storage, and index-organized storage.
- [Alternative Storage Engines](https://dev.mysql.com/doc/refman/8.4/en/storage-engines.html), MySQL 8.4 Reference Manual. MySQL's pluggable storage engines, InnoDB as the default, and what MyISAM gives up.
