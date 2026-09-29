---
id: chang-bigtable-2006
title: "Bigtable: A Distributed Storage System for Structured Data"
author: Fay Chang, Jeffrey Dean, Sanjay Ghemawat, Wilson C. Hsieh, Deborah A. Wallach, Mike Burrows, Tushar Chandra, Andrew Fikes, Robert E. Gruber
url: https://static.googleusercontent.com/media/research.google.com/en//archive/bigtable-osdi06.pdf
kind: paper
primary: true
---

## Summary

Google's OSDI 2006 paper on Bigtable, the system behind the wide-column
(column-family) model. A table is a sorted map from (row, column,
timestamp) to bytes, rows sorted by key and split into tablets,
columns grouped into families, and atomicity only within one row.

## Key claims

- Not a full relational model. "Bigtable does not support a full relational data model; instead, it provides clients with a simple data model that supports dynamic control over data layout and format" (1)
- The definition. "A Bigtable is a sparse, distributed, persistent multidimensional sorted map." (2)
- Indexed by row, column and timestamp; values are bytes. "The map is indexed by a row key, column key, and a timestamp; each value in the map is an uninterpreted array of bytes." (2)
- The Webtable example stores pages under reversed URLs, with contents and anchor families. "The row name is a reversed URL." (Figure 1)
- One row's reads and writes are atomic. "Every read or write of data under a single row key is atomic (regardless of the number of different columns being read or written in the row)" (2, Rows)
- Rows are kept sorted by key. "Bigtable maintains data in lexicographic order by row key." (2, Rows)
- Key choice gives locality: pages from one domain sit together. "Clients can exploit this property by selecting their row keys so that they get good locality for their data accesses." (2, Rows)
- Column keys are grouped into families declared up front. "A column family must be created before data can be stored under any column key in that family" (2, Column Families)
- No transactions across rows. "Bigtable does not currently support general transactions across row keys" (3, API)
- Row ranges are split into tablets; short range reads touch few machines. "As a result, reads of short row ranges are efficient and typically require communication with only a small number of machines." (2, Rows)
- The reversed-hostname example. "we store data for maps.google.com/index.html under the key com.google.maps/index.html." (2, Rows)
- Within a declared family, any column name can be used. "after a family has been created, any column key within the family can be used." (2, Column Families)
- An SSTable is an immutable sorted map. "An SSTable provides a persistent, ordered immutable map from keys to values, where both keys and values are arbitrary byte strings." (4, Building Blocks)
- An SSTable is a sequence of blocks, typically 64 KB. "Internally, each SSTable contains a sequence of blocks (typically each block is 64KB in size, but this is configurable)." (4)
- The block index sits at the end and is loaded into memory on open. "A block index (stored at the end of the SSTable) is used to locate blocks; the index is loaded into memory when the SSTable is opened." (4)
- So a lookup is one seek: binary search the in-memory index, read one block. "A lookup can be performed with a single disk seek" (4)
- Recent writes sit in a sorted memtable, older ones in SSTables. "the recently committed ones are stored in memory in a sorted buffer called a memtable; the older updates are stored in a sequence of SSTables." (5.3, Tablet Serving)
- Writes go to the commit log first, with group commit. "Group commit is used to improve the throughput of lots of small mutations" (5.3)
- Reads merge the memtable and all SSTables. "A valid read operation is executed on a merged view of the sequence of SSTables and the memtable." (5.3)
- Minor compaction: freeze the memtable and write it as a new SSTable. "When the memtable size reaches a threshold, the memtable is frozen, a new memtable is created, and the frozen memtable is converted to an SSTable and written to GFS." (5.4, Compactions)
- Merging compactions bound the number of SSTables; a major compaction merges them all into one. "A merging compaction that rewrites all SSTables into exactly one SSTable is called a major compaction." (5.4)
- Deletion entries live until a major compaction. "SSTables produced by non-major compactions can contain special deletion entries that suppress deleted data in older SSTables that are still live." (5.4)
- Major compactions make deleted data really go away. "also allow it to ensure that deleted data disappears from the system in a timely fashion, which is important for services that store sensitive data." (5.4)
- Compression is per block, so a small part of a file can be read alone. "Although we lose some space by compressing each block separately, we benefit in that small portions of an SSTable can be read without decompressing the entire file." (6, Compression)
- Their two-pass scheme's speed on the hardware of the time. "they encode at 100–200 MB/s, and decode at 400–1000 MB/s on modern machines." (6, Compression)
- Key order that clusters similar data compresses far better: 10-to-1 on Webtable pages vs 3-to-1 or 4-to-1 for Gzip on HTML. "The scheme achieved a 10-to-1 reduction in space." (6, Compression)
- Bloom filters per SSTable skip files that can't hold the row/column. "A Bloom filter allows us to ask whether an SSTable might contain any data for a specified row/column pair." (6, Bloom filters)
- Most lookups for missing data don't touch disk. "Our use of Bloom filters also implies that most lookups for non-existent rows or columns do not need to touch disk." (6, Bloom filters)
- Bloom filters are optional (per locality group) and kept in tablet server memory. "For certain applications, a small amount of tablet server memory used for storing Bloom filters drastically reduces the number of disk seeks required for read operations." (6, Bloom filters)
- Why the ratio is so good: pages from one host sit together and share boilerplate. "This allows the Bentley-McIlroy algorithm to identify large amounts of shared boilerplate in pages from the same host." (6, Compression)
- A table's rows are split into ranges automatically. "The row range for a table is dynamically partitioned." (2, Rows)
- The tablet is the unit that moves. "Each row range is called a tablet, which is the unit of distribution and load balancing." (2, Rows)
- Tablets split as they grow, at about 100 to 200 MB by default. "As a table grows, it is automatically split into multiple tablets, each approximately 100-200 MB in size by default." (5 Implementation)
- Many tablets per server. "Each tablet server manages a set of tablets (typically we have somewhere between ten to a thousand tablets per tablet server)." (5 Implementation)
- One master assigns tablets and balances load. "The master is responsible for assigning tablets to tablet servers, detecting the addition and expiration of tablet servers, balancing tablet-server load, and garbage collection of files in GFS." (5 Implementation)
- Tablet locations sit in a three-level tree. "We use a three-level hierarchy analogous to that of a B+ tree [10] to store tablet location information (Figure 4)." (5.1)
- Clients cache locations and walk up the tree when a cached entry is wrong. "The client library caches tablet locations." (5.1)
- Data doesn't pass through the master. "client data does not move through the master: clients communicate directly with tablet servers for reads and writes." (5 Implementation)

## Visuals worth redrawing

- Figure 1: one Webtable row (`com.cnn.www`) with a `contents:` column
  holding three timestamped versions and two `anchor:` columns. Good
  base for a wide-column example.

## My notes

- Rows, tablets and SSTables tie into phase 7 (`sstable`, `lsm-tree`).
- Section 5.3 and figure 5 (memtable, tablet log, SSTable files) are
  the clearest early picture of an LSM tree in production, though the
  paper never uses the term.
