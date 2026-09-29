---
id: armbrust-delta-lake-2020
title: "Delta Lake: High-Performance ACID Table Storage over Cloud Object Stores"
author: Michael Armbrust, Tathagata Das, Liwen Sun, Burak Yavuz, Shixiong Zhu, and others (Databricks)
url: https://www.vldb.org/pvldb/vol13/p3411-armbrust.pdf
kind: paper
primary: true
---

## Summary

The VLDB 2020 paper on Delta Lake. Why "a directory of Parquet files on
S3" breaks down (no multi-object atomicity, slow LIST, eventual
consistency at the time), and how a transaction log stored in the
object store itself gives ACID commits, time travel and fast planning.
Section 2 is a good description of object store APIs and performance
as of 2020.

## Key claims

- Object stores are key-value stores with no cross-key consistency. "most cloud object stores are merely key-value stores, with no crosskey consistency guarantees." (1 Introduction)
- No cheap renames. "but unlike file systems, cloud object stores do not provide cheap renames of objects or of “directories”." (2.1 Object Store APIs)
- LIST is slow: 1,000 keys per call, tens to hundreds of ms each. "S3’s LIST only returns up to 1000 keys per call, and each call takes tens to hundreds of milliseconds" (2.1 Object Store APIs)
- LIST walks keys in lexicographic order from a start key. "can generally list the available objects in a bucket by lexicographic order of key, given a start key." (2.1 Object Store APIs)
- In 2020, S3 LIST was eventually consistent. "S3’s LIST operations are always eventually consistent" (2.2 Consistency Properties)
- Some stores support appends. "Some systems also support appends to an object" (2.1 Object Store APIs)
- Byte-range reads make columnar formats work. "When reading an object, cloud object stores usually support byterange requests" (2.1 Object Store APIs)
- Each read has 5 to 10 ms base latency, then about 50 to 100 MB/s. "Each read operation usually incurs at least 5–10 ms of base latency, and can then read data at roughly 50–100 MB/s" (2.3 Performance Characteristics)
- Updating means rewriting the whole object. "Updating objects usually requires rewriting the whole object at once." (2.1 Object Store APIs)
- Three rules: keep hot data sequential (columnar), make objects large but not too large, avoid LIST. "Make objects large, but not too large." (2.3 Implications for Table Storage)
- Parquet footers hold min/max stats, but reading them on an object store can cost more than the query. "these data skipping checks can take longer than the actual query." (1 Introduction)
- The directory-of-files layout came from Hive. "It originated in Apache Hive on HDFS" (2.4, Directories of Files)
- Directories of files have no atomicity across objects. "Any transaction that needs to write or update multiple objects risks having partial writes visible to other clients." (2.4, Challenges)
- About half of Databricks' early support escalations were storage-related. "around half the support escalations we received were due to data corruption, consistency or performance issues due to cloud storage strategies" (1 Introduction)
- The core idea: an ACID log of which objects are in the table, stored in the object store. "we maintain information about which objects are part of a Delta table in an ACID manner, using a write-ahead log that is itself stored in the cloud object store." (1 Introduction)
- Remove actions keep a timestamp; files are deleted later so old snapshots keep working. "This delay allows concurrent readers to continue to execute against stale snapshots of the data." (3.1.2 Log)
- Log IDs are zero-padded so LIST returns them in order. "Zero-padding the IDs of log records makes it efficient for clients to find all the new records after a checkpoint using the lexicographic LIST operations available on object stores." (3.1.2 Log, footnote 2)
- Actions include metadata changes and adding or removing files. "The add and remove actions are used to modify the data in a table by adding or removing individual data objects respectively." (3.1.2 Log)
- Checkpoints every 10 commits by default. "By default, our clients write checkpoints every 10 transactions." (3.1.3 Log Checkpoints)
- Commit needs put-if-absent on the next log record. "only one client should succeed in creating the object with that name." (3.2.2, Adding Log Records Atomically)
- GCS and Azure Blob Store already had put-if-absent. "Google Cloud Storage and Azure Blob Store support atomic put-if-absent operations, so we use those." (3.2.2, Adding Log Records Atomically)
- New data objects get GUID names and are written before the commit. "generating the object names using GUIDs." (3.2.2, write step 3)
- Readers start from the last checkpoint and LIST forward. "Use a LIST operation whose start key is the last checkpoint ID if present, or 0 otherwise" (3.2.1 Reading from Tables, step 2)
- In 2020 S3 had no put-if-absent, so Databricks used a separate coordination service. "Amazon S3 does not have atomic “put if absent” or rename operations." (3.2.2, Adding Log Records Atomically)
- Writes are serializable; only single-table transactions. "Importantly, Delta Lake currently only supports transactions within one table." (3.3 Available Isolation Levels)
- Every write transaction is serializable, in log order. "all transactions that perform writes are serializable, leading to a serial schedule in increasing order of log record IDs." (3.3 Available Isolation Levels)
- Streaming writers record their progress in the same commit to get exactly-once. "stream processing systems that write to a Delta table need to know which of their writes have previously been committed in order to achieve “exactly-once” semantics" (3.1.2 Log, Update Application Transaction IDs)
- Commit rate is a few per second because each commit is an object store write. "limiting the write transaction rate to several transactions per second." (3.4 Transaction Rates)
- Object store write latency limits commits. "the latency of writes to object stores can be tens to hundreds of milliseconds" (3.4 Transaction Rates)
- Delta was not alone: Hudi and Iceberg use the same design. "two other software packages also support it now — Apache Hudi [8] and Apache Iceberg [10]." (2.4, Metadata in Object Stores)
- Reads need several hundred KB to reach half of peak throughput, and megabytes to approach it. "an operation needs to read at least several hundred kilobytes to achieve at least half the peak throughput for sequential reads, and multiple megabytes to approach the peak throughput." (2.3 Performance Characteristics, text interleaved across columns)
- Applications need parallel reads to reach full throughput. "applications need to run multiple reads in parallel to maximize throughput." (2.3)
- Listing millions of objects one call at a time takes minutes. "so it can take minutes to list a dataset with millions of objects using a sequential implementation." (2.4, Challenges; text interleaved across columns)
- The escalations were from the first years of the cloud service, with examples. "in the first few years of Databricks’ cloud service (2014–2016), around half the support escalations we received were due to data corruption, consistency or performance issues due to cloud storage strategies (e.g., undoing the effect of a crashed update job, or improving the performance of a query that reads tens of thousands of objects)." (1 Introduction; text interleaved with the copyright box in the PDF)
- A crashed multi-object update leaves the table corrupt. "if an update query crashes, the table is in a corrupted state." (1 Introduction)
- For S3, Databricks used a separate coordination service for commits. "In Databricks service deployments, we use a separate lightweight coordination service to ensure that only one client can add a record with each log ID." (3.2.2, Adding Log Records Atomically; text interleaved across columns)

## Visuals worth redrawing

- Figure 2: objects in a sample Delta table (data files by date,
  `_delta_log/` with numbered JSON records and a Parquet checkpoint).

## My notes

- Section 2.2's consistency description is from before S3 became
  strongly consistent; the article must say so.
- The paper's 5 TB object size limit is out of date.
