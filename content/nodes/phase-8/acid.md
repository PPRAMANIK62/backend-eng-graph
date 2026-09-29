---
id: acid
title: ACID
depth: short
phase: 8
note: >-
  What each letter really promises. Most of them point to another
  mechanism, and C is mostly your job.
needs: [transaction]
leads_to: []
compare_with: [isolation-levels, constraints]
---

# ACID

ACID is the four promises a database makes about a [[transaction]]:
atomicity, consistency, isolation and durability. It's a handy word,
and plenty of databases advertise that they're ACID. But
each letter means something narrower than it sounds, three of them are
really pointers to other mechanisms, and one of them is mostly your job.

The name comes from a 1983 paper by Theo Haerder and Andreas Reuter,
who picked it so that asking whether a system supports transactions
would be "the ACID test" of its quality.

## What each letter promises

Take the usual example: a transfer of 100 from Alice to Bob, as two
updates inside one transaction.

![Four rows, one per letter. A, atomicity: all of the transfer or none of it, done by the undo log or write-ahead log. C, consistency: the transfer keeps the rules true, done by constraints the database checks and by your code. I, isolation: the transfer acts as if it ran alone, done by concurrency control at the chosen isolation level. D, durability: once committed, the transfer survives a crash, done by the write-ahead log and fsync. The C row is marked as mostly the application's job.](img/acid-letters.svg)

*Each letter, what it promises, and what actually delivers it.*

**Atomicity: all or nothing.** Either both updates happen or neither
does, and afterwards you know which. If the transaction aborts,
because your code rolled it back, the database gave up on it, or the
server crashed, every change it made is undone. Databases get this by
logging each change so they can undo it (almost all of them) or by
writing changes to copies of pages and switching over at commit
(shadow paging, which is rare because it's slower at run time). The
details are in [[write-ahead-log]] and [[crash-recovery]].

Atomicity here is about failure, not about other users. It says
nothing about what a concurrent transaction sees while yours runs.
That's the I.

**Consistency: the rules still hold.** If the database was valid before
the transaction and the transaction is correct, it's valid after. There
are two parts to this:

- The rules the database knows about: [[constraints]] like `NOT NULL`,
  foreign keys and `CHECK`, plus cascades and [[triggers]]. The
  database checks these itself.
- The rules it doesn't know about: Alice's and Bob's balances should add
  up to the same total before and after. Only your code knows that
  debiting Alice means crediting Bob.

The original definition even makes the second part circular: a
transaction is assumed to be correct, so a successful one commits only
legal results. The database can't check your business logic. So C is
the odd letter out: the other three are things the database does for
you, and C is mostly something you do with the help of A, I and D.

**Isolation: as if it ran alone.** While your transfer runs, other
transactions shouldn't see its half-done state, and it shouldn't see
theirs. The strict version of this is [[serializability]]: the result
is the same as running the transactions one at a time. In practice
every database lets you pick a weaker [[isolation-levels|isolation level]]
for speed, and most don't use the strict one by default.

**Durability: committed means kept.** Once the database says the
transfer committed, it survives a crash or restart. That's usually
done with the same log as atomicity, kept on non-volatile storage. How
honest that is depends on [[fsync]] and the drive.

## Where it gets tricky

**"ACID" rarely means serializable.** The textbook I is
serializability. A 2013 survey of 18 databases found only three that
gave serializability by default, and only nine that offered it at all.
A database can call itself ACID while its default isolation level lets
real races through. Always check which level you're running at.

**The C is not the database's promise.** It's the one letter a database
can't fully deliver, because it depends on your transactions being
correct. Constraints are how you hand part of it back to the database.

## What this means when you build

- Treat "ACID" on a feature list as a starting question, not an answer:
  which isolation level, and is commit really durable on this setup?
- Put the rules you can into constraints, so the database checks them
  for every transaction, including ones written later by someone else.
- For the rules you can't express, make each transaction correct on
  its own, and pick an isolation level that keeps it correct when
  others run at the same time.

## Further reading

- [Principles of Transaction-Oriented Database Recovery](https://cs-people.bu.edu/mathan/reading-groups/papers-classics/recovery.pdf), Theo Haerder and Andreas Reuter, 1983. Section 1.1 defines the four properties and names them ACID.
- [Lecture #16: Concurrency Control Theory](https://15445.courses.cs.cmu.edu/fall2024/notes/16-concurrencycontrol.pdf), Andy Pavlo, CMU 15-445, 2024. Each letter and how a database implements it, and the split between database and transaction consistency.
- [When is "ACID" ACID? Rarely.](http://www.bailis.org/blog/when-is-acid-acid-rarely/), Peter Bailis, 2013. Default and strongest isolation levels in 18 databases, most of them short of serializable.
