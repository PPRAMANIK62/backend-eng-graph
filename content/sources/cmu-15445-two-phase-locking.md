---
id: cmu-15445-two-phase-locking
title: "Lecture #16: Two-Phase Locking (15-445/645 Database Systems)"
author: Andy Pavlo, Jignesh Patel, Carnegie Mellon University
url: https://15445.courses.cs.cmu.edu/fall2023/notes/16-twophaselocking.pdf
kind: docs
primary: false
---

## Summary

CMU's Fall 2023 lecture notes on two-phase locking: shared and exclusive
locks, the growing and shrinking phases, strict 2PL, deadlock detection
and prevention, and lock hierarchies with intention locks. (The Fall
2024 copy of these notes returned 404.)

## Key claims

- A B+tree scan holds latches only on the leaf node it is on. "For example, in a B+ tree, you only hold latches over individual leaf nodes in a scan because that’s all you need to do to ensure correctness" (1)
- Locks are not latches. "Latches protect the DBMS’s internal data structures from concurrent threads whereas locks protect values in the database from concurrent transactions." (1)
- A central lock manager grants or blocks. "The DBMS contains a centralized lock manager that decides whether a transaction can acquire a lock or not." (1)
- Shared locks can be held by many; exclusive by one. "Only one transaction can hold an exclusive lock at a time." (1)
- The lock table doesn't need to survive a crash. "The DBMS’s lock-table does not need to be durable since any transaction that is active (i.e., still running) when the DBMS crashes is automatically aborted." (1)
- 2PL doesn't need to know the queries in advance. "The protocol does not need to know all of the queries that a transaction will execute ahead of time." (2)
- Shrinking starts at the first release. "Transactions enter the shrinking phase immediately after they release their first lock." (2)
- 2PL alone gives conflict serializability. "On its own, 2PL is sufficient to guarantee conflict serializability." (2)
- But it allows cascading aborts. "But it is susceptible to cascading aborts, which is when a transaction aborts and then another transaction must be rolled back, which results in wasted work." (2)
- Plain 2PL still allows dirty reads and deadlocks, and rejects some serializable schedules. "2PL can still have dirty reads and it can also lead to deadlocks." (2)
- Strong strict 2PL releases only at commit. "Strong Strict 2PL (also known as Rigorous 2PL) is a variant of 2PL where the transactions only release locks when they commit." (2)
- Waits-for graph. "To detect deadlocks, the DBMS creates a waits-for graph where transactions are nodes, and there exists a directed edge from Ti to Tj if transaction Ti is waiting for transaction Tj to release a lock." (3)
- The check is periodic, and missing one in a pass is fine. "Latches are not needed when constructing the graph since if the DBMS misses a deadlock in one pass, it will find it in the subsequent passes." (3)
- Trade-off of check frequency. "Note that there is a trade-off between the frequency of deadlock checks (uses CPU cycles) and the wait time until a deadlock is broken." (3)
- Victim selection can use age, progress, locks held, cascading rollbacks, or restart count; "There is no one choice that is better than others." (3)
- Prevention instead of detection: wait-die and wound-wait, using timestamps as priorities. "Wait-Die (“Old Waits for Young”): If the requesting transaction has a higher priority than the holding transaction, it waits." (3)
- Wound-wait: the older requester aborts the holder. "Wound-Wait (“Young Waits for Old”): If the requesting transaction has a higher priority than the holding transaction, the holding transaction aborts (gets wounded) and releases the lock." (3)
- Prevention kills at a conflict that could become a deadlock, not only at real ones. "When a transaction tries to acquire a lock held by another transaction (which could cause a deadlock), the DBMS can kill one of them." (3)
- Detection is usually a background thread. "periodically check for cycles in the waits-for graph (usually with a background thread) and then make a decision on how to break it." (3)
- Restarted transactions keep their timestamp. "When a transaction restarts, the DBMS reuses the same timestamp." (3)
- Fine locks cost lock-manager calls. "If a transaction wants to update one billion tuples, it has to ask the DBMS’s lock manager for a billion locks." (4)
- Intention locks signal locks lower down. "intention locks are implicit locks that signal that there are explicit locks held at lower levels." (4)

## Visuals worth redrawing

- The growing and shrinking phase plot (lock count over time) in the
  lecture slides; not in the notes PDF itself.

## My notes

- The notes define strict and "strong strict" 2PL; the Postgres SSI
  README and Ports and Grittner call the everyday version S2PL.
