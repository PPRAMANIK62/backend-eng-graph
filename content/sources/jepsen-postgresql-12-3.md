---
id: jepsen-postgresql-12-3
title: PostgreSQL 12.3 (Jepsen analysis)
author: Kyle Kingsbury (Jepsen)
url: https://jepsen.io/analyses/postgresql-12.3
kind: blog
primary: false
---

## Summary

Jepsen's report on PostgreSQL 12.3 (2020), the first run of Elle against a
single-node SQL database. It found that "repeatable read" is snapshot
isolation and allows G2-item, and that "serializable" allowed G2-item too,
from a bug in SSI's conflict detection that older hand-written tests had
never hit. Not primary for Postgres, but primary for Elle, since Jepsen
built it.

## Key claims

- Serializable on a single PostgreSQL node wasn't serializable. "transactions executed with serializable isolation on a single PostgreSQL instance were not, in fact, serializable." (summary)
- Before 9.1, the serializable level in PostgreSQL was really snapshot isolation; 9.1 added serializable snapshot isolation. "In version 9.1, PostgreSQL contributors Grittner and Ports added support for true serializability" (1 Background)
- The PostgreSQL repeatable read level is snapshot isolation. "isolation level is actually snapshot isolation" (3.1 Repeatable Read)
- The findings didn't need crashes. "our findings here do not require process crashes to reproduce." (2 Test Design)
- G2-item under repeatable read is allowed by the ANSI standard's loose wording. "This behavior is allowable due to long-discussed ambiguities in the ANSI SQL standard" (summary)
- Snapshot isolation forbids G-single but allows G2-item and G2. "SI prohibits G-single but allows G2-item and G2." (4.1 Recommendations)
- The workload: random transactions of appends and reads over list objects, keys chosen with exponential frequency, each list a row, stored as a comma-separated TEXT column. "The value of each list is stored as a comma-separated TEXT column." (2 Test Design)
- Appends used INSERT ... ON CONFLICT DO UPDATE, or an update with an insert fallback. "using INSERT ... ON CONFLICT DO UPDATE" (2 Test Design)
- Elle builds a dependency graph from the recorded history and searches it for cycles. "Elle infers a transaction dependency graph over experimentally recorded histories, and searches for cycles (and non-cyclic anomalies) in that graph." (2 Test Design)
- Also checked: internal consistency, duplicate effects, garbage values. "verifying that transactions observe values consistent with their own prior writes, duplicate effects, and garbage values" (2 Test Design)
- A worked cycle: T1 reads key 190 as [1 2]; T2 appends to 190, so T2 comes after T1 (rw); T3 reads 190 including T2's append (wr); T3 missed T1's append of 8 to key 188, so T3 comes before T1 (rw). Two rw edges: G2. "That anti-dependency implies the bottom transaction must have executed before the top transaction: a cycle!" (3.1 Repeatable Read)
- At repeatable read the anomaly was frequent, about 140 anti-dependency cycles per minute in one history. "which produced roughly 140 anti-dependency cycles per minute." (3.1)
- At serializable, a two-minute test found six G2-item cases. "In this two-minute test run, Jepsen detected six cases of G2-item." (3.2 Serializable)
- One cycle needed a read-only transaction that saw some, but not all, logically earlier writes. "The read-only transaction is necessary for this cycle" (3.2)
- Every G2-item at serializable involved a freshly inserted row. "Every instance of G2-item we observed under serializable isolation involved at least one read-write conflict for a freshly inserted row." (3.2)
- Cause: the conflict check could credit an updating transaction's XID for both the old and new version of a tuple, flagging the wrong transaction. "By flagging the wrong transaction as a potential conflict, it allowed a transaction to commit while failing to observe a prior transaction's writes." (3.2)
- The code had barely changed since SSI went in. "This code has gone essentially untouched since the introduction of serializable snapshot isolation in 2011." (3.2)
- The bug was present in 9.5.22, 10.13, 11.8, 12.3 and 13. "we confirmed that this bug was present in PostgreSQL 9.5.22, 10.13, 11.8, 12.3, and 13" (3.2)
- Hand-picked tests (Postgres's isolationtester, Hermitage, Jepsen's older bank test) relied on a few clever transactions with hand-proven invariants. "relied on executing a handful of cleverly constructed transactions with hand-proven invariants." (4 Discussion)
- Generating a broad class of transactions finds what nobody thought to test. "This property-based approach allows us to catch unexpected behaviors that no one thought to explicitly test." (4 Discussion)
- Testing shows bugs, not their absence. "we can prove the presence of bugs, but not their absence." (4 Discussion)
- Read committed looked correct: no G0, G1a or G1b seen. "we never observed G0 (dirty write), G1a (aborted read), or G1b (intermediate read)." (4 Discussion)
- Histories looked consistent with strong snapshot isolation and strict serializability (real-time order too), but Jepsen isn't sure that's guaranteed. "We are unsure if this is intentional, or whether it holds in all cases" (4.1 Recommendations)
- The list-append workload can't test deletes, replacements, aggregations, subqueries or stored procedures. "It seems unlikely that we can efficiently check, or even model, all functionality provided by modern SQL databases." (4.2 Future Work)
- No predicates, so Elle finds G2-item but not G2 in general. "This means that Elle can only identify G2-item, not G2 in generality." (4.2 Future Work)

## Visuals worth redrawing

- The cycle diagrams in 3.1 and 3.2: three transactions with rw and wr
  edges, drawn as a loop.

## My notes

- The report says a patch was scheduled for the next minor release; it
  doesn't name the version number, so don't state one.
- Hermitage (Kleppmann's hand-written test suite) is the contrast case.
