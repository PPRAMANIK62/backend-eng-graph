---
id: postgres-readme-ssi
title: "src/backend/storage/lmgr/README-SSI (PostgreSQL 18 source)"
author: The PostgreSQL Global Development Group
url: https://github.com/postgres/postgres/blob/REL_18_STABLE/src/backend/storage/lmgr/README-SSI
kind: code
primary: true
---

## Summary

The design notes for Postgres's Serializable Snapshot Isolation and the
predicate locking under it (REL_18_STABLE, same as master when read).
Explains S2PL as the classic way to get serializability, why Postgres
chose SSI instead, and how SIREAD locks are taken on tuples, pages,
relations and index ranges.

## Key claims

- S2PL is the classic technique. "The primary technique which has been used is Strict Two-Phase Locking (S2PL), which operates by blocking writes against data which has been read by concurrent transactions and blocking any access (read or write) against data which has been written by concurrent transactions." (Serializable Isolation Implementation Strategies)
- Under S2PL a cycle of blocking is a deadlock. "A cycle in a graph of blocking indicates a deadlock, requiring a rollback." (same)
- The cost under contention. "Blocking and deadlocks under S2PL in high contention workloads can be debilitating, crippling throughput and response time." (same)
- Under S2PL the serial order is the commit order. "But successful transactions can always be viewed as having occurred sequentially, in the order they committed." (Apparent Serial Order of Execution)
- Both S2PL and SSI need predicate locking. "Both S2PL and SSI require some form of predicate locking to handle situations where reads conflict with later inserts or with later updates which move data into the selected range." (Predicate Locking)
- Real predicate locking locks what was accessed, at several sizes, and escalates. "Practical implementations of predicate locking generally involve acquiring locks against data as it is accessed, using multiple granularities (tuple, page, table, etc.) with escalation as needed to keep the lock count to a number which can be tracked within RAM structures." (Predicate Locking)
- Coarse locks cause false positives, and the plan matters. "Coarse granularities can cause some false positive indications of conflict. The number of false positives can be influenced by plan choice." (Predicate Locking)
- SIREAD locks don't block, so intent locking doesn't apply. "Intent locking (locking higher level objects before locking lower level objects) doesn't work with non-blocking" locks, which the README calls "more like flags than locks" (Implementation overview)
- The lock memory is fixed at start. "A configurable amount of shared memory is reserved at postmaster start-up to track predicate locks." (Implementation overview)
- Fine locks get promoted. "To prevent resource exhaustion, multiple fine-grained locks may be promoted to a single coarser-grained lock as needed." (Implementation overview)
- A table scan locks the whole relation. "For a table scan, the entire relation will be locked." (Heap locking)
- A write to something covered by a SIREAD lock is a read-write conflict. "Modifying a heap tuple creates a rw-conflict with any transaction that holds a SIREAD lock on that tuple, or on the page or relation that contains it." (Heap locking)
- For index scans, lock the gaps. "Conceptually, we want to lock the gaps between and surrounding index entries within the scanned range." (Index AM implementations)
- B-tree locks leaf pages. "B-tree index searches acquire predicate locks only on the index *leaf* pages needed to lock the appropriate index range." (Index AM implementations)
- An index type without support locks the whole index. "For an index AM that doesn't have support for predicate locking, we just acquire a predicate lock on the whole index for any search." (Index AM implementations)
- Most of the code is predicate locking. "This code is in the lmgr directory because about 90% of it is an implementation of predicate locking, which is required for SSI, rather than being directly related to SSI itself." (top)
- SSI keeps SI's non-blocking behaviour. "In particular, reads don't block anything and writes don't block reads." (Serializable Isolation Implementation Strategies)
- It can roll back more than needed, but never lets an anomaly through. "It will produce some false positives (where a transaction is rolled back even though there would not have been an anomaly), but will never let an anomaly occur." (Serializable Isolation Implementation Strategies)
- A reader of an old version appears to run before the concurrent writer. "The reading transaction appears to have executed first, regardless of the actual sequence of transaction starts or commits, because it sees a database state prior to that in which the other transaction leaves it." (Apparent Serial Order of Execution)
- Only rw-conflicts need tracking. "This means it only needs to track rw-conflicts between concurrent transactions, not wr- and ww-dependencies." (SSI Algorithm)
- Optimization: roll back only if Tout commits first. "We only roll back a transaction if Tout commits before Tpivot and Tin." (SSI Algorithm)
- SSI only protects transactions that run at SERIALIZABLE. "If you want to enforce business rules through SSI, all transactions should be run at the SERIALIZABLE transaction isolation level, and that should probably be set as the default." (PostgreSQL Implementation)
- Declaring READ ONLY helps. "Performance under this SSI implementation will be significantly improved if transactions which don't modify permanent tables are declared to be READ ONLY before they begin reading data." (PostgreSQL Implementation)
- Many active transactions hurt more than at lower levels. "Performance under SSI will tend to degrade more rapidly with a large number of active database transactions than under less strict isolation levels." (PostgreSQL Implementation)
- Outside SERIALIZABLE, row locks for reads are asked for explicitly. "business rules can be enforced in triggers or application code without ever having a need to acquire an explicit lock or to use SELECT FOR SHARE or SELECT FOR UPDATE." (PostgreSQL Implementation)

## Visuals worth redrawing

None.

## My notes

- Postgres's B-tree predicate locks are page-sized, coarser than
  InnoDB's next-key locks; Ports and Grittner say next-key locking was
  planned.
