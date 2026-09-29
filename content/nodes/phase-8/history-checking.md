---
id: history-checking
title: History checking
depth: deep
phase: 8
note: >-
  Record every operation, then look for cycles in the dependency graph.
  How Jepsen's Elle finds isolation bugs.
needs: [serializability]
leads_to: [linearizability-checking, fault-injection]
compare_with: [linearizability-checking, race-detector]
---

# History checking

A database says its transactions are serializable. You can't look inside
it to check, but you can record everything its clients asked for and got
back, rebuild from that record which transaction must have come before
which, and look for a loop. A loop means no one-at-a-time order could have
produced what the clients saw, so the claim is false. This is how Jepsen's
checker, Elle, has found isolation bugs in real databases, including
PostgreSQL's SERIALIZABLE level, and it's the harness this phase's lab
builds.

## Why a few clever tests aren't enough

The usual way to test isolation is to write a scenario by hand. Two
sessions each read a row and then update another, and you check whether
the database lets both commit. PostgreSQL's own isolation test suite and
Kleppmann's Hermitage are built this way, and they're good at showing what
each [[isolation-levels|isolation level]] allows.

Their weakness is that each test checks one shape of transaction, with an
invariant someone proved by hand for that shape. It tells you nothing
about the shapes nobody thought to write. PostgreSQL shows the cost. Its
[[serializable-snapshot-isolation|serializable snapshot isolation]] went
in with version 9.1 (2011) and passed its own isolation tests for years.
Then Jepsen ran random transactions against PostgreSQL 12.3 (2020) and
found serializability violations in a two-minute run. The bug
was in the conflict check, it only showed up when inserts and updates
raced in a particular way, and it had been there in every version tested,
from 9.5 through 13.

History checking turns this around. Instead of one fixed scenario with a
known right answer, you run a large number of random
[[transaction|transactions]], and a checker decides afterwards whether
anything that happened was impossible under the level the database
claims.

## Generate, run, record, check

![Five boxes in a row. 1 Generate: short random transactions with unique values. 2 Run: many clients at once, with faults if you want. 3 Record: operations, results, whether each commit was ok, failed or unknown, and times. 4 Infer: ww, wr and rw edges, plus process and real-time edges. 5 Search: find cycles, name them, explain them. A bracket under steps 1 and 2 says the test drives the database, step 3 is the history, and steps 4 and 5 are the checker, run offline.](img/history-checking-pipeline.svg)

*The shape of a history-checking test.*

A **history** is the list of everything the clients did. For each
transaction it holds:

- which client (process) ran it,
- each operation in order: the key, what was written, what a read
  returned,
- how it ended: committed, aborted, or **unknown**,
- when it started and finished, by the client's clock.

"Unknown" matters. If a commit times out or the connection drops, the
client can't tell whether the transaction took effect. The checker has to
treat it as maybe-committed, not as failed. If you mark it failed and a
later read sees its write, the checker will blame the database for reading
aborted data.

The checker then works offline on the recorded history.

## The graph you're looking for

Recall from [[serializability]] that a set of committed transactions is
serializable when you can draw a graph between them with no cycles. The
edges come from conflicts on the same key:

- **ww (write-write):** T2 wrote the version of x that came right after
  T1's. T1 must come before T2.
- **wr (write-read):** T2 read the version of x that T1 wrote. T1 must come
  before T2.
- **rw (read-write), or anti-dependency:** T1 read a version of x, and T2
  wrote the next one. T1 didn't see T2's write, so T1 must come before T2.

This graph, one node per committed transaction, is Adya's Direct
Serialization Graph. Adya's definitions name the cycles, and each name
maps onto an anomaly you've met:

| Anomaly | What the cycle contains | Also known as |
|---|---|---|
| G0 | only ww edges | dirty write |
| G1c | ww and wr edges only | circular information flow |
| G-single | exactly one rw edge | read skew, a [[non-repeatable-read]] |
| G2-item | one or more rw edges, on single rows | includes [[write-skew]] |
| G2 | one or more rw edges, on rows or on predicates | adds the phantom case |

Two more anomalies aren't cycles at all. **G1a** is reading a value from a
transaction that aborted, and **G1b** is reading a value from the middle
of another transaction, one it overwrote before committing. Together
with G1c, they split the old [[dirty-read]] rule into three precise parts. A [[lost-update]] shows up
as a cycle too.

Serializable means no G0, G1 or G2. Weaker levels allow some cycles:
[[snapshot-isolation]], for example, forbids G-single but allows G2-item
and G2, the family write skew belongs to.

So the job is clear. Build this graph from the history, then look for
cycles. The trouble is building it.

## The hard part: clients can't see the version order

wr edges are easy if every written value is unique. A read that returns
42 on key x can only have come from the one transaction that wrote 42 to
x. Making values unique costs nothing in bug-finding power, since a
database doesn't behave differently depending on which numbers you store.
Elle and Cobra, the two checkers below, both do it.

