---
id: adya-generalized-isolation-2000
title: "Generalized Isolation Level Definitions"
author: Atul Adya, Barbara Liskov, Patrick O'Neil
url: https://pmg.csail.mit.edu/papers/icde00.pdf
kind: paper
primary: true
---

## Summary

The ICDE 2000 paper that redefines the isolation levels without
assuming locking. It builds a direct serialization graph (DSG) from
three kinds of dependency between committed transactions, and defines
each level by which cycles the graph may not contain.

## Key claims

- The locking-based fix from Berenson et al. rules out optimistic and multi-version systems. "these definitions were simply “disguised versions of locking” and therefore disallow optimistic and multi-version mechanisms." (1 Introduction)
- Write-dependency (ww): Tj installs the next version of something Ti wrote. "A transaction Tj directly write-depends on Ti if Ti installs a version xi and Tj installs x’s next version (after xi ) in the version order." (Definition 6)
- Anti-dependency (rw): Tj overwrites a version Ti read. "An anti-dependency occurs when a transaction overwrites a version observed by some other transaction." (4.4.2)
- Read-dependency (wr): Tj reads a version Ti installed (Figure 2).
- The DSG has one node per committed transaction and an edge for each direct dependency. "Each node in the graph corresponds to a committed transaction and directed edges correspond to different types of direct conflicts." (Definition 7)
- G0, write cycles. "A history H exhibits phenomenon G0 if DSG(H) contains a directed cycle consisting entirely of write-dependency edges." (5.1)
- G1c, circular information flow. "A history H exhibits phenomenon G1c if DSG(H) contains a directed cycle consisting entirely of dependency edges." (5.2)
- G2, anti-dependency cycles. "A history H exhibits phenomenon G2 if DSG(H) contains a directed cycle with one or more anti-dependency edges." (5.3)
- PL-3 (serializable) forbids G1 and G2, so no cycles at all. "Thus, all cycles are precluded at this level." (5.3)
- What real systems provide is conflict serializability. "All realistic implementations provide conflictserializability; thus, our PL-3 conditions provide what is normally considered as serializability." (5.3)
- Two-phase locking with long read and write locks rules out every cycle. "the lock-based implementation of PL-3 (long read/writelocks) disallows phenomenon G2 also since two-phase locking is known to provide complete serializability." (5.3)
- The DSG only covers committed transactions. "A DSG does not capture all information in a history and hence it does not replace the history, e.g., a DSG only records information about committed transactions." (Definition 7)
- Predicate reads get anti-dependencies too: a write that changes which rows match a query counts as overwriting that read. "Tj installs a later version of some object that changes the matches of a predicatebased read" (4.4.2, Directly predicate-anti-depends)

## Visuals worth redrawing

- Figure 3: the DSG for a serial history with ww, wr and rw edges and no
  cycle.

## My notes

- pmg.csail.mit.edu refused connections when this was written; the PDF
  was opened from the Internet Archive's copy of that URL.
- The full treatment is Adya's 1999 PhD thesis, not opened.
