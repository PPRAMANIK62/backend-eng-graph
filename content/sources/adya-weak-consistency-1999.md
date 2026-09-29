---
id: adya-weak-consistency-1999
title: "Weak Consistency: A Generalized Theory and Optimistic Implementations for Distributed Transactions"
author: Atul Adya (MIT PhD thesis, supervised by Barbara Liskov)
url: https://publications.csail.mit.edu/lcs/pubs/pdf/MIT-LCS-TR-786.pdf
kind: paper
primary: true
---

## Summary

Adya's thesis (MIT LCS TR-786, 1999), the full version of the
"Generalized Isolation Level Definitions" work. It defines isolation
levels by the cycles that may not appear in a Direct Serialization Graph
(DSG) of committed transactions, instead of by locking rules, so the
definitions also fit optimistic and multi-version databases. Read for
chapter 3 (dependencies, DSG, G0 to G2, PL-3, PL-2.99) and section 4.1
(G-single).

## Key claims

- Three kinds of direct conflict between committed transactions. "read-dependency, anti-dependency, and write-dependency" (section 3.2, before Definition 2)
- Read-depends: Tj reads a version Ti installed. "Ti installs some object version xi and Tj reads xi" (Definition 2)
- Anti-depends: Tj installs the next version of something Ti read; the edge goes from the reader to the later writer. "the transaction that wrote the later version directly item-anti-depends on the transaction that read the earlier version." (Definition 4)
- Predicate anti-dependencies cover rows inserted into or deleted from a predicate's match, the phantom case. "This definition handles inserts and deletes." (Definition 4)
- Write-depends: Tj installs the version right after one Ti installed. "Ti installs a version xi and Tj installs x's next version (after xi ) in the version order." (Definition 5)
- The DSG has one node per committed transaction and an edge per direct conflict. "Each node in DSG(H) corresponds to a committed transaction in H and directed edges correspond to different types of direct conflicts." (Definition 8)
- The DSG only covers committed transactions, so some conditions use the history itself. "a DSG only records information about committed transactions." (section 3.2)
- G0 is a cycle of write dependencies only. "DSG(H) contains a directed cycle consisting entirely of write-dependency edges." (G0: Write Cycles)
- G1c is a cycle of read and write dependencies. "DSG(H) contains a directed cycle consisting entirely of dependency edges." (G1c: Circular Information Flow)
- G2 is a cycle with at least one anti-dependency. "DSG(H) contains a directed cycle having one or more anti-dependency edges." (G2: Anti-dependency Cycles)
- The dirty-read phenomenon P1 is split into three: aborted reads (G1a), intermediate reads (G1b) and circular information flow (G1c). "We address the three guarantees due to P1 by the following three phenomena, G1a, G1b, and G1c." (section 3.2.2)
- G1a: a committed transaction read something written by a transaction that aborted. "it contains an aborted transaction Ti and a committed transaction Tj such that Tj has read some object (maybe via a predicate) modified by Ti ." (G1a: Aborted Reads)
- PL-3 forbids G1 and G2, and is what people mean by serializability (conflict serializability). "our PL-3 conditions essentially provide what is normally considered as serializability." (section 3.2.3)
- G2-item counts only item anti-dependencies, not predicate ones; PL-2.99 (repeatable read) forbids G1 and G2-item. "Level PL-2.99 is defined as one that proscribes G1 and G2-item." (section 3.2.4)
- G-single: a cycle with exactly one anti-dependency edge; PL-2+ forbids it. "DSG(H) contains a directed cycle with exactly one anti-dependency edge." (section 4.1)
- A lost update shows up as a DSG cycle. "since the DSG for history Hlost,update contains a cycle (see Figure 3-4), it is disallowed by PL-3." (section 3.2.3)

## Visuals worth redrawing

- Figure 3-4: the DSG of a lost update, three transactions with wr, ww
  and rw edges forming a cycle.

## My notes

- The ICDE 2000 paper link (pmg.csail.mit.edu/papers/icde00.pdf) that
  Elle's README cites returned 403 Forbidden when I tried it; this thesis
  on the MIT publications server has the same definitions in full. The
  ICDE paper has its own note, adya-generalized-isolation-2000.
- The version order comes from inside the database. The thesis treats it
  as given; a black-box checker has to infer it.
