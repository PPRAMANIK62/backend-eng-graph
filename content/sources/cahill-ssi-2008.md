---
id: cahill-ssi-2008
title: Serializable Isolation for Snapshot Databases
author: Michael J. Cahill, Uwe Röhm, Alan D. Fekete
url: https://people.eecs.berkeley.edu/~kubitron/courses/cs262a-F13/handouts/papers/p729-cahill.pdf
kind: paper
primary: true
---

## Summary

The SIGMOD 2008 paper that introduced serializable snapshot isolation.
Run transactions under snapshot isolation, watch for read-write
dependencies between concurrent transactions at runtime, and abort one
when two of them line up around a "pivot". Prototyped in Berkeley DB.
Read from a copy on a Berkeley course page (the ACM copy is paywalled).

## Key claims

- The goal: prevent SI anomalies at runtime for any application, without the old manual analysis. "This paper describes a modification to the concurrency control algorithm of a database management system that automatically detects and prevents snapshot isolation anomalies at runtime for arbitrary applications, thus providing serializable isolation." (Abstract)
- It keeps SI's no-blocking property. "The new algorithm preserves the properties that make snapshot isolation attractive, including that readers do not block writers and vice versa." (Abstract)
- Before this, the only way out was changing the application. "Until now, the only way to prevent these anomalies was to modify the applications by introducing artificial locking or update conflicts, following careful analysis of conflicts between all pairs of transactions." (Abstract)
- First-Committer-Wins defined. "In order to prevent Lost Update anomalies, SI does abort a transaction T when a concurrent transaction commits a modification to an item that T wishes to update. This is called the “First-Committer-Wins” rule." (1)
- Vocabulary: a vulnerable edge is an rw-dependency between concurrent transactions; two in a row is a dangerous structure; the middle transaction is the pivot. "We refer to the transaction at the junction of the two consecutive vulnerable edges as a pivot transaction." (2.3)
- Every non-serializable SI execution has a pivot. "The theory of [9] shows that there is a pivot in any non-serializable execution allowed by SI." (2.3)
- Oracle and Postgres (at the time) gave SI when serializable was requested. "In some systems that do not implement S2PL, including the Oracle RDBMS and PostgreSQL, SI is provided when serializable isolation is requested." (2.3)
- Detection uses a new non-blocking SIREAD lock mode. "However, obtaining the SIREAD lock does not cause any blocking, even if a WRITE lock is held already" (3.1)
- Two flags per transaction: an incoming and an outgoing rw edge. "T.inConflict indicates whether there is an rw-dependency from another concurrent transaction to T, and T.outConflict indicates whether there is an rw-dependency from T to another concurrent transaction." (3.1)

## Visuals worth redrawing

- Figure 3: the generalized dangerous structure (two consecutive rw edges
  around a pivot).

## My notes

- Postgres's version (ports-ssi-postgresql-2012) replaced the two flags
  with lists of conflicts and added the read-only optimizations.
