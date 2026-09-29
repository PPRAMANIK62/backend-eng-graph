---
id: eswaran-predicate-locks-1976
title: The Notions of Consistency and Predicate Locks in a Database System
author: K. P. Eswaran, J. N. Gray, R. A. Lorie, I. L. Traiger
url: https://people.csail.mit.edu/tdanford/6830papers/eswaran-notions-of-consistency.pdf
kind: paper
primary: true
---

## Summary

The IBM Research paper (Communications of the ACM, 1976) that proved
two-phase locking gives consistent (serializable) schedules, and showed
that locking the rows you read isn't enough: rows that don't exist yet
(phantoms) have to be locked too, which leads to locking a predicate.
Read as a scan of the published paper hosted on an MIT course page.

## Key claims

- Main result in one line: once you release a lock, you can't take a new one. "shows that consistency requires that a transaction cannot request new locks after releasing a lock." (Abstract)
- The second result: lock a logical subset, not physical records. "Then it is argued that a transaction needs to lock a logical rather than a physical subset of the database." (Abstract)
- The theorem: if every transaction is well-formed and two-phase, every legal schedule is consistent. "are each wellformed and two-phase then any legal schedule is consistent." (Section 2, the assertion after equation 8)
- The converse: if you run alongside unknown transactions, you must be two-phase. "if one intends to run a transaction concurrently with an unknown set of other transactions then, to guarantee that all legal schedules be consistent, all transactions must be well-formed and two-phase." (Section 2)
- Two-phase can be stricter than needed for a known pair of transactions. "Even if the transactions interact, the two-phase restriction may be too strong." (Section 2)
- Phantoms force locking logical subsets. "A phenomenon called phantoms seems to imply that one must lock logical subsets of the database rather than locking individual records present in the database." (Introduction)
- The Napa example: T1 sums Napa accounts and compares with the Napa assets row; T2 inserts a new Napa account and updates assets in between, so T1 sees the deposit in ASSETS but not the account. (Section 3, steps 9a to 9d)
- The lock should cover existing and phantom tuples. "should lock not only all existing Napa accounts but also all phantom ones." (Section 3)
- The natural lock is on the predicate. "Rather it seems natural to lock the set of tuples and phantoms satisfying the predicate: Location = Napa." (Section 3)
- Two predicate locks conflict if some tuple could satisfy both and one of them writes; deciding that is unsolvable in general. "It does not explain how sharing works and finesses the fact that predicate satisfiability is recursively unsolvable." (Section 3)
- Restricting to simple predicates (Boolean combinations of comparisons) makes the check decidable, so predicate locks can be scheduled like ordinary locks. "It is possible to schedule simple predicate locks in the same way" (Section 5, conclusion)
- Other way to avoid conflicts: partition data into disjoint classes. "Therefore one technique for avoiding conflict is to partition entities into disjoint classes." (Section 2)

## Visuals worth redrawing

- Figure 2: transactions T11 (not two-phase: locks B after unlocking A)
  and T12 (two-phase).

## My notes

- Text comes from an OCR scan, so quotes were checked with spaces
  removed. Some letters are garbled in the scan (T1 reads as 7"1), so
  quotes avoid those spots.
