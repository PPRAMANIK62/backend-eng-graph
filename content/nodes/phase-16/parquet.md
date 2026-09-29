---
id: parquet
title: Parquet
depth: short
phase: 16
note: >-
  The columnar file format: row groups, pages, encodings and statistics.
needs: [column-storage, binary-encoding]
leads_to: [open-table-formats]
compare_with: []
---

# Parquet

Parquet is an open file format for tables, stored column by column
inside each file. Many engines and languages read and write it, so it's
a common format for data that will be scanned later, and the phase 16
lab writes its results as Parquet. Knowing the layout tells you why
some queries on a Parquet file read almost nothing and others read all
of it.

## Inside a file

A Parquet file is [[column-storage]] applied to one file. The rows are
cut into **row groups**, horizontal slices of the table. Inside a row
group, each column's values are stored together as a **column chunk**,
and each chunk is split into **pages**, the unit that gets encoded and
compressed.

After all the data comes the **footer**: the file's metadata,
serialized with Thrift's compact protocol. It holds the schema, the
list of row groups, where each column chunk starts, and statistics
such as each chunk's minimum and maximum. The file begins and ends
with the four bytes `PAR1`, and just before the final `PAR1` sits the
footer's length as a 4-byte little-endian integer.

![A Parquet file drawn top to bottom: the PAR1 magic, row group 1 holding column chunks for id, region and price, row group 2, the footer with schema, row groups, chunk offsets and min/max, the footer length, and PAR1 again. A zoom shows one column chunk as a dictionary page followed by data pages. A list shows how a reader works: read the last 8 bytes, read the footer, skip row groups by min/max, read only the needed chunks.](img/parquet-file-layout.svg)

*The layout of a Parquet file and the order a reader uses it in. Adapted from the Apache Parquet format specification's file layout.*

## Reading only what you need

A reader starts at the end. It reads the last 8 bytes (the footer's
length plus the closing `PAR1`), reads the footer, and from then on knows where
everything is. Then it can:

- read only the column chunks for the columns the query names;
- skip whole row groups whose min and max show that no row can match;
- with the optional page index, skip single pages the same way.

The footer goes last for the writer's sake. A writer can stream row
groups out as it goes, and write the metadata once it knows where
everything landed, all in one pass.

## How values are stored

Parquet keeps its physical types few: booleans, 32- and 64-bit
integers, floats, doubles, byte arrays and fixed-length byte arrays
(plus a 96-bit integer). There's no 16-bit integer, because a 32-bit
column with a compact encoding covers it. A string is a byte array with
a STRING annotation. How numbers and lengths become bytes in the first
place (little-endian, varints) is [[binary-encoding]].

Each page then picks an encoding:

- **Plain** writes values one after another: fixed-width numbers
  little-endian, byte arrays with a 4-byte length in front.
- **Dictionary** collects the chunk's distinct values into a
  dictionary page at the start of the chunk, and the data pages store
  small integer codes. If the dictionary gets too big, the writer falls
  back to plain.
- **RLE/bit-packing hybrid** stores runs of repeats as a count and
  packs other small integers into as few bits as they need. It carries
  dictionary codes and booleans.
- **Delta encodings** store integers as differences from their
  neighbours, packed into as few bits as each small block needs. A block
  of identical values packs down to nothing but a header.

Nulls aren't stored as values at all. Each value has a small
definition level that says whether it's there, and nested data (lists,
structs) uses the same levels, following the Dremel paper. The
levels are run-length encoded, so a column of 1,000 nulls costs one
run. After encoding, each page can be compressed with a codec chosen
per column; see [[block-compression]].

## Where it gets tricky

**A file is written once.** Everything that locates the data lives
in a footer written at the end, so there's no cheap way to change a
row in place. Changing data means writing new files, and keeping track of which
files make up a table is the job of a table format on top:
[[open-table-formats]].

**The footer is a single point of failure.** A corrupt footer loses
the whole file, and a writer that crashes before writing the footer
leaves everything it wrote unreadable. Treat a file as done only once
its footer is written. Pages can carry CRC32 [[checksums]] to catch
corruption inside the data.

**Row group size is a trade.** Big row groups give long sequential
reads, but they need more buffering on the write path. The spec
recommends 512 MB to 1 GB row groups and 8 KB pages, advice written
with HDFS blocks in mind. Smaller row groups make a file more
resilient to corruption, and give min/max skipping finer slices to
work with.

**Min and max only help if the data is clustered.** If the value you
filter on is spread across every row group, every group's range covers
it and nothing gets skipped. Sorting by your most common filter
column before writing is what makes the statistics useful.

**Readers lag behind the spec.** New encodings keep arriving (ALP for
floating point was still in preview when this was written), and a
reader that doesn't support an encoding can't read pages written with
it. For files other people
will read, stick to widely supported encodings.

## What this means when you build

- Write Parquet for data that will be scanned, not looked up one row
  at a time.
- Sort by the column you filter on most before writing.
- Prefer fewer, larger files with big row groups over many tiny files,
  each with its own footer to read.
- Only publish a file once its footer is written.

## Further reading

- [Apache Parquet format specification](https://github.com/apache/parquet-format), Apache Parquet contributors. The file layout, types, nulls and nested data, statistics, error recovery and recommended sizes.
- [Parquet encoding definitions](https://github.com/apache/parquet-format/blob/master/Encodings.md), Apache Parquet contributors. Plain, dictionary, RLE/bit-packing, delta and byte-stream-split encodings, byte by byte.
