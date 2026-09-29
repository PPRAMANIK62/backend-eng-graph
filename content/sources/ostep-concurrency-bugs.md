---
id: ostep-concurrency-bugs
title: "Common Concurrency Problems (Operating Systems: Three Easy Pieces, ch. 32)"
author: Remzi H. Arpaci-Dusseau, Andrea C. Arpaci-Dusseau
url: https://pages.cs.wisc.edu/~remzi/OSTEP/threads-bugs.pdf
kind: book
primary: false
---

## Summary

A tour of the bugs real concurrent programs have (version 1.20), based
on Lu et al.'s study of MySQL, Apache, Mozilla and OpenOffice. Non-
deadlock bugs are mostly atomicity violations and order violations.
Then deadlock: the four Coffman conditions and how to prevent each one,
lock ordering, trylock and livelock, a compare-and-swap list insert,
avoidance by scheduling, and detect-and-recover.

## Key claims

- Lu et al. studied 105 concurrency bugs in four applications: 74 non-deadlock, 31 deadlock. (32.1, Figure 32.1)
- Atomicity violation: a check and a use meant to be atomic aren't. MySQL example: thread 1 checks thd->proc_info is non-NULL then uses it; thread 2 sets it to NULL in between; crash. (32.2, Figure 32.2)
- Lu et al.'s definition. "a code region is intended to be atomic, but the atomicity is not enforced during execution" (32.2)
- Order violation: A should run before B but nothing enforces it; Mozilla example reads mThread before it's set. (32.2, Figure 32.4)
- "A large fraction (97%) of non-deadlock bugs studied by Lu et al. are either atomicity or order violations." (32.2, summary)
- Deadlock example: thread 1 locks L1 then L2, thread 2 locks L2 then L1; it deadlocks only if a switch falls in between. "Note that if this code runs, deadlock does not necessarily occur; rather, it may occur" (32.3)
- A cycle in the dependency graph means deadlock. "the presence of a cycle in the graph is indicative of the deadlock." (32.3, Figure 32.7)
- Why deadlocks happen: circular dependencies in large code bases, and encapsulation hiding which locks a call takes (Java's Vector.AddAll locks both vectors; v1.AddAll(v2) against v2.AddAll(v1)). (32.3)
- The four conditions: mutual exclusion, hold-and-wait, no preemption, circular wait. "If any of these four conditions are not met, deadlock cannot occur." (32.3, Conditions for Deadlock)
- The most practical prevention is a lock order. "The most straightforward way to do that is to provide a total ordering on lock acquisition." (32.3, Circular Wait)
- Linux's memory mapping code documents partial lock orders in a comment at the top of the source (v5.2). (32.3)
- Order locks by address when a function takes two locks passed in by the caller. (tip: Enforce Lock Ordering By Lock Address)
- Hold-and-wait can be broken by taking all locks at once under a global lock, at a cost in concurrency. (32.3, Hold-and-wait)
- Trylock and back off avoids deadlock but can livelock. "both systems are running through this code sequence over and over again (and thus it is not a deadlock), but progress is not being made, hence the name livelock." (32.3, No Preemption)
- Livelock fix: a random delay before retrying. (32.3, No Preemption)
- Lock-free structures remove mutual exclusion; CAS-based atomic increment and list insert shown. "no lock is acquired, and no deadlock can arise (though livelock is still a possibility" (32.3, Mutual Exclusion)
- The CAS list insert retries if another thread swapped in a new head meanwhile. (32.3, Mutual Exclusion)
- Avoidance by scheduling (e.g. Dijkstra's Banker's algorithm) needs full knowledge of which locks tasks take; only useful in limited settings. (32.3, Deadlock Avoidance via Scheduling)
- Detect and recover: many database systems run a detector that finds cycles. "A deadlock detector runs periodically, building a resource graph and checking it for cycles." (32.3, Detect and Recover)
- Practical advice. "The best solution in practice is to be careful, develop a lock acquisition order, and thus prevent deadlock from occurring in the first place." (32.4)
- Coffman, Elphick, Shoshani, "System Deadlocks" (1971) is the source of the conditions; Dijkstra first described it as the "deadly embrace". (References C+71, D64)

## Visuals worth redrawing

- Figure 32.7, the deadlock dependency graph: two threads, two locks,
  "holds" and "wanted by" edges forming a cycle.

## My notes

- Useful for race-condition too (atomicity and order violations).
