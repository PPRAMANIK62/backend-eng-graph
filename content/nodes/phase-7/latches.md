---
id: latches
title: Latches
depth: short
phase: 7
note: >-
  Short locks that guard in-memory structures like B-tree pages, and how
  they differ from transaction locks.
needs: [b-plus-tree, mutex]
leads_to: [two-phase-locking]
compare_with: [buffer-pool, two-phase-locking]
---

# Latches

A latch is what database people call a short-lived lock on the
database's own memory: a page in the [[buffer-pool]], a node of a
[[b-plus-tree]], a hash table of cached pages. It's held for one small
operation, then released. It has the same job as a [[mutex]] in any
multithreaded program, and it's a different thing from the transaction
locks you take with SQL, even though both get called "locks".

## Two threads, one leaf page

Say two queries insert different rows at the same moment, and both
new keys belong on the same B+tree leaf. The leaf is one page in the
buffer pool, shared by every [[thread]] (or process) in the database.
Each insert shifts entries along and writes its key into the gap. If
both do it at once, one key overwrites the other.

The transactions don't conflict at all. The danger is purely physical:
two threads changing the bytes of one structure. So each insert takes
the leaf's latch in write mode, makes its change, and lets go. The
second waits a moment, then does the same.

That's the split. A latch keeps a data structure physically sound: no
half-changed pages, no pointers into freed memory. A transaction lock
keeps the data logically correct, as the
[[isolation-levels|isolation level]] requires.

![Timeline of one transaction from BEGIN to COMMIT. Across the whole span, a long bar shows a row lock on order 42, held until commit. Underneath, three rows show latches: the buffer mapping table, a B+tree leaf page and a heap page, each taken several times for a brief moment during a lookup or a change, and released right away.](img/latches-vs-locks-timeline.svg)

*A lock lasts as long as the transaction. Latches come and go many times inside it.*

## Locks and latches side by side

| | Transaction lock | Latch |
|---|---|---|
| Protects | rows, tables, the database's contents | in-memory structures: pages, tree nodes, hash tables |
| Against | other transactions | other threads |
| Held for | the whole transaction, often until commit | one short operation |
| Modes | many, with a conflict table | usually two: read (shared) and write (exclusive) |
| Deadlocks | detected, and a victim is rolled back | must not happen; the code avoids them |

The deadlock row matters most. A lock manager finds cycles and aborts
a victim (see [[deadlock-detection]]). Latches must cost only a few
dozen instructions, leaving no room for that bookkeeping, and there's
no transaction to roll back. The code has to make [[deadlock]]
impossible.

## How a latch is built

Underneath, a latch is a word of memory changed with an atomic CPU
instruction such as compare-and-swap. The main designs:

- **Spin latch.** Try to flip the word; if it's taken, retry in a
  loop. Very cheap when uncontended. Under contention, waiters burn
  CPU and bounce the same [[cpu-cache|cache line]] between cores.
- **Blocking mutex.** On Linux, a futex: a spin attempt in user space,
  then a sleep in the kernel if that fails. No wasted CPU, but the
  kernel and scheduler make it far more expensive.
- **Reader-writer latch.** Either of the above, plus counts, so many
  readers can hold it at once. Implementations differ on whether
  readers or writers go first, and a bad choice starves one side.

Postgres shows the layers in practice. **Spinlocks** are for a few
dozen instructions at most; waiters busy-loop, with no deadlock
detection or cleanup on error. **Lightweight locks** (LWLocks) are its
latches for shared-memory structures: shared and exclusive modes, a few
dozen instructions when uncontended, waiters asleep on a semaphore in
arrival order, released automatically on error, and no deadlock
detection. **Heavyweight locks** are the transaction locks. In its
buffer pool, a *pin* keeps a page from being evicted and may be held a
while; the page's *content lock*, an LWLock, is held only while
reading or changing its bytes.

## Keeping latches deadlock-free

The usual discipline is a fixed order. In a B+tree, every thread takes
latches top-down, from the root towards the leaves, and never reaches
back up. Two threads can't each hold what the other wants, so there's
no deadlock. [[b-plus-tree|Latch crabbing]] builds on this: latch the
child, then drop the parent once the child can't split.

Scans along the leaves break the rule: a scan and a delete can take
latches in opposite directions. The fix is a "no-wait" attempt: if a
sibling's latch isn't free right away, release everything and
restart.

## Where it gets tricky

**The names are a mess.** Postgres says LWLock and heavyweight lock
where textbooks say latch and lock. A wait on an LWLock is contention
inside the engine; a wait on a heavyweight lock is two transactions
wanting the same data.

**One latch can throttle a whole database.** Before Postgres 8.1, a
single lock guarded the entire buffer manager, and it became a known
point of contention. It was split up, and from 8.2 the table that maps
pages to buffers is guarded by several partition locks instead of one.

**Hold them briefly, for real.** While a Postgres process holds or
waits for an LWLock, query cancel is held off, so LWLocks don't belong
anywhere a wait could last seconds. A spinlock must never be held
across a system call at all. A latch held across something slow turns
every other thread into a waiter.

## What this means when you build

- Keep transaction locks and latches in separate layers. Locks follow
  transactions; latches follow a single function call.
- Give every latch a place in a fixed order, and document it. If you
  can't, use try-and-restart instead of waiting.
- Keep slow work, like a network call or a wait on another process,
  outside any latch.
- If threads queue on one latch, split what it guards before looking
  for a faster latch.

## Further reading

- [Lecture #10: Index Concurrency Control](https://15445.courses.cs.cmu.edu/fall2024/notes/10-indexconcurrency.pdf), Andy Pavlo, CMU 15-445, 2024. Locks vs latches, spin, blocking and reader-writer latches, and how B+tree code stays deadlock-free.
- [src/backend/storage/lmgr/README](https://github.com/postgres/postgres/blob/REL_18_STABLE/src/backend/storage/lmgr/README), PostgreSQL 18 source. Postgres's spinlocks, LWLocks and heavyweight locks, and what each does and doesn't give you.
- [src/backend/storage/buffer/README](https://github.com/postgres/postgres/blob/REL_18_STABLE/src/backend/storage/buffer/README), PostgreSQL 18 source. Pins vs content locks on buffer pages, and how one global buffer lock was split up.
