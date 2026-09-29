---
id: cmu-15445-concurrency-control
title: "Lecture #16: Concurrency Control Theory (15-445/645 Database Systems)"
author: Andy Pavlo, Carnegie Mellon University
url: https://15445.courses.cs.cmu.edu/fall2024/notes/16-concurrencycontrol.pdf
kind: docs
primary: false
---

## Summary

Lecture notes for CMU's database systems course, Fall 2024 edition.
What a transaction is, the four ACID properties and how each is
achieved, then schedules, conflicts, conflict and view serializability,
and the dependency graph test.

## Key claims

- A transaction is the unit of change, and it's all or nothing. "They are the basic unit of change in a DBMS. Partial transactions are not allowed (i.e. transactions must be atomic)." (2 Transactions)
- A transaction can't undo effects outside the database, like an email. "It cannot make changes to the outside world because it cannot roll those back." (2 Transactions)
- The client decides where a transaction starts and ends; aborts can come from either side. "Aborts can be either self-inflicted or caused by the DBMS." (3 Definitions)
- A commit can be turned into an abort by the database. "For COMMIT, either all of the transaction’s modifications are saved to the database, or the DBMS overrides this and aborts instead." (3 Definitions)
- Atomicity is done with logging (undo records) or shadow paging. "DBMS logs all actions so that it can undo the actions in case of an aborted transaction." (4 ACID: Atomicity)
- Shadow paging is rarely used. "In general, though, better runtime performance is preferred over better recovery performance, so this is rarely used in practice." (4)
- Consistency of a transaction is the application's job. "Ensuring transaction consistency is the application’s responsibility." (5 ACID: Consistency)
- Isolation: each transaction acts as if it were alone. "The DBMS provides transactions the illusion that they are running alone in the system." (6 ACID: Isolation)
- Durability via logging or shadow paging. "All of the changes of committed transactions must be durable (i.e., persistent) after a crash or restart." (7 ACID: Durability)
- Pessimistic vs optimistic concurrency control. "Optimistic: The DBMS assumes that conflicts between transactions are rare, so it chooses to deal with conflicts when they happen after the transactions commit." (6 Concurrency Control)
- A serializable schedule is equivalent to some serial one, and different serial orders can give different results. "Different serial executions can produce different results, but all are considered “correct”." (6)
- A conflict: different transactions, same object, at least one write. "A conflict between two operations occurs if the operations are for different transactions, they are performed on the same object, and at least one of the operations is a write." (6)
- Databases use conflict serializability because it can be enforced efficiently. "In practice, DBMSs support conflict serializability because it can be enforced efficiently." (6)
- The dependency graph test. "Then, a schedule is conflict serializable iff the dependency graph is acyclic." (6 Conflict Serializability)
- An edge goes from Ti to Tj when an operation of Ti conflicts with a later operation of Tj. "There exists a directed edge from node Ti to Tj iff an operation Oi from Ti conflicts with an operation Oj from Tj and Oi occurs before Oj in the schedule." (6 Conflict Serializability)
- View serializability allows more schedules, including blind writes, but is hard to enforce. "Thus, it allows for more schedules than conflict serializability, but is difficult to enforce efficiently." (6 View Serializability)
- Durability usually means committed changes are on non-volatile storage. "This usually requires that committed transactions are stored in non-volatile memory." (7 ACID: Durability)

## Visuals worth redrawing

- The universe of schedules as nested sets: serial inside conflict
  serializable inside view serializable inside all schedules.

## My notes

- The notes simplify: a fixed set of objects, reads and updates only,
  no inserts or deletes. Phantoms need predicate reads, which these
  notes leave out.