ww and rw edges are the problem. Both need the **version order**: which
write to x came after which. That order lives inside the database. Clients
don't see it. And you can't just take it from the clock, because an
[[mvcc|MVCC]] or [[optimistic-concurrency|optimistic]] database may commit
an earlier version later in real time.

With plain key-value writes, the order is gone. If T1 sets x to 1 and T2
sets x to 2, you can't tell which came first. A later read of 2 tells
you the reader saw T2's write, and nothing about where T1's fits. Blind
overwrites destroy the history you need.

Without the version order you have to search. Each unknown order between
two writes to the same key is an either-or choice: T1 before T2, or T2
before T1. The history is serializable if some combination of choices
gives a graph without cycles.
That search is NP-complete in general, and the choices grow with every
write, so a direct attempt stalls quickly; Kingsbury's own
constraint-solver checker, before Elle, became intractable past about a
hundred transactions.

## Elle's trick: make every read show the order

Elle avoids the search by choosing the data. Each key holds a **list**,
and each write **appends** a unique number to it. Now one read of a key
returns every write to it, in order. A read of x as `[1 2 3]` says the
versions were `[]`, `[1]`, `[1 2]`, `[1 2 3]`, and which transaction made
each one. The version order is right there in the data.

With that, every edge can be read off directly:

- A read of `[1 2]` came after the append of 2: a wr edge.
- The append of 2 came right after the append of 1: a ww edge.
- A read of `[1]` didn't see the append of 2: an rw edge from the reader
  to the transaction that appended 2.

Here is a history small enough to check by hand:

![Left: three committed transactions. A appends 1 to x and reads y as the list 1. B appends 2 to x and appends 1 to y. C reads x as the list 1, 2. Right: the graph the checker infers between A and B. A wr edge on y goes from B to A, because A read the 1 that only B wrote. A ww edge on x goes from A to B, because C saw 1 then 2, so A's append came before B's. Together they form a cycle, G1c.](img/history-checking-g1c-example.svg)

*Two edges, one from each key, and no order can satisfy both. Adapted from the demo in Elle's README.*

A read y and saw B's append, so B must come before A. C read x as
`[1 2]`, so A's append to x happened before B's, and A must come before B.
Both can't be true. That's a G1c cycle, and Elle reports that this
history isn't even read committed.

The cost is that writes near the end of a history might never be read,
so their order stays unknown. If the test reads often, that tail stays
small.

Lists are easy to get almost anywhere. In SQL, a TEXT column you extend
with CONCAT, or `INSERT ... ON CONFLICT DO UPDATE`, works; Jepsen's
PostgreSQL test stored each list as comma-separated text in a row.

## Finding and explaining the cycles

Once the graph is built, finding a cycle is cheap. Tarjan's algorithm
groups the transactions into strongly connected components, sets where
each one can reach every other, in time linear in nodes plus edges. Cycles
live inside those components. Inside each one, a breadth-first search
finds a short cycle to show you.

To tell anomalies apart, the search runs on filtered copies of the graph.
Only ww edges finds G0. Only ww and wr edges finds G1c. For G-single, the
search follows exactly one rw edge and then tries to close the loop with
ww and wr edges only.

The report is the useful part. Elle names the weakest level the history
breaks, and explains each cycle in plain steps. For the example above
(where Elle's T1 is B and its T2 is A), the output reads:

```
- T1 < T2, because T2 observed T1's append of 1 to key :y.
- However, T2 < T1, because T1 appended 2 after T2 appended 1 to :x: a contradiction!
```

Two more kinds of edge make the check stricter:

- **Process edges.** Transactions from one client happen in that client's
  order. Adding these edges catches a client that sees a write and then
  stops seeing it, which plain snapshot isolation technically allows.
- **Real-time edges.** If T1 finished before T2 started, T1 comes first.
  Serializability alone doesn't require this: a serializable database may
  legally answer every read-only transaction with the empty initial
  state. Adding real-time edges checks strict serializability instead.

The same pass also flags things outside the graph: reading a value nobody
wrote (garbage), the same append applied twice (often a retry), and a
transaction that doesn't see its own earlier write (internal
inconsistency).

## What it has found

- **PostgreSQL 12.3.** At SERIALIZABLE, a two-minute run found six
  G2-item cycles. Each involved a freshly inserted row. The cause: the
  SSI conflict check could blame the wrong transaction ID for a tuple
  that had been updated, so a real conflict went unflagged. The code had
  barely changed since SSI went in, and the bug was present from 9.5.22
  through 13. The same test showed REPEATABLE READ is snapshot isolation
  and allows G2-item, which formal definitions of repeatable read forbid
  but the SQL standard's loose wording arguably allows.
