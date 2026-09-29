---
id: serializability
title: Serializability
depth: deep
phase: 8
note: >-
  The result matches some one-at-a-time order of the transactions.
  Conflicts, and the dependency graph that must have no cycles.
needs: [isolation-levels]
leads_to: [write-skew, two-phase-locking, history-checking, serializable-snapshot-isolation, strict-serializability]
compare_with: [linearizability]
---

# Serializability

A set of concurrent transactions is serializable if the result is the
same as running them one at a time, in some order. It's the strict
meaning of the I in ACID, the definition of the SQL `SERIALIZABLE`
level, and the yardstick every weaker [[isolation-levels|isolation level]]
is measured against. It also comes with a precise test: draw a graph of
which transaction depended on which, and look for a cycle.

## One at a time, in some order

Say a couple shares two accounts, x and y, each holding 50. The bank's
rule is that the two together must stay positive; either one may go
negative. Two transactions run at once:

- T1 reads x and y, sees 100 in total, and withdraws 90 from y.
- T2 reads x and y, sees 100 in total, and withdraws 90 from x.

Each one is correct on its own: it checks the rule, and the rule holds
after its own withdrawal. Now imagine the database ran them one after
the other. If T1 goes first, y becomes -40, and T2 then reads a total
of 10 and refuses. If T2 goes first, the same happens the other way
round. Either order leaves the total at 10.

Run them concurrently at a weak level, and both read the original 50s
before either writes. Both withdraw. x and y both end at -40, a total
of -80. No one-at-a-time order produces that. The history is not
serializable, and this particular pattern has its own name,
[[write-skew]].

Serializability doesn't say *which* order. T1-then-T2 and T2-then-T1
give different results here (which transaction gets refused), and both
count as correct. The promise is only that some serial order explains
what happened.

## Conflicts: which operations care about order

To check a history without trying every possible order, look at pairs
of operations. Two operations **conflict** if they belong to different
transactions, touch the same item, and at least one of them is a write.
Two reads never conflict, and operations on different items never
conflict: you can swap them without changing anything.

There are three kinds of conflict, named by what comes first:

- **Write then read (wr):** T2 reads something T1 wrote. T2 depends on
  T1's result, so T1 must come first in any equivalent serial order.
- **Write then write (ww):** T2 overwrites something T1 wrote. T1 must
  come first, or T2's value wouldn't be the one left standing.
- **Read then write (rw):** T1 read something that T2 later overwrote.
  T1 saw the old value, so in a serial order T1 must come before T2.
  This one is called an **anti-dependency**, and it's the edge the weaker
  isolation levels tend to miss.

Every conflict says "this transaction has to come before that one". If
all those "before" constraints can be satisfied at once, there's a
serial order that matches, and the history is serializable.

## The dependency graph

Turn that into a graph. Each committed transaction is a node. For every
pair of conflicting operations, draw an edge from the transaction whose
operation came first to the one whose operation came second.

The rule: **a history is conflict serializable exactly when this graph
has no cycle.** With no cycle, you can sort the nodes so every edge
points forward, and that sorted list is an equivalent serial order.
With a cycle, T1 must come before T2 and T2 before T1, and no order
works.

![Left, the interleaved history: T1 reads x and y, T2 reads x and y, T1 writes y as -40, T2 writes x as -40, both commit. Right, the dependency graph: an rw edge from T1 to T2 because T1 read x before T2 wrote it, and an rw edge from T2 to T1 because T2 read y before T1 wrote it. The two edges form a cycle, so no serial order exists.](img/serializability-dependency-cycle.svg)

*Write skew as a dependency graph. The history is adapted from Berenson et al., "A Critique of ANSI SQL Isolation Levels" (1995), history H5.*

In the bank example, T1 read x and T2 later wrote x: an rw edge from T1
to T2. T2 read y and T1 later wrote y: an rw edge from T2 to T1. Two
edges, one cycle, not serializable. In the serial run where T1 goes
first, T2 reads the y that T1 wrote: a single wr edge from T1 to T2, no
cycle.

A second example, from the Postgres manual: a table has rows in
class 1 and class 2. Transaction A sums class 1 and inserts the total
as a new class 2 row; B sums class 2 and inserts its total as a class 1
row. A's insert would have changed B's sum and B's insert would have
changed A's, so each read comes before the other's write. Again two rw
edges in a cycle, which is why Postgres at `SERIALIZABLE` rolls one of
them back.

## Why conflicts and not values

