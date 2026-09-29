---
id: write-skew
title: Write skew
depth: deep
phase: 8
note: >-
  Two transactions each check a rule, both pass, and together they break
  it.
needs: [isolation-levels, serializability, constraints]
leads_to: [serializable-snapshot-isolation]
compare_with: [lost-update, phantom-read, predicate-locks, optimistic-concurrency]
---

# Write skew

Write skew is when two transactions each read some shared data, each
check a rule against it, each find the rule holds, and each write a
*different* row. Run one at a time, the second would have seen the
first's change and stopped. Run together, both pass the check and the
rule is broken. [[snapshot-isolation|Snapshot isolation]], which is
what Postgres gives you at the REPEATABLE READ
[[isolation-levels|isolation level]], lets it through, because there's
no single row both transactions wrote.

## Two doctors, one rule

A hospital's rule: at least one doctor must be on call for a shift.
Alice and Bob are both on call. Both feel unwell, and both click "go
off call" at about the same time. The app runs this for each of them:

```sql
BEGIN;
SELECT count(*) FROM doctors WHERE on_call = true;   -- 2
-- 2 is at least 2, so it's fine for me to leave
UPDATE doctors SET on_call = false WHERE name = 'Alice';   -- or 'Bob'
COMMIT;
```

Run one after the other, this is correct. Whoever goes second counts 1
and is told they can't leave. Run at the same time under snapshot
isolation, both transactions count 2, both update their own row, both
commit. Nobody is on call.

![Timeline of two transactions under snapshot isolation. T1 (Alice) and T2 (Bob) both start with Alice and Bob on call. Each counts on-call doctors from its own snapshot and gets 2. T1 sets Alice off call and commits; T2 sets Bob off call and commits. The two writes touch different rows, so no conflict is detected. The final state has nobody on call. A small graph shows an rw edge from T1 to T2 and another from T2 to T1, forming a cycle.](img/write-skew-doctors.svg)

*Each transaction's check was true in its snapshot; together they break the rule. Adapted from Ports and Grittner, "Serializable Snapshot Isolation in PostgreSQL" (2012), figures 1 and 3a.*

## Why snapshot isolation doesn't notice

Snapshot isolation gives each transaction a
frozen view of the data as of its start, and it resolves conflicts with
one rule: if two concurrent transactions write the same row, only the
first to commit wins. That rule is exactly what stops a
[[lost-update]]. Here it never fires. T1 wrote Alice's row, T2 wrote
Bob's row. Row-level write locks don't help either, for the same
reason: different rows, no conflict.

The problem is in the reads. T1's decision depended on Bob's row, which
T2 changed. T2's decision depended on Alice's row, which T1 changed.
Neither saw the other's write, because each read from its own snapshot.
A database built on [[two-phase-locking]] would have caught it: each
transaction's read locks would conflict with the other's write. So
would an [[optimistic-concurrency|optimistic system]] that checks at
commit whether what you read is still current.

The 1995 paper that defined snapshot isolation also named this
pattern and wrote it as a history: T1 reads `x` and `y`, T2 reads `x`
and `y`, T1 writes `y`, T2 writes `x`, both commit. Any rule that ties
`x` and `y` together can break. Their example was a bank that lets one
account go negative as long as the customer's accounts together stay
at or above zero. In SQL on Postgres: two
accounts of $500 each, two withdrawals of $900 at once, one from each
account. Each transaction checks that the total is $1,000 and approves.
At REPEATABLE READ, both commit.

## The dependency cycle

There's a precise way to say "no serial order explains this", and it's
the idea behind [[serializability]]. Draw each transaction as a node,
and draw an edge for each ordering the data forces.

When a transaction reads a version of a row and another transaction
writes the next version, the reader must come first in any serial order
that explains what it saw. That's a read-write dependency, often called
an rw-antidependency. In the doctors example:

- T1 read Bob's row before T2 changed it, so T1 must come before T2.
- T2 read Alice's row before T1 changed it, so T2 must come before T1.

That's a cycle, so no serial order exists. Every anomaly that snapshot
isolation allows shows up as a cycle with at least two of these rw
edges, and they sit next to each other. That's the fact
[[serializable-snapshot-isolation]] is built on: it watches for a
transaction with an rw edge coming in and one going out, and aborts one
of the transactions involved.

## When the rows don't exist yet

Often the rule is about the absence of rows. Two people book the same
meeting room for overlapping times: each checks that no booking
overlaps, each inserts one. Or a rule enforced by a trigger: values must be unique in their first six characters, so each
insert checks for a match and finds none, because the other's row isn't
visible yet. Or the tasks for a job may total
at most 8 hours; two transactions each see 7 hours and each add a
1-hour task.

These are write skew where the conflicting rows are new. The check read
"nothing matches", and the other transaction created something that
matches. That's the shape of a [[phantom-read]], and it's harder to
fix: you can't lock a row that isn't there yet, so row locks and
`SELECT ... FOR UPDATE` on the rows you read don't help. You need a
lock on the condition itself, a [[predicate-locks|predicate lock]], or
one of the fixes below.

## How to prevent it

**Run at SERIALIZABLE.** In Postgres since 9.1, SERIALIZABLE is
serializable snapshot isolation. It runs like REPEATABLE READ, but
tracks what each transaction read (with predicate locks that never
block) and rolls one transaction back when a dangerous pattern
appears:

```
ERROR: could not serialize access due to read/write dependencies among transactions
```

