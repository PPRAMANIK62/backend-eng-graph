---
id: ports-ssi-postgresql-2012
title: Serializable Snapshot Isolation in PostgreSQL
author: Dan R. K. Ports, Kevin Grittner
url: https://drkp.net/papers/ssi-vldb12.pdf
kind: paper
primary: true
---

## Summary

The VLDB 2012 paper by the people who built Postgres's SERIALIZABLE
level. Section 2 explains why snapshot isolation isn't serializable with
two examples (doctors on call, a batch-processing report), and the ways
people work around it; section 3 reviews the theory (rw-antidependencies,
dangerous structures) behind SSI.

## Key claims

- Doctors on call, figure 1: each transaction counts doctors on call and, if at least two, takes one off. "Each checks whether there are at least two doctors on call, and if so takes one doctor off call." (2.1.1)
- Run one at a time, the rule holds. "Given an initial state where Alice and Bob are the only doctors on call, it can easily be verified that executing T1 and T2 sequentially in either order will leave at least one doctor on call" (2.1.1)
- Under snapshot isolation, both see two doctors and both go off call. "Both transactions read from a snapshot taken when they start, showing both doctors on call." (2.1.1)
- Row write locks don't help because the rows differ. "The write locks taken on update don’t solve this problem, because the two transactions modify different rows and thus do not conflict." (2.1.1)
- Two-phase locking or optimistic concurrency would stop it. "By contrast, in two-phase locking DBMS, each transaction would take read locks that would conflict with the other’s write." (2.1.1)
- And optimistic concurrency would too. "Similarly, in an optimistic-concurrency system, the second transaction would fail to commit because its read set is no longer up to date." (2.1.1)
- Batch processing, figure 2: a read-only REPORT can be part of an anomaly. "Interestingly, this anomaly requires all three transactions, including T1 – even though it is read-only." (2.1.2)
- SI anomalies are silent. "In particular, snapshot isolation anomalies are difficult to deal with because they typically manifest themselves as silent data corruption (e.g. lost updates)." (2)
- Workarounds without serializable: explicit locks. "PostgreSQL provides explicit locking at the table level via the LOCK TABLE command, and at the tuple level via SELECT FOR UPDATE." (2.2)
- Workaround: materialize the conflict. "alternatively, the conflict can be materialized by creating a dummy row to represent the conflict, and forcing every transaction involved to update that row" (2.2)
- Workaround: a real constraint. "if the desired goal is to enforce an integrity constraint, and that constraint can be expressed to the DBMS (e.g. using a foreign key, uniqueness, or exclusion constraint), then the DBMS can enforce it regardless of isolation level." (2.2)
- Finding anomalies by hand is hard: every pair of transactions has to be considered. "Thus, each transaction must be analyzed in the context of all other transactions that it might run concurrently with." (2.2)
- The authors' view: put serializability in the database. "Our view is that providing serializability in the database is an important simplification for application developers, because concurrency issues are notoriously difficult to deal with." (2.2)
- rw-antidependency: T2 reads a version T1 later replaced, so T1 appears after T2. "rw-antidependencies: if T1 writes a version of some object, and T2 reads the previous version of that object, then T1 appears to have executed after T2 , because T2 did not see its update." (3.1)
- Predicate reads create them too. "For example, if T1 scans a table for all rows where x = 1, and T2 subsequently inserts a new row matching that predicate" (3.1), that is an rw-antidependency from T1 to T2.
- In the doctors example each transaction's update is invisible to the other's read, giving rw edges both ways: a cycle. "Similarly, T2 ’s UPDATE is not visible to T1 , creating a rw-antidependency in the opposite direction." (3.1)
- Every anomaly cycle under SI has two adjacent rw edges (Adya; Fekete et al.). "Adya [1] observed that every cycle in the serialization graph (i.e. every anomaly) contains at least two rw-antidependency edges." (3.2)
- SSI aborts on a "dangerous structure" and can have false positives. "Theorem 1 shows that doing so ensures serializable execution, but it may have false positives because not every dangerous structure is part of a cycle." (3.3)
- Postgres rows carry the creating and deleting transaction ids. "Each tuple is tagged with the transaction ID of the transaction that created it (xmin), and, if it has been deleted or replaced with a new version, the transaction that did so (xmax)." (5.1)
- A snapshot is the set of transactions whose effects it sees. "All queries in PostgreSQL are performed with respect to a snapshot, which is represented as the set of transactions whose effects are visible in the snapshot." (5.1)
- Unlike Oracle, Postgres doesn't update in place with a rollback log. "Here, PostgreSQL differs from other MVCC implementations (e.g. Oracle’s) that update tuples in-place and keep a separate rollback log." (5.1)
- MVCC replaced Postgres's locking storage manager in 1999. "its replacement with a multiversion concurrency control (MVCC) system in 1999 was one of the first major accomplishments of the PostgreSQL open-source community." (3)
- Oracle's SERIALIZABLE is snapshot isolation. "users requesting SERIALIZABLE mode actually received snapshot isolation (as they still do in the Oracle DBMS)." (2)
- SI's write rule uses row write locks in Postgres. "Like most SI databases, PostgreSQL uses tuple-level write locks to implement this restriction." (2.1)
- The common mistake about the three ANSI anomalies. "For example, there is a common misconception that avoiding the aforementioned three anomalies is a sufficient condition for serializability" (2.1)
- Some workloads, like TPC-C, are already serializable under SI. "some workloads simply don’t experience any anomalies; their behavior is serializable under snapshot isolation." (2.2)
- SSI allows more than S2PL or OCC. "SSI allows some rw-conflicts as long as they do not form a dangerous structure, a less restrictive requirement." (3.3)
- SIREAD locks outlive the reader's commit. "Furthermore, SIREAD locks must persist after a transaction commits" (3.3)
- They're kept until every overlapping transaction has committed. "Corollary 2 implies that the locks must be retained until all concurrent transactions commit." (3.3)
- Write-before-read conflicts come from MVCC data. "If the write happens first, then the conflict can be inferred from the MVCC data, without using locks." (5.2)
- Read-before-write conflicts need the SIREAD lock manager, which can't block. "The SSI lock manager stores only SIREAD locks. It does not support any other lock modes, and hence cannot block." (5.2)
- B-tree predicate locks were page-granular in 9.1. "Currently, locks on B+-tree indexes are acquired at page granularity; we intend to refine this to next-key locking [16] in a future release." (5.2.1)
- Safe retry: abort the one that conflicts with an already committed transaction. "the key principle for ensuring safe retry is to abort a transaction that conflicts with a committed transaction." (5.4)
- Prefer aborting the pivot. "Always choose to abort T2 if possible, i.e. if it has not already committed." (5.4)
- Deferrable read-only transactions wait for a safe snapshot. "Deferrable transactions always run on a safe snapshot, but may block before their first query." (4.3)
- One long transaction can pin a lot of SSI state. "Thus, a single long-running transaction can easily prevent thousands of transactions from being cleaned up." (6)
- Headline cost, PostgreSQL 9.1. "Our experiments with a transaction processing and a web application benchmark show that our serializable mode has a performance cost of less than 7% relative to snapshot isolation, and outperforms two-phase locking significantly on some workloads." (Abstract)
- SIBENCH CPU overhead. "On this simple benchmark, tracking read dependencies has a CPU overhead of 10–20%." (8.1)
- DBT-2++ in memory. "For the in-memory configuration (Figure 5a), SSI causes a 5% slowdown relative to snapshot isolation because of increased CPU usage." (8.2)
- DBT-2++ failures. "Transactions rarely need to be retried; in all cases, the serialization failure rate was under 0.25%." (8.2)
- RUBiS (bidding mix, 85% read-only, 6 GB): SI 435 req/s, SSI 422, S2PL 208; serialization failures 0.004%, 0.03%, 0.76%. (8.3, Figure 6)
- Visibility is decided by checking xmin and xmax against the snapshot. "Checking which of these transactions are included in a snapshot determines whether the tuple should be visible." (5.1)
- An update is a delete plus a new tuple elsewhere in the heap. "Updating a tuple is, in most respects, identical to deleting the existing version and creating a new tuple." (5.1)
- The original POSTGRES storage manager used a conventional lock manager. "Indeed, the original POSTGRES storage manager inherited from the Berkeley research project had precisely that, using a conventional lock manager to provide concurrency control [19]" (3)
- Postgres long had no serializable level because 2PL was too expensive. "Until recently, PostgreSQL, a popular open-source database, did not provide a serializable isolation level because the standard two-phase locking mechanism was seen as too expensive." (1)
- S2PL is what other databases use. "Nearly all other databases that provide serializability do so using strict two-phase locking (S2PL)." (3)
- S2PL holds all locks to commit. "In S2PL, transactions acquire locks on all objects they read or write, and hold those locks until the transaction commits." (3)
- Its predicate locks are index-range locks. "To prevent phantoms, these locks must be predicate locks, usually implemented using index-range locks." (3)
- Why Postgres didn't do S2PL: the extra blocking. "Users accustomed to the “readers don’t block writers, and writers don’t block readers” mantra would be surprised by the additional blocking, and a S2PL approach was unpalatable to most of the developer community." (3)
- Commit order is the serial order under 2PL. "Two-phase locking has the property that the commit order of transactions matches the apparent serial order; the same is true of the standard optimistic concurrency control technique [15]." (7.2)
- Postgres's SIREAD locks use index-range locks too, at page size for B-trees. "Currently, locks on B+-tree indexes are acquired at page granularity; we intend to refine this to next-key locking [16] in a future release." (5.2.1)
- InnoDB and Berkeley DB already had strict 2PL. "Previous implementations of SSI were built atop Berkeley DB [7] or MySQL’s InnoDB [6, 18], both of which already supported strict two-phase locking." (5)
- The S2PL in the benchmarks was their own simple one. "To provide additional context, we also compare with a simple implementation of strict two-phase locking for PostgreSQL." (8)
- RUBiS has many read-write conflicts, so 2PL waits a lot. "Accordingly, two-phase locking incurs significant overhead from lock contention, as seen in Figure 6." (8.3)
- Most serializable databases use strict two-phase locking. "Nearly all other databases that provide serializability do so using strict two-phase locking (S2PL)." (3)
- rw-antidependencies only happen between concurrent transactions. "However, rw-antidependencies occur between concurrent transactions: one must start while the other was active." (3.2)
- In the dangerous structure, T3 commits first. "Furthermore, T3 must be the first transaction in the cycle to commit." (3.2, Theorem 1)
- Read-only snapshot ordering rule. "if a dangerous structure is detected where T1 is read-only, it can be disregarded as a false positive unless T3 committed before T1 ’s snapshot." (4.1)
- A snapshot taken with no read/write transactions running is safe at once. "An important special case is a snapshot taken when no read/write transactions are active; such a snapshot is immediately safe and a read-only transaction using it incurs no SSI overhead." (4.2)
- Deferrable transactions waited a few seconds in their test. "deferrable transactions can usually obtain a safe snapshot within 1–6 seconds (and never more than 20 seconds)." (4.3)
- Test setups: SIBENCH on a 2.83 GHz Core 2 Quad Q9550, 8 GB RAM, Ubuntu 11.10, database on tmpfs. "We ran this benchmark on a 2.83 GHz Core 2 Quad Q9550 system with 8 GB RAM running Ubuntu 11.10." (8.1) DBT-2++ (TPC-C-like plus a credit-check transaction) at 25 warehouses on tmpfs, and 150 warehouses disk-bound on a 16-core 1.60 GHz Xeon E7310; RUBiS on the Q9550 with a 7200 RPM disk. All PostgreSQL 9.1. (8.2, 8.3)
- First SSI in a production release. "It is the first implementation of SSI in a production database release." (Abstract)
- Why manual analysis failed at the Wisconsin courts: hundreds of tables, 20+ programmers, ORM queries. "with a complex schema (hundreds of relations), over 20 full-time programmers writing new queries, and queries being auto-generated by object-relational frameworks" (2.2)
- wr and ww edges both mean the first committed before the second began. "The same is true of ww-dependencies because of write locking." (3.2)
- Disk-bound DBT-2++: SSI matched SI. "Here, the performance of SSI is indistinguishable from that of SI." (8.2)
- Postgres defaults to READ COMMITTED, which takes no read locks. "PostgreSQL, like many other databases, uses its weakest isolation level, READ COMMITTED, by default." and it "can be implemented without read locks in PostgreSQL’s multiversion storage system" (1)
- SSI adds no blocking. "Another important factor was that SSI does not require any additional blocking." (3)
- In write skew the first and last transactions of the structure are one transaction. "Note that T1 and T3 may refer to the same transaction, for cycles of length 2 such as the one in the write-skew example (Figure 3a)." (3.2)
- READ COMMITTED takes a snapshot per query; REPEATABLE READ is snapshot isolation. "The weaker READ COMMITTED level essentially works the same way, but takes a new snapshot before each query rather than using the same one for the duration of the transaction" and "the snapshot isolation level remains available as REPEATABLE READ." (5.1)
- Row locks live in the tuple header; SELECT FOR UPDATE takes them too. "they are stored in the tuple header itself, reusing the xmax field to identify the lock holder. SELECT FOR UPDATE also acquires these locks." (5.2)
- The two rw edges must be adjacent, and SSI checks for that "dangerous structure" instead of full cycles. "[10] subsequently showed that two such edges must be adjacent" and "it checks for a “dangerous structure” of two adjacent rw-antidependency edges." (3.2, 3.3)

## Visuals worth redrawing

- Figure 1: the doctors-on-call interleaving as two columns of SQL.
- Figure 3(a): the two-node graph with rw edges both ways.

## My notes

- The doctors example is credited to Cahill et al. in the paper.