The graph test only looks at who touched what, not at the values. That
makes it stricter than necessary. There's a looser definition, view
serializability, which also accepts some histories with blind writes
(writes that didn't read the item first) whose final state happens to
match a serial order. It's hard to enforce efficiently, so databases
rarely use it. In practice "serializable" means conflict serializable,
and the graph test is what a database has to pass.

Items aren't only rows. A query like `SELECT ... WHERE class = 1` reads
a *condition*, and an insert of a new class 1 row conflicts with it
even though that row didn't exist when the query ran. Precise
definitions add these predicate reads to the graph, so a new row that
would have changed a query's answer counts as overwriting what the
query read. That's how [[phantom-read|phantoms]] show up as cycles, and why databases
need [[predicate-locks]] or something like them.

## Weaker levels as smaller sets of forbidden cycles

The graph also gives a cleaner way to define the weaker isolation
levels than the SQL standard's list of phenomena. Adya, Liskov and
O'Neil (2000) built the graph from the three kinds of dependency and
defined each level by which cycles it forbids:

- **No cycles made only of ww edges.** No tangle of transactions
  overwriting each other's writes (dirty writes).
- **No cycles made only of ww and wr edges.** Roughly, no [[dirty-read|dirty reads]]:
  information flows one way between transactions.
- **No cycles at all, including ones with rw edges.** That's
  serializability.

Everything between read committed and serializable is about cycles
that contain at least one rw edge, the anti-dependencies. Snapshot
isolation, for example, lets through the two-rw-edge cycle of write
skew. [[serializable-snapshot-isolation]] works by watching for
exactly those rw edges.

## How databases provide it

There are a few ways to make sure no cycle can form:

- **Run one transaction at a time.** Serial by construction, and slow.
- **Lock and hold.** [[two-phase-locking]] takes a lock on everything a
  transaction reads or writes and holds it to the end, so a conflicting
  operation has to wait. Long read and write locks rule out every cycle.
- **Let them run and check.** Postgres's `SERIALIZABLE` runs
  transactions on snapshots, tracks read-write dependencies without
  blocking, and aborts a transaction when a dangerous pattern appears.
  That's [[serializable-snapshot-isolation]].

The same graph works in reverse for testing. Record what a real
database did, build the graph, and look for cycles; a cycle is proof
that the database broke its promise. That's [[history-checking]].

## Where it gets tricky

**Serializable isn't about real time.** The equivalent serial order
doesn't have to match the order things actually happened. If you commit
a write and then someone else starts a read, serializability alone
doesn't promise they'll see your write. A client can even fail to see
its own write from an earlier transaction. Adding the real-time rule
gives [[strict-serializability]], which is serializability and
[[linearizability]] at once.

**Silly orders are legal.** Because any order will do, a database could
in principle answer every read-only transaction as if it ran before
anything was written, and return nothing. That's serializable and
useless. Real databases generally don't do this, but it shows how
much the definition leaves open.

**It costs coordination.** A serializable system spread over several
machines can't stay fully available during a [[network-partitions|network partition]]: some
or all of its nodes have to stop making progress.

**It's often not the default.** Postgres, for one, defaults to read
committed (see [[isolation-levels]]). Code that "works" in testing may
be depending on transactions not overlapping.

## What this means when you build

- When you reason about a concurrency bug, write the history down and
  draw the edges. A cycle names the problem; the rw edges usually point
  at the missing check.
- Serializable lets you reason about each transaction alone: if it's
  correct by itself, it's correct in any mix. That's worth a retry loop.
- Don't assume serializable means "sees the latest write". If you need
  a read to reflect a commit that already happened elsewhere, you need
  strict serializability or [[linearizability]].

## Further reading

- [Lecture #16: Concurrency Control Theory](https://15445.courses.cs.cmu.edu/fall2024/notes/16-concurrencycontrol.pdf), Andy Pavlo, CMU 15-445, 2024. Schedules, conflicts, conflict versus view serializability, and the dependency graph test.
- [A Critique of ANSI SQL Isolation Levels](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/tr-95-51.pdf), Hal Berenson and others, 1995. Conflicts and dependency graphs in history notation, and the write skew history H5.
- [Generalized Isolation Level Definitions](https://pmg.csail.mit.edu/papers/icde00.pdf), Atul Adya, Barbara Liskov and Patrick O'Neil, 2000. The direct serialization graph with ww, wr and rw edges, and isolation levels as forbidden cycles.
- [PostgreSQL 13.2 Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html), PostgreSQL Global Development Group, version 18. The class 1 and class 2 example, and what Postgres's serializable guarantees.
- [Serializability](https://jepsen.io/consistency/models/serializable), Jepsen. What serializability does and doesn't promise, and the formal definitions to read next.
- [Linearizability versus Serializability](http://www.bailis.org/blog/linearizability-versus-serializability/), Peter Bailis, 2014. How the two differ, and strict serializability.
