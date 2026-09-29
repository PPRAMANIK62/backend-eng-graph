---
id: cmu-15445-index-concurrency
title: "Lecture #10: Index Concurrency Control (15-445/645 Database Systems)"
author: Andy Pavlo, Carnegie Mellon University
url: https://15445.courses.cs.cmu.edu/fall2024/notes/10-indexconcurrency.pdf
kind: docs
primary: false
---

## Summary

CMU's Fall 2024 lecture on letting many threads use one index: locks vs
latches, latch implementations, and latch crabbing on B+trees.

## Key claims

- The two B+tree latching problems: concurrent changes to a node, and a traversal racing a split or merge. "One thread traversing the tree while another thread splits/merges nodes." (5 B+Tree Latching)
- Latch crabbing: latch the child, then release the parent if the child is safe. "Release latch for the parent if the child is deemed “safe”." (5)
- A safe node won't split or merge: not full for inserts, more than half full for deletes. "A “safe” node is one that will not split, merge, or redistribute when updated." (5)
- The basic protocol takes an exclusive latch on the root for every write, which limits parallelism. "transactions always acquire an exclusive latch on the root for every insert/delete operation. This limits parallelism." (5, Improved Latch Crabbing Protocol)
- The improved protocol takes read latches down and a write latch only on the leaf, restarting if the leaf isn't safe. "Instead, one can assume that having to resize (i.e., split/merge nodes) is rare" (5)
- Top-down latching can't deadlock; leaf scans in both directions can, so they must use no-wait and restart. "The leaf node sibling latch acquisition protocol must support a “no-wait” mode." (5, Leaf Node Scans)
- Latches protect in-memory structures for a short, simple operation, unlike transaction locks. "Latches are held for a short period for a simple operation in a database system (i.e., page latch)." (Locks vs. Latches)
- Locks protect database contents from other transactions for the whole transaction. "Transactions will hold a lock for its entire duration." (Locks vs. Latches)
- (Latches) Two modes: many readers, or one writer. "A thread cannot acquire a write latch if another thread holds the latch in any mode." (2 Locks vs. Latches)
- (Latches) Avoiding latch deadlocks is the programmer's job. "Also it is developer's responsibility to avoid deadlocks." (2 Locks vs. Latches)
- (Locks) Locks come with deadlock detection and rollback. "There should be some higher-level mechanism to detect deadlocks and rollback changes." (2 Locks vs. Latches)
- Latches protect physical correctness, the soundness of the structure itself. "For the purposes of this lecture, we only care about enforcing physical correctness." (1 Index Concurrency Control)
- Latches are built on CPU atomic instructions such as compare-and-swap. "The underlying primitive that used to implement a latch is through atomic instructions that modern CPUs provide." (3 Latch Implementations)
- A spin latch lets the database decide what to do on failure. "Thus, this method gives the DBMS more control than the OS mutex, where failing to acquire a latch gives control to the OS." (3, Test-and-Set Spin Latch)
- Under contention spinning wastes CPU and bounces cache lines. "These wasted instructions will pile up in high contention environments" (3, Test-and-Set Spin Latch)
- A Linux futex is a user-space spin latch plus a kernel mutex. "Linux provides the futex (fast user-space mutex), which is comprised of (1) a spin latch in user-space and (2) an OS-level mutex." (3, Blocking OS Mutex)
- Reader-writer latches differ in who waits. "There are reader-preferred, writer-preferred, and fair reader-writer locks." (3, Reader-Writer Latches)
- Taking latches only top-down can't deadlock. "Given this, there can never be deadlocks." (5, Leaf Node Scans)
- Index latches have no deadlock detection. "Index latches do not support deadlock detection or avoidance." (5, Leaf Node Scans)
- Spinning threads poll cache lines owned by other CPUs. "This leads to cache coherence problems because threads are polling cache lines on other CPUs." (3, Test-and-Set Spin Latch)
- A blocking mutex is costly because the OS schedules the waiters. "Expensive and non-scalable (about 25 ns per lock/unlock invocation) because of OS scheduling." (3, Blocking OS Mutex)
- Reader-writer latches need queue management to avoid starvation. "The DBMS has to manage read/write queues to avoid starvation." (3, Reader-Writer Latches)
- Leaf scans and deletes can take latches in opposite directions. "threads trying to acquire exclusive locks in two different directions at the same time" (5, Leaf Node Scans)
- Locks can be shown to users. "Database systems can expose to the user the locks that are being held as queries are run." (2 Locks vs. Latches)

## Visuals worth redrawing

None.

## My notes

- Postgres uses Lehman and Yao's right-links instead of crabbing (see
  postgres-nbtree-readme).