- **TiDB 2.1.7 to 3.0.0-beta.1.** G-single and lost updates, from an
  automatic retry, on by default, that re-applied a transaction's writes
  after a conflict. It also showed that `SELECT ... FOR UPDATE` (see
  [[explicit-locking]]) didn't stop write skew, because rows that didn't
  exist yet couldn't be locked.
- **FaunaDB 2.6.0.** A transaction appended to a key and then failed to
  read its own write.

## Where it gets tricky

**It finds bugs; it can't prove there are none.** Elle is sound but not
complete. When it reports a cycle, every way of filling in the unknowns
(indeterminate commits, unread writes) still contains that cycle, unless
it contains something worse, like a read of aborted data. But a
clean run only means this history, with these transactions, showed
nothing. Unknown commits and the unread tail can hide a real anomaly, and
a database that returns wrong values in just the right way can fake or
mask one. Check every reported anomaly by hand before you believe it.

**No predicates, so no phantoms.** Elle's model has single keys only, not
`WHERE` clauses. It can find G2-item but not G2 in general, which means
it can't tell repeatable read from serializable, and it can't test
[[phantom-read|phantoms]] or [[predicate-locks]]. Aggregations,
subqueries, deletes and stored procedures aren't covered by the
list-append workload either. A clean result speaks only for the SQL your
test actually ran.

**Shape the workload, or solve the search?** Elle picks data that makes
the version order visible, so the check stays near linear. Cobra (OSDI
2020) takes the other road: it accepts ordinary reads and writes, encodes
each unknown write order as an either-or constraint, prunes with GPUs, and
hands the rest to an SMT solver built for graph problems. It reported
checking 10,000 transactions in 14 seconds. Theory says how far each road
goes: checking read committed, read atomic or causal consistency is
polynomial, while snapshot isolation and serializability are NP-complete
in general, but become polynomial if the number of client sessions is
fixed. The practical split is whether you can choose the workload (Elle)
or must check the one you have (Cobra).

**Different from linearizability checking.** [[linearizability-checking]]
(Knossos, for one) checks a history against [[linearizability]] by
searching through orderings of concurrent operations: up to c! of them
for c concurrent transactions. In the Elle paper's benchmark on a
24-core machine, Knossos generally couldn't finish 5,000-transaction
histories at 40 or more concurrent processes, while Elle checked real
histories of hundreds of thousands of transactions in tens of seconds,
barely slowed by concurrency. The optimized Elle has since checked 22
million transactions in about two minutes, using about 60 GB of heap.

## What this means when you build

- Make every written value unique, and prefer append-to-list over
  overwrite so reads reveal the version order.
- Record unknown commits as unknown. Record the client and the start and
  end time of every transaction, so you can add process and real-time
  edges when the level claims them.
- Run many short random transactions over few keys, with enough
  concurrency to conflict, and read often. Add
  [[fault-injection|faults]] once the fault-free runs are clean.
- Check against the level the database claims, and read the weakest level
  it breaks, not just pass or fail.
- Treat every reported cycle as a lead. Read the transactions and confirm
  the contradiction yourself before calling it a bug.
- For this phase's lab: run the checker against PostgreSQL at each level
  before your own engine. Reproducing G2-item at REPEATABLE READ is a
  first sign the checker works. At SERIALIZABLE, on a version after the
  patch Jepsen's report describes, a clean run is what you'd expect, but
  confirm it rather than assume it.

## Further reading

- [Elle: Inferring Isolation Anomalies from Experimental Observations](https://arxiv.org/pdf/2003.10554), Kyle Kingsbury and Peter Alvaro, 2020. The method: recoverability, traceability, the list-append trick, cycle search, and the TiDB, YugaByte, FaunaDB and Dgraph case studies.
- [Elle (README)](https://github.com/jepsen-io/elle), Jepsen. The worked G1c example, what Elle can and can't detect, and current performance.
- [PostgreSQL 12.3](https://jepsen.io/analyses/postgresql-12.3), Kyle Kingsbury (Jepsen), 2020. History checking finding a real SSI bug, with the cycles drawn out, and why hand-written tests missed it.
- [Weak Consistency: A Generalized Theory and Optimistic Implementations for Distributed Transactions](https://publications.csail.mit.edu/lcs/pubs/pdf/MIT-LCS-TR-786.pdf), Atul Adya, MIT PhD thesis, 1999. The source of the dependency graph and the G0 to G2 anomaly names; chapter 3.
- [Cobra: Making Transactional Key-Value Stores Verifiably Serializable](https://www.usenix.org/system/files/osdi20-tan.pdf), Cheng Tan, Changgeng Zhao, Shuai Mu and Michael Walfish, OSDI 2020. The other approach: searching unknown write orders with a solver instead of shaping the workload.
- [On the Complexity of Checking Transactional Consistency](https://arxiv.org/pdf/1908.04509), Ranadeep Biswas and Constantin Enea, 2019. Which isolation levels are cheap to check from a history and which are NP-complete.
