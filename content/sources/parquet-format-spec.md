---
id: parquet-format-spec
title: Apache Parquet format specification (parquet-format README)
author: Apache Parquet contributors
url: https://github.com/apache/parquet-format
kind: spec
primary: true
---

## Summary

The README of the parquet-format repository, which is the Parquet
specification together with the Thrift definitions. It defines the
layout (row groups, column chunks, pages, footer), the small set of
physical types, nulls and nested data (Dremel levels), statistics,
checksums, error recovery and recommended sizes. Read on the master
branch when this was written.

## Key claims

- Parquet is an open, column-oriented file format. "Apache Parquet is an open source, column-oriented data file format designed for efficient data storage and retrieval." (intro)
- Built for the Hadoop ecosystem, not tied to one framework. "We created Parquet to make the advantages of compressed, efficient columnar data representation available to any project in the Hadoop ecosystem." (Motivation)
- Nested data uses Dremel's record shredding. "uses the [record shredding and assembly algorithm](https://github.com/julienledem/redelm/wiki/The-striping-and-assembly-algorithms-from-the-Dremel-paper) described in the Dremel paper." (Motivation)
- Compression is chosen per column. "Parquet allows compression schemes to be specified on a per-column level" (Motivation)
- A row group is a horizontal slice of rows with one column chunk per column. "A row group consists of a column chunk for each column in the dataset." (Glossary)
- A column chunk is contiguous in the file. "They live in a particular row group and are guaranteed to be contiguous in the file." (Glossary, column chunk)
- A page is the unit of encoding and compression. "A page is conceptually an indivisible unit (in terms of compression and encoding)." (Glossary)
- The hierarchy: file, row groups, column chunks, pages. "Hierarchically, a file consists of one or more row groups. A row group contains exactly one column chunk per column. Column chunks contain one or more pages." (Glossary)
- Units of parallelism: file or row group for jobs, column chunk for I/O, page for encoding and compression. (Unit of parallelization, list)
- The file starts and ends with the 4-byte magic "PAR1"; the footer holds the file metadata and its 4-byte little-endian length. "4-byte length in bytes of file metadata (little endian)" (File format, layout)
- Metadata goes at the end so the file can be written in one pass. "File Metadata is written after the data to allow for single pass writing." (File format)
- Readers read the footer first, then only the column chunks they need. "Readers are expected to first read the file metadata to find all the column chunks they are interested in." (File format)
- Metadata structures are serialized with Thrift's compact protocol. "All thrift structures are serialized using the TCompactProtocol." (Metadata)
- Physical types are kept minimal; for example there's no 16-bit int. "16-bit ints are not explicitly supported in the storage format since they are covered by 32-bit ints with an efficient encoding." (Types)
- Logical types (such as STRING on BYTE_ARRAY) are annotations over physical types. "strings are stored with the primitive type BYTE_ARRAY with a STRING annotation." (Logical Types)
- Min/max statistics exist at several levels. "Parquet stores min/max statistics at several levels (such as Column Chunk, Column Index, and Data Page)." (Sort Order)
- Nulls aren't stored as values; they live in the run-length-encoded definition levels. "NULL values are not encoded in the data." (Nulls)
- A column of 1000 nulls is just one run in the definition levels. "a column with 1000 NULLs would be encoded with run-length encoding (0, 1000 times) for the definition levels and nothing else." (Nulls)
- A dictionary page, if present, comes first in the column chunk. "The dictionary page must be placed at the first position of the column chunk." (Column chunks)
- An optional page index lets readers skip pages. "files can contain an optional column index to allow readers to skip pages more efficiently." (Column chunks)
- Pages can carry a CRC32 checksum. "Checksums are calculated using the standard CRC32 algorithm" (Checksumming)
- A corrupt footer loses the whole file. "If the file metadata is corrupt, the file is lost." (Error recovery)
- A crash while writing the footer leaves all written data unreadable. "If an error happens while writing the file metadata, all the data written will be unreadable." (Error recovery)
- Recommended row groups are large, 512 MB to 1 GB, for big sequential reads. "We recommend large row groups (512MB - 1GB)." (Configurations)
- Larger row groups need more write buffering. "Larger groups also require more buffering in the write path (or a two pass write)." (Configurations)
- Recommended data page size is 8 KB. "We recommend 8KB for page sizes." (Configurations)
- Smaller row groups make a file more resilient to corruption. "The file will be more resilient to corruption with smaller row groups." (Error recovery)
- A corrupt page header loses the rest of that chunk. "If a page header is corrupt, the remaining pages in that chunk are lost." (Error recovery)
- The physical types, including a 96-bit int. "INT96: 96-bit signed ints" (Types, list: BOOLEAN, INT32, INT64, INT96, FLOAT, DOUBLE, BYTE_ARRAY, FIXED_LEN_BYTE_ARRAY)
- The format is designed around HDFS blocks; the row group advice assumes one row group per HDFS block. "Since an entire row group might need to be read, we want it to completely fit on one HDFS block." (Configurations)
- The footer (FileMetaData) carries the schema. "2: required list<SchemaElement> schema;" (src/main/thrift/parquet.thrift, struct FileMetaData)
- The file metadata locates every column chunk. "The file metadata contains the locations of all the column chunk start locations." (File format)
- A data page is a header, then repetition levels, definition levels and encoded values, back to back. "For data pages, the 3 pieces of information are encoded back to back, after the page header." (Data Pages)

## Visuals worth redrawing

- The file layout listing (magic, column chunks by row group, footer,
  length, magic) and the FileLayout diagram.

## My notes

- The row group advice assumes HDFS blocks. Engines and object stores
  choose their own sizes; the spec's numbers are a recommendation.
