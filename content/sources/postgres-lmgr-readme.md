---
id: postgres-lmgr-readme
title: "src/backend/storage/lmgr/README (PostgreSQL 18 source)"
author: The PostgreSQL Global Development Group
url: https://github.com/postgres/postgres/blob/REL_18_STABLE/src/backend/storage/lmgr/README
kind: code
primary: true
---

## Summary

The design notes for Postgres's lock manager, in the source tree
(REL_18_STABLE, same text as master when read). The four kinds of
locks (spinlocks, LWLocks, heavyweight locks, SIRead predicate locks),
the fast path for weak table locks, how waiting works, the deadlock
detector, and advisory ("user") locks.

## Key claims

- Spinlocks and LWLocks have no deadlock detection; heavyweight locks do. "The regular lock manager supports a variety of lock modes with table-driven semantics, and it has full deadlock detection and automatic release at transaction end." (Locking Overview)
- Heavyweight locks are the ones user-visible commands take. "Regular locks should be used for all user-driven lock requests." (Locking Overview)
- Fast path since 9.2: weak table locks taken by DML (AccessShare, RowShare, RowExclusive) go into a per-backend array instead of the shared table, because one hot table's partition lock became a bottleneck. "To alleviate this bottleneck, beginning in PostgreSQL 9.2, each backend is permitted to record a limited number of locks on unshared relations in an array within its PGPROC structure, rather than using the primary lock table." (Fast Path Locking)
- The shared lock table's partition lock was a bottleneck on many cores. "This effect is measurable even on 2-core servers, and becomes very pronounced as core count increases." (Fast Path Locking)
- Deadlocks are possible because lock order is free. "Since we allow user transactions to request locks in any order, deadlock is possible." (The Deadlock Detection Algorithm)
- Optimistic waiting: sleep first, check only after deadlock_timeout. "if a process cannot acquire the lock it wants immediately, it goes to sleep without any deadlock check." (The Deadlock Detection Algorithm)
- The timer. "But it also sets a delay timer, with a delay of DeadlockTimeout milliseconds (typically set to one second)." (The Deadlock Detection Algorithm)
- If the timer fires and there's no cycle, the process sleeps again. "no deadlock condition, and then the process will go back to sleep and wait quietly until it is granted the lock." (The Deadlock Detection Algorithm)
- Why: short waits never pay for the check. "In this way, we avoid deadlock handling overhead whenever the wait time for a lock is less than DeadlockTimeout, while not imposing an unreasonable delay of detection when there is an error." (The Deadlock Detection Algorithm)
- A conflicting request also waits behind earlier waiters, so requests are granted in arrival order. "Rule (b) ensures that conflicting requests are granted in order of arrival." (The Deadlock Detection Algorithm)
- The waits-for graph. "There is a deadlock condition if and only if the WFG contains a cycle." (The Deadlock Detection Algorithm)
- The checking process cancels its own request. "We resolve such a deadlock by canceling the start point's lock request and reporting an error in that transaction, which normally leads to transaction abort and release of that transaction's held locks." (outcome 2)
- One victim is enough. "Note that it's sufficient to cancel one request to remove the cycle; we don't need to kill all the transactions involved." (outcome 2)
- Waiting behind someone in a queue counts as a (soft) edge; soft cycles can sometimes be fixed by reordering the queue instead of aborting. "If we can find a rearrangement that eliminates a cycle without creating new ones, then we can avoid an abort." (soft edges)
- No deadlock is missed: the last process to join a cycle will find it. "therefore the last process in the cycle to wait (the one from which that edge is outgoing) is certain to detect and resolve the cycle when it later runs CheckDeadLock." (Miscellaneous Notes 1)
- The victim is not always the last to wait. "If earlier waiters in the cycle have not yet run CheckDeadLock, then the first one to do so will be the victim." (Miscellaneous Notes 2)
- The detector is also used to cancel autovacuum when it blocks someone. "This implements the principle that autovacuum has a low locking priority (eg it must not block DDL on the table)." (Miscellaneous Notes 6)
- Advisory locks (called user locks here) are cooperative and don't block reads or writes of the data. "While the lock is active other clients can still read and write the tuple but they can be aware that it has been locked at the application level by someone." (User Locks)
- They're independent of normal locks. "User locks and normal locks are completely orthogonal and they don't interfere with each other." (User Locks)
- Spinlocks are for a few dozen instructions at most. "If a lock is to be held more than a few dozen instructions, or across any sort of kernel call (or even a call to a nontrivial subroutine), don't use a spinlock." (Locking Overview)
- Spinlock waiters busy-loop. "Waiting processes busy-loop until they can get the lock." (Locking Overview)
- LWLocks guard shared-memory structures, in shared or exclusive mode. "LWLocks support both exclusive and shared lock modes (for read/write and read-only access to a shared object)." (Locking Overview)
- LWLocks have no deadlock detection but are released on error. "There is no provision for deadlock detection, but the LWLock manager will automatically release held LWLocks during elog() recovery, so it is safe to raise an error while holding LWLocks." (Locking Overview)
- Uncontended LWLocks are cheap. "Obtaining or releasing an LWLock is quite fast (a few dozen instructions) when there is no contention for the lock." (Locking Overview)
- LWLock waiters sleep on a semaphore, in arrival order, with no timeout. "When a process has to wait for an LWLock, it blocks on a SysV semaphore so as to not consume CPU time." (Locking Overview)
- Query cancel is held off while holding or waiting for them, so waits must be short. "It is therefore not a good idea to use LW locks when the wait time might exceed a few seconds." (Locking Overview)
- Spinlocks have no deadlock detection and aren't released on error. "There is no provision for deadlock detection, automatic release on error, or any other nicety." (Locking Overview)
- Heavyweight locks have many modes with a conflict table. "The regular lock manager supports a variety of lock modes with table-driven semantics" (Locking Overview)

## Visuals worth redrawing

None; the waits-for graph is easy to draw from the text.

## My notes

- Row locks aren't in this lock table; they're marked on the tuple
  (postgres-explicit-locking: "no limit on the number of rows locked").
