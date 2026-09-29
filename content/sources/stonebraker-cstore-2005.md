---
id: stonebraker-cstore-2005
title: "C-Store: A Column-oriented DBMS"
author: Mike Stonebraker, Daniel J. Abadi, Adam Batkin, Xuedong Chen, Mitch Cherniack, Miguel Ferreira, Edmond Lau, Amerson Lin, Sam Madden, Elizabeth O'Neil, Pat O'Neil, Alex Rasin, Nga Tran, Stan Zdonik
url: https://www.vldb.org/archives/website/2005/program/paper/thu/p553-stonebraker.pdf
kind: paper
primary: true
---

## Summary

The VLDB 2005 paper describing C-Store, a read-optimized column store
from MIT, Brandeis, UMass Boston and Brown that became Vertica. It
explains why row stores are write-optimized, why warehouses want the
opposite, and how C-Store handles updates anyway: a small writeable
store, a large read-optimized column store, and a tuple mover between
them.

## Key claims

- Row stores write a whole record with one disk write, so they are write-optimized and suit OLTP. "With this row store architecture, a single disk write suffices to push all of the fields of a single record out to disk." (1 Introduction)
- "These are especially effective on OLTP-style applications." (1 Introduction, of write-optimized row stores)
- Systems for ad-hoc queries over lots of data should be read-optimized; warehouses are one example. "In contrast, systems oriented toward ad-hoc querying of large amounts of data should be read-optimized." (1 Introduction)
- A warehouse's rhythm: a bulk load, then a long period of queries. "in which periodically a bulk load of new data is performed, followed by a relatively long period of ad-hoc queries." (1 Introduction)
- A column store reads only the columns a query needs. "With a column store architecture, a DBMS need only read the values of columns required for processing a given query, and can avoid bringing into memory irrelevant attributes." (1 Introduction)
- Trade CPU for disk bandwidth, because CPUs are getting faster much quicker than disks. "Hence, it makes sense to trade CPU cycles, which are abundant, for disk bandwidth, which is not." (1 Introduction)
- Example: a US state fits in six bits instead of a 16-bit two-letter code. "US states can be coded into six bits, whereas the two-character abbreviation requires 16 bits" (1 Introduction, "two-character" split across a line)
- Dense packing: N values of K bits each take N * K bits. "in a column store it is straightforward to pack N values, each K bits long, into N * K bits." (1 Introduction)
- The query executor should work on the compressed form when it can. "it is also desirable to have the DBMS query executor operate on the compressed representation whenever possible to avoid the cost of decompression" (1 Introduction)
- Even warehouses need updates, and there's a tension between updates and read-optimized layout. "There is a tension between providing updates and optimizing data structures for reading." (1 Introduction)
- Keeping columns in insertion order makes appends easy but reads slower; keeping them sorted makes inserts expensive. "However, storing columns in non-entry sequence will make insertions very difficult and expensive." (1 Introduction)
- C-Store's answer: a small writeable store and a large read-optimized store joined by a tuple mover. "we combine in a single piece of system software, both a read-optimized column store and an update/insert-oriented writeable store, connected by a tuple mover" (1 Introduction)
- The read store only takes batch moves from the write store. "supports only a very restricted form of insert, namely the batch movement of records from WS to RS, a task that is performed by the tuple mover of Figure 1." (1 Introduction)
- Columns sorted on the same attribute form a "projection"; a column can appear in several projections with different sort orders. "Groups of columns sorted on the same attribute are referred to as “projections”" (1 Introduction)

## Visuals worth redrawing

- Figure 1: Writeable Store on top, Tuple Mover, Read-optimized Store
  below.

## My notes

- Performance numbers in the paper are "preliminary" on a TPC-H subset;
  not used.