The first to commit wins; the other gets SQLSTATE 40001 and has to
rerun from the start. On retry, the second doctor counts 1 and is told
no. The same goes for two transactions summing
different groups of rows and inserting the result into the other's
group; at REPEATABLE READ both commit, at SERIALIZABLE one is rolled
back. MySQL's SERIALIZABLE works differently: in the Hermitage test,
the second transaction's update blocks and then fails with a deadlock
error.

**Lock what the check reads.** If the rows your rule depends on exist,
lock them: `SELECT ... FROM doctors WHERE shift = 42 FOR UPDATE`, then
count the rows in your code. The second transaction's SELECT now waits
for the first to commit. At READ COMMITTED it then gets the new
versions of the rows; at REPEATABLE READ it fails with a serialization
error and retries. This only covers rows that exist when you lock,
and only helps if every code path that changes them takes the same
lock. See [[explicit-locking]].

**Materialize the conflict.** If there's no natural row to lock, make
one: a row per shift, per room, per job, that every transaction
touching that rule locks or updates before it runs its check. Two
bookings for one room now meet on the room's row, and the database sees
an ordinary row conflict. One waits for the other; at READ COMMITTED
its check then sees the first booking, and at REPEATABLE READ it may
fail with a serialization error and retry. The cost is an extra row
that exists only for this.

**Make it a constraint.** If the rule can be written as a unique,
foreign key or exclusion constraint, the database enforces it no matter
the isolation level. See [[constraints]] for what each kind can
express. When a declarative constraint fits, it beats a trigger or
app-side check: it's simpler and has fewer ways to go wrong.

## Where it gets tricky

**"Serializable" doesn't always mean serializable.** Oracle's
SERIALIZABLE is snapshot isolation, and Hermitage's tests show it lets
write skew through. Postgres's own SERIALIZABLE was snapshot isolation
until 9.1; asking for REPEATABLE READ today gets you that old behavior.
Check what your database's level does, not what it's called.

**Read-only transactions can see it too.** A read-only transaction
can't break a rule in the database, but at REPEATABLE READ it can
observe a state no serial order would produce. The classic case is a
batch report: it sees that a batch was closed, but misses a receipt
that was still being added to that batch. At SERIALIZABLE, data a
transaction read isn't trustworthy until the transaction commits; if
it's later rolled back, throw its results away.

**Retries aren't free, and some are false alarms.** SSI checks for a
pattern that *can* lead to a cycle, not for the cycle itself, so it
sometimes aborts transactions that would have been fine. Under heavy
contention, a transaction can need several attempts. Your code needs a
retry loop around the whole transaction, including the logic that
decided what to write.

**The error isn't always 40001.** When two SERIALIZABLE transactions
both check that a key is free and both insert it, the loser can get a
unique-key violation (23505) instead of a serialization failure,
because the database can't see the link between your earlier read and
the insert. Treat that as a conflict to retry too, with care, since a
unique violation can also be a real, permanent error.

**Replicas aren't covered.** Postgres's SERIALIZABLE protection doesn't
yet extend to hot standby or logical replicas, so reads there don't get
the guarantee.

**Finding it by hand is hard.** To prove a set of transactions is safe
under snapshot isolation, you have to consider every pair that could
run at the same time. At a large schema with many programmers and
ORM-generated queries, that analysis stops being practical, which is
the case for letting the database do it.

## What this means when you build

- Look for "check, then write something else": a count, a sum, or a
  "does anything exist?" check, followed by a write to a different row.
  That's the write-skew shape. A read-modify-write of the *same* row is
  a lost update instead.
- If the rule fits a unique, foreign key or exclusion constraint, use
  the constraint.
- If not, and you're on Postgres, run those transactions at
  SERIALIZABLE and retry on 40001. If the whole app uses SERIALIZABLE,
  you can drop most `FOR UPDATE` calls you added for safety.
- Where you can't use SERIALIZABLE, lock the rows the check reads, or
  add a row that stands for the rule and lock that.
- Don't send results from a SERIALIZABLE transaction anywhere until it
  has committed.

## Further reading

- [A Critique of ANSI SQL Isolation Levels](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/tr-95-51.pdf), Berenson, Bernstein, Gray, Melton, O'Neil and O'Neil, 1995. Names write skew, gives the history and the bank example, and shows snapshot isolation allows it.
- [Serializable Snapshot Isolation in PostgreSQL](https://drkp.net/papers/ssi-vldb12.pdf), Dan Ports and Kevin Grittner, 2012. The doctors example, the workarounds, rw-antidependencies, and how Postgres detects dangerous structures.
- [SSI](https://wiki.postgresql.org/wiki/SSI), PostgreSQL wiki. Runnable two-session examples: black and white rows, overdraft, a trigger-enforced rule, a batch report.
- [13.2 Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html), PostgreSQL 18 documentation. REPEATABLE READ versus SERIALIZABLE, the class/value example, and the rules for using SERIALIZABLE well.
- [13.4 Data Consistency Checks at the Application Level](https://www.postgresql.org/docs/current/applevel-consistency.html), PostgreSQL 18 documentation. Why rule checks fail below SERIALIZABLE, and the replica caveat.
- [13.5 Serialization Failure Handling](https://www.postgresql.org/docs/current/mvcc-serialization-failure-handling.html), PostgreSQL 18 documentation. Which errors to retry, and why the whole transaction must rerun.
- [Hermitage](https://github.com/ept/hermitage), Martin Kleppmann and contributors. Write skew (G2-item) and its predicate form (G2) tested on Postgres, MySQL and Oracle.
