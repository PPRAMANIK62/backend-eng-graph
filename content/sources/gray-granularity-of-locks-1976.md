---
id: gray-granularity-of-locks-1976
title: Granularity of Locks and Degrees of Consistency in a Shared Data Base
author: J. N. Gray, R. A. Lorie, G. R. Putzolu, I. L. Traiger
url: https://web.stanford.edu/class/cs245/readings/granularity-of-locks.pdf
kind: paper
primary: true
---

## Summary

The IBM Research paper (IFIP working conference, 1976) that introduced
locking at several sizes at once: a hierarchy of lockable units
(database, area, file, record), intention modes (IS, IX, SIX) on the
ancestors of whatever you really lock, and the rule of locking root to
leaf. The second half defines degrees of consistency (the ancestor of
isolation levels). Read as a scan hosted on a Stanford course page.

## Key claims

- Picking a lock size is a trade-off. "The choice of lockable units presents a tradeoff between concurrency and overhead" (Section 1)
- Small units give concurrency. "concurrency is increased if a fine lockable unit (for example a record or field) is chosen." (Section 1)
- Small units cost a transaction that touches many records many lock calls and memory; big units punish transactions that want one record. "However, such a coarse unit discriminates against transactions which only want to lock one member of the file." (Section 1)
- So have several sizes in one system. "it would be desirable to have lockable units of different granularities coexisting in the same system." (Section 1)
- Intention mode is compatible with itself; conflicts get sorted out at the finer level. "In this case their explicit locks on particular records in the file will resolve any conflicts among them." (Section 1, access modes)
- A lock on a node implicitly locks the whole subtree under it (X or S on a file locks every record in it). (Section 1, hierarchical locks)
- Intention mode tags the ancestors. "all ancestors of a node to be locked in share or exclusive mode." (Section 1, the sentence starting "Intention mode is used to tag (lock)")
- The protocol: intention locks on all ancestors first. "is to first lock all ancestors of R in intention mode" (Section 1)
- IS only leads to shared locks below, so it can live with S. "hence IS is compatible with S mode." (Section 1, access modes)
- SIX exists for a transaction that reads a whole subtree and updates a few nodes in it. "Since this is such a common case, SIX mode is introduced for this purpose." (Section 1)
- The modes form a partial order, not a total one. "Note that it is not a total order since IX and S are incomparable." (Section 1, Figure 2)
- Table 1 gives the compatibility of NL, IS, IX, S, SIX, X; for example IX is compatible with IS and IX but not S, SIX or X. (Table 1)
- Locks are requested root to leaf and released leaf to root (or all at end of transaction). (Section 1, rules for requesting nodes, rules a to c)

## Visuals worth redrawing

- Figure 1: the sample lock hierarchy (database, areas, files, records).
- Table 1: the compatibility matrix.

## My notes

- OCR scan with letter-spaced text; quotes were checked with spaces
  removed. Several sentences are too garbled to quote.
