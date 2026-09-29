---
id: deadlock-detection
title: Deadlock detection
depth: short
phase: 8
note: >-
  The database finds a cycle of waiting transactions and kills one.
needs: [deadlock, two-phase-locking]
leads_to: []
compare_with: []
---

# Deadlock detection

Under [[two-phase-locking]], two transactions that lock the same rows
in opposite orders can end up waiting for each other forever: a
[[deadlock]]. Databases don't try to stop that from happening. They let
the transactions wait, look for a cycle in who is waiting for whom, and
abort one transaction so the rest can go on. Your application sees an
error and has to retry.

## Two transfers, two rows

This is the example from the Postgres manual. Two transactions move
money between accounts 11111 and 22222, but in opposite directions:

1. T1 updates account 11111. It now holds that row's lock.
2. T2 updates account 22222, and holds that row.
3. T2 tries to update 11111. T1 has it, so T2 waits for T1.
4. T1 tries to update 22222. T2 has it, so T1 waits for T2.

Plain `UPDATE`s take row locks and keep them until commit; no `LOCK`
statement needed.

To see the problem, draw a **waits-for graph**: one node per
transaction, and an arrow from A to B when A is waiting for a lock that
B holds. There's a deadlock exactly when the graph has a cycle. Here
it's T1 → T2 → T1, a cycle.

![On the left, a timeline of two transactions. T1 updates account 11111 and T2 updates account 22222. T2 then asks for 11111 and starts waiting; T1 asks for 22222 and starts waiting. T2 started waiting first, so its deadlock_timeout timer (1 second by default) fires first: it searches the waits-for graph, finds the cycle and cancels its own request with an error, releasing its locks. T1 then gets 22222 and commits. On the right, the waits-for graph: T1 waits for T2 on row 22222, and T2 waits for T1 on row 11111, forming a cycle.](img/deadlock-detection-cycle.svg)

*Postgres waits first and checks later. Adapted from the PostgreSQL 18 manual, section 13.3.4, and src/backend/storage/lmgr/README.*

## When to look

Searching the graph costs something, and most lock waits aren't
deadlocks. So Postgres uses what its source calls
optimistic waiting. A transaction that can't get a lock goes to sleep
with no check, and sets a timer for `deadlock_timeout`, one second by
default. If it still hasn't got the lock when the timer fires, it runs
the deadlock check. Usually there's no cycle and it goes back to
sleep. Short waits never pay for a check.

The manual calls one second about the smallest value you'd want, and
suggests raising it on a heavily loaded server, ideally above your
typical transaction time. The same timer decides when `log_lock_waits` logs a long wait,
a handy way to see lock waits in production.

The check starts from the waiting transaction and follows waits-for
arrows outward. If it comes back to where it started, that's a
deadlock, and Postgres cancels the lock request of the transaction that
ran the check. That transaction gets an error and normally aborts,
releasing its locks. Cancelling one request is enough to break a cycle.
Since the last transaction to join a cycle always runs its check after
the cycle exists, no deadlock is missed.

A textbook alternative checks from a background thread every so often,
trading CPU against how long a deadlock lasts.

## Choosing the victim

Postgres's victim is whoever's timer fires first while the cycle
exists, and the manual says not to rely on which one that is. InnoDB
(MySQL 8.4) picks the transaction that has inserted, updated or
deleted the fewest rows, so the cheapest one is undone. Other
reasonable rules pick the youngest transaction, the one holding the
fewest locks, or one not already restarted many times.

Postgres has one refinement: if a cycle exists only because of the
order of a lock's wait queue (a transaction waiting behind another
whose request conflicts with it), it can sometimes reorder the queue
and avoid aborting anyone.

## Where it gets tricky

**Detection has limits.** InnoDB stops searching once the wait list
passes 200 transactions or it has to look at more than 1,000,000 locks,
and treats that as a deadlock, rolling back the transaction doing the
search. On a busy server where many threads wait on one lock, the
checks themselves can slow things down; InnoDB lets you turn detection
off (`innodb_deadlock_detect`) and rely on `innodb_lock_wait_timeout`
instead.

**It only sees its own locks.** InnoDB can't detect a cycle that
involves a MySQL `LOCK TABLES` lock (with autocommit on) or another
storage engine's lock, and falls back on the timeout. By the same
logic, no database can see a cycle that runs partly through your
application, such as a transaction waiting on a lock in your own code.

**Prevention is the other road.** Instead of letting cycles form, a
system can give each transaction a timestamp and decide at every
conflict who waits and who dies: wait-die (an older transaction waits
for a younger one, a younger one asking an older one aborts) or
wound-wait (an older one aborts the younger holder). No cycle can
form, at the cost of aborting transactions at conflicts that might
never have turned into a deadlock.

**A timeout isn't detection.** `lock_timeout` in Postgres gives up on
any lock wait that runs too long, deadlock or not. InnoDB's
`innodb_lock_wait_timeout` is the fallback when detection is off or
can't see the cycle. Detection aborts only real cycles.

## What this means when you build

- Treat a deadlock error as a normal outcome: roll back and retry the
  whole transaction. Even correct code gets them.
- Make them rare: touch rows and tables in the same order everywhere,
  take the strongest lock you'll need first, keep transactions small,
  and index the columns your `UPDATE ... WHERE` and `FOR UPDATE`
  conditions use, so fewer rows and gaps get locked.
- Turn on `log_lock_waits` in Postgres to see long lock waits, and in
  MySQL read the last deadlock with `SHOW ENGINE INNODB STATUS`.

## Further reading

- [Explicit Locking, 13.3.4 Deadlocks](https://www.postgresql.org/docs/current/explicit-locking.html), PostgreSQL 18 docs. The two-account example and how to avoid deadlocks.
- [src/backend/storage/lmgr/README](https://github.com/postgres/postgres/blob/REL_18_STABLE/src/backend/storage/lmgr/README), PostgreSQL 18 source. Optimistic waiting, the waits-for search, soft edges and queue reordering.
- [Lock Management settings](https://www.postgresql.org/docs/current/runtime-config-locks.html), PostgreSQL 18 docs. What `deadlock_timeout` does and how to set it.
- [Deadlock Detection (MySQL 8.4)](https://dev.mysql.com/doc/refman/8.4/en/innodb-deadlock-detection.html), Oracle. InnoDB's victim choice, search limits, and turning detection off.
- [Deadlocks in InnoDB (MySQL 8.4)](https://dev.mysql.com/doc/refman/8.4/en/innodb-deadlocks.html), Oracle. How deadlocks arise and how to make them rarer.
- [Client Connection Defaults](https://www.postgresql.org/docs/current/runtime-config-client.html), PostgreSQL 18 docs. `lock_timeout`, which gives up on any long lock wait.
- [Lecture #16: Two-Phase Locking](https://15445.courses.cs.cmu.edu/fall2023/notes/16-twophaselocking.pdf), Andy Pavlo and Jignesh Patel, CMU 15-445, 2023. Waits-for graphs, victim selection, and wait-die versus wound-wait.
