---
id: wu-mvcc-evaluation-2017
title: An Empirical Evaluation of In-Memory Multi-Version Concurrency Control
author: Yingjun Wu, Joy Arulraj, Jiexi Lin, Ran Xian, Andrew Pavlo
url: https://www.vldb.org/pvldb/vol10/p781-Wu.pdf
kind: paper
primary: false
---

## Summary

PVLDB volume 10 (2017). Breaks MVCC into four design choices
(concurrency control protocol, version storage, garbage collection, index
management), surveys which real systems picked what (Table 1), and
measures each choice inside one in-memory engine (Peloton). The survey
and the version storage section are the parts used here; the numbers are
for in-memory engines and aren't used.

## Key claims

- MVCC dates to the late 1970s and is now in almost every major relational system. "Although MVCC was discovered in the late 1970s, it is used in almost every major relational DBMS released in the last decade." (Abstract)
- Four design decisions. "we conduct an extensive study of the scheme’s four key design decisions: concurrency control protocol, version storage, garbage collection, and index management." (Abstract)
- Table 1: Oracle (MVCC since 1984) and MySQL-InnoDB (2001) use delta storage; Postgres (1985) uses append-only storage with oldest-to-newest chains; Postgres indexes use physical pointers, InnoDB logical pointers (primary key). (Table 1)
- An update always creates a new physical version. "Under MVCC, the DBMS always constructs a new physical version of a tuple when a transaction updates it." (4)
- The versions of a tuple form a linked list, the version chain. "The DBMS uses the tuples’ pointer field to create a latch-free linked list called a version chain." (4)
- Append-only: every version in the same table space; Postgres does this. "In this first scheme, all of the tuple versions for a table are stored in the same storage space. This approach is used in Postgres, as well as in-memory DBMSs like Hekaton, NuoDB, and MemSQL." (4.1)
- Append-only copies the whole current version, then applies the change to the copy. "It then copies the content of the current version to the new version. Finally, it applies the modifications to the tuple in the newly allocated version slot." (4.1)
- Oldest-to-newest chains don't touch indexes on update, but reads may walk a long chain. "But the DBMS potentially traverses a long version chain to find the latest version during query processing." (4.1)
- So O2N depends on pruning old versions. "Thus, achieving good performance with O2N is highly dependent on the system’s ability to prune old versions." (4.1)
- Newest-to-oldest: the head changes on every update, so every index must be updated. "The DBMS then updates all of the table’s indexes (both primary and secondary) to point to the new version." (4.1)
- Delta storage: the main table holds the master version, old values go to a separate delta storage (MySQL's and Oracle's rollback segment). "This storage is referred to as the rollback segment in MySQL and Oracle, and is also used in HyPer." (4.3)
- A delta holds only the changed columns' old values, and the master is updated in place. "version contains the original values of modified attributes rather than the entire tuple. The DBMS then directly performs in-place update to the master version in the main table." (4.3)
- Delta is good for updates of a few columns, worse for reads of old versions. "This scheme is ideal for UPDATE operations that modify a subset of a tuple’s attributes because it reduces memory allocations." (4.3)
- Garbage collection is required, or the system runs out of space and chains grow. "Since MVCC creates new versions when transactions update tuples, the system will run out of space unless it reclaims the versions that are no longer needed." (5)
- A version is garbage when it came from an aborted transaction or no active transaction can see it. "The DBMS considers a version as expired if it is either an invalid version (i.e., created by an aborted transaction) or it is not visible to any active transaction." (5)
- Background vacuuming is the most common GC approach. "As shown in Table 1, this is the most common approach in MVCC DBMSs as it is easier to implement and works with all version storage schemes." (5.1)
- Long-running transactions hold back GC. "The DBMS’s performance drops in the presence of long-running transactions. This is because all the versions generated during the lifetime of such a transaction cannot be removed until it completes." (5.3)
- Old versions kept forever allow time travel queries. "If the DBMS never removes old versions, then the system can also support “time-travel” operations that allow an application to query a consistent snapshot of the database as it existed at some point of time in the past" (2.1)
- The first description and first implementation. "in a 1979 dissertation [38] and the first implementation started in 1981 [22] for the InterBase DBMS (now open-sourced as Firebird)." (1)
- Time-travel storage keeps old versions in a separate table. "The DBMS maintain a master version of each tuple in the main table and multiple versions of the same tuple in a separate time-travel table." (4.2)
- Delta storage makes reads of several columns walk the chain. "This approach, however, leads to higher overhead for read-intensive workloads." (4.3)
- Append-only suits big scans. "The append-only scheme is better for analytical queries that perform large scans because versions are stored contiguously in memory, which minimizes CPU cache misses and is ideal for hardware prefetching." (4.4)
- No scheme wins everywhere. "As such, none of them achieve optimal performance for either workload type." (4.4)

## Visuals worth redrawing

- Figure 3: append-only (O2N and N2O), time-travel and delta storage side by side.
- Figure 4: tuple-level vs transaction-level garbage collection.

## My notes

- primary: false for Postgres and InnoDB: the authors survey those
  systems, they didn't build them.
- The paper only studies serializable execution in memory. Its
  throughput numbers don't transfer to disk-based Postgres or InnoDB.
