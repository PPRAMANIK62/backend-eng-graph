---
id: postgres-transaction-iso
title: "PostgreSQL documentation, 13.2 Transaction Isolation"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/transaction-iso.html
kind: docs
primary: true
---

## Summary

The Postgres manual's page on isolation levels (read at version 18). It
defines the four phenomena (dirty read, nonrepeatable read, phantom read,
serialization anomaly), gives Table 13.1 of which level allows which, and
then describes how Read Committed, Repeatable Read (snapshot isolation)
and Serializable (serializable snapshot isolation) behave, including what
happens when two transactions update the same row.

## Key claims

- The standard defines the lower levels by phenomena that must not occur. "The other three levels are defined in terms of phenomena, resulting from interaction between concurrent transactions, which must not occur at each level." (13.2)
- Dirty read. "A transaction reads data written by a concurrent uncommitted transaction." (13.2, dirty read)
- Nonrepeatable read. "A transaction re-reads data it has previously read and finds that data has been modified by another transaction (that committed since the initial read)." (13.2, nonrepeatable read)
- Phantom read. "A transaction re-executes a query returning a set of rows that satisfy a search condition and finds that the set of rows satisfying the condition has changed due to another recently-committed transaction." (13.2, phantom read)
- Serialization anomaly. "The result of successfully committing a group of transactions is inconsistent with all possible orderings of running those transactions one at a time." (13.2, serialization anomaly)
- Table 13.1: dirty read is "Allowed, but not in PG" at Read uncommitted; nonrepeatable and phantom reads are possible at Read committed; phantom read is "Allowed, but not in PG" at Repeatable read; only Serializable rules out serialization anomalies. (Table 13.1)
- Read Uncommitted is Read Committed in Postgres. "PostgreSQL's Read Uncommitted mode behaves like Read Committed." (13.2)
- Why: it fits MVCC. "This is because it is the only sensible way to map the standard isolation levels to PostgreSQL's multiversion concurrency control architecture." (13.2)
- Postgres's Repeatable Read has no phantoms, which the standard permits. "The table also shows that PostgreSQL's Repeatable Read implementation does not allow phantom reads." (13.2)
- The standard sets minimums only. "As mentioned above, this is specifically allowed by the standard, which only describes the minimum protections each isolation level must provide." (13.2.2)
- Read Committed is the default. "Read Committed is the default isolation level in PostgreSQL." (13.2.1)
- Each statement gets a new snapshot at Read Committed. "In effect, a SELECT query sees a snapshot of the database as of the instant the query begins to run." (13.2.1)
- So two SELECTs in one transaction can differ. "Also note that two successive SELECT commands can see different data, even though they are within a single transaction, if other transactions commit changes after the first SELECT starts and before the second SELECT starts." (13.2.1)
- A second updater waits for the first. "In this case, the would-be updater will wait for the first updating transaction to commit or roll back (if it is still in progress)." (13.2.1)
- Then it re-checks the WHERE clause against the new row version and applies its change to that. "The search condition of the command (the WHERE clause) is re-evaluated to see if the updated version of the row still matches the search condition." (13.2.1)
- That's why an increment like balance = balance + 100 is safe at Read Committed. "Because each command is affecting only a predetermined row, letting it see the updated version of the row does not create any troublesome inconsistency." (13.2.1)
- Complex search conditions can go wrong: the hits = hits + 1 versus DELETE WHERE hits = 10 example deletes nothing. "The DELETE will have no effect even though there is a website.hits = 10 row before and after the UPDATE." (13.2.1)
- Repeatable Read sees one snapshot for the whole transaction. "Thus, successive SELECT commands within a single transaction see the same data, i.e., they do not see changes made by other transactions that committed after their own transaction started." (13.2.2)
- Repeatable Read prevents everything in Table 13.1 except serialization anomalies. "This is a stronger guarantee than is required by the SQL standard for this isolation level, and prevents all of the phenomena described in Table 13.1 except for serialization anomalies." (13.2.2)
- At Repeatable Read, updating a row someone else changed and committed fails. "ERROR: could not serialize access due to concurrent update" (13.2.2)
- That covers locking reads too, not only UPDATE: the list includes SELECT FOR UPDATE and SELECT FOR SHARE. "because a repeatable read transaction cannot modify or lock rows changed by other transactions after the repeatable read transaction began." (13.2.2)
- On retry, the transaction sees the other change. "The second time through, the transaction will see the previously-committed change as part of its initial view of the database, so there is no logical conflict in using the new version of the row as the starting point for the new transaction's update." (13.2.2)
- For SELECT FOR UPDATE at Read Committed, the waiting transaction locks and returns the updated row. "In the case of SELECT FOR UPDATE and SELECT FOR SHARE, this means it is the updated version of the row that is locked and returned to the client." (13.2.1)
- The fix is to retry the whole transaction. "When an application receives this error message, it should abort the current transaction and retry the whole transaction from the beginning." (13.2.2)
- Read-only transactions never get that error. "Note that only updating transactions might need to be retried; read-only transactions will never have serialization conflicts." (13.2.2)
- Business rules at Repeatable Read need explicit locks. "Attempts to enforce business rules by transactions running at this isolation level are not likely to work correctly without careful use of explicit locks to block conflicting transactions." (13.2.2)
- Repeatable Read is snapshot isolation. "The Repeatable Read isolation level is implemented using a technique known in academic database literature and in some other database products as Snapshot Isolation." (13.2.2)
- Before 9.1, SERIALIZABLE meant this behaviour. "Prior to PostgreSQL version 9.1, a request for the Serializable transaction isolation level provided exactly the same behavior described here." (13.2.2, Note)
- The class/value example: A sums class 1 and inserts the sum as class 2, B sums class 2 and inserts as class 1. Both commit at Repeatable Read; at Serializable one is rolled back. "If either transaction were running at the Repeatable Read isolation level, both would be allowed to commit; but since there is no serial order of execution consistent with the result, using Serializable transactions will allow one transaction to commit and will roll the other back with this message:" (13.2.3)
- The Serializable error text. "ERROR: could not serialize access due to read/write dependencies among transactions" (13.2.3)
- Don't trust what a Serializable transaction read until it commits. "When relying on Serializable transactions to prevent anomalies, it is important that any data read from a permanent user table not be considered valid until the transaction which read it has successfully committed." (13.2.3)
- Serializable uses non-blocking predicate locks to find dangerous dependencies. "In PostgreSQL these locks do not cause any blocking and therefore can not play any part in causing a deadlock." (13.2.3)
- Without Serializable, you lock a whole table or use SELECT FOR UPDATE / FOR SHARE. "In contrast, a Read Committed or Repeatable Read transaction which wants to ensure data consistency may need to take out a lock on an entire table, which could block other users attempting to use that table, or it may use SELECT FOR UPDATE or SELECT FOR SHARE which not only can block other transactions but cause disk access." (13.2.3)
- Check-then-insert can surface as a unique violation under Serializable. "In particular, it is possible to see unique constraint violations caused by conflicts with overlapping Serializable transactions even after explicitly checking that the key isn't present before attempting to insert it." (13.2.3)
- At Serializable, explicit locks become unnecessary. "Eliminate explicit locks, SELECT FOR UPDATE, and SELECT FOR SHARE where no longer needed due to the protections automatically provided by Serializable transactions." (13.2.3)
- Serializable is serializable snapshot isolation. "The Serializable isolation level is implemented using a technique known in academic database literature as Serializable Snapshot Isolation, which builds on Snapshot Isolation by adding checks for serialization anomalies." (13.2.3)
- The standard's definition of Serializable. "any concurrent execution of a set of Serializable transactions is guaranteed to produce the same effect as running them one at a time in some order." (13.2)
- Sequence changes are never rolled back. "changes made to a sequence (and therefore the counter of a column declared using serial) are immediately visible to all other transactions and are not rolled back if the transaction that made the changes aborts." (13.2, Important)
- Because of the re-check rule, one updating command can see a mixed view. "it is possible for an updating command to see an inconsistent snapshot" (13.2.1)
- The Repeatable Read snapshot is taken at the first real statement, not at BEGIN. "a query in a repeatable read transaction sees a snapshot as of the start of the first non-transaction-control statement in the transaction" (13.2.2)
- Applications at Repeatable Read must retry. "Applications using this level must be prepared to retry transactions due to serialization failures." (13.2.2)
- Serializable adds no blocking beyond Repeatable Read. "This monitoring does not introduce any blocking beyond that present in repeatable read" (13.2.3)
- Data read in a Serializable transaction isn't trustworthy until commit. "it is important that any data read from a permanent user table not be considered valid until the transaction which read it has successfully committed." (13.2.3)
- If each transaction is right alone, it's right in any mix of Serializable transactions. "if you can demonstrate that a single transaction, as written, will do the right thing when run by itself, you can have confidence that it will do the right thing in any mix of Serializable transactions" (13.2.3)
- Serialization failures always carry SQLSTATE 40001. "serialization failures (which always return with an SQLSTATE value of '40001')" (13.2.3)
- Keep transactions small. "Don't put more into a single transaction than needed for integrity purposes." (13.2.3)
- At Repeatable Read the snapshot is taken at the first real statement, not at BEGIN. "a query in a repeatable read transaction sees a snapshot as of the start of the first non-transaction-control statement in the transaction, not as of the start of the current statement within the transaction." (13.2.2)
- A Repeatable Read updater that hits a row being changed waits for the other transaction. "In this case, the repeatable read transaction will wait for the first updating transaction to commit or roll back (if it is still in progress)." (13.2.2)
- If that one rolls back, it goes ahead. "If the first updater rolls back, then its effects are negated and the repeatable read transaction can proceed with updating the originally found row." (13.2.2)
- If it commits, the waiter fails. "because a repeatable read transaction cannot modify or lock rows changed by other transactions after the repeatable read transaction began." (13.2.2)
- Even a read-only Repeatable Read transaction can see a state no serial order produces (the batch control record example). "For example, even a read-only transaction at this level may see a control record updated to show that a batch has been completed but not see one of the detail records which is logically part of the batch because it read an earlier revision of the control record." (13.2.2)
- Serializable adds monitoring, not blocking. "This monitoring does not introduce any blocking beyond that present in repeatable read, but there is some overhead to the monitoring, and detection of the conditions which could cause a serialization anomaly will trigger a serialization failure." (13.2.3)
- Don't trust what you read until commit. "it is important that any data read from a permanent user table not be considered valid until the transaction which read it has successfully committed." (13.2.3)
- The predicate locks show in pg_locks. "These will show up in the pg_locks system view with a mode of SIReadLock." (13.2.3)
- Which locks you get depends on the plan. "The particular locks acquired during execution of a query will depend on the plan used by the query" (13.2.3)
- SIRead locks outlive commit. "On the other hand, SIRead locks often need to be kept past transaction commit, until overlapping read write transactions complete." (13.2.3)
- DEFERRABLE is the one case where Serializable blocks and Repeatable Read doesn't. "If you explicitly request a SERIALIZABLE READ ONLY DEFERRABLE transaction, it will block until it can establish this fact." (13.2.3)
- Serialization failures always use SQLSTATE 40001. "(which always return with an SQLSTATE value of '40001')" (13.2.3)
- Idle-in-transaction sessions hurt Serializable. "Don't leave connections dangling “idle in transaction” longer than necessary." (13.2.3)
- Keep active connections down with a pool. "Control the number of active connections, using a connection pool if needed." (13.2.3)
- Deferrable read-only transactions are the exception to "don't trust until commit". "except that data read within a deferrable read-only transaction is known to be valid as soon as it is read" (13.2.3)
- A sequential scan locks the whole table. "A sequential scan will always necessitate a relation-level predicate lock." (13.2.3)
- Running out of predicate lock memory raises the failure rate. "When the system is forced to combine multiple page-level predicate locks into a single relation-level predicate lock because the predicate lock table is short of memory, an increase in the rate of serialization failures may occur." (13.2.3)
- Serializable uses predicate locking to spot a write that would have changed an earlier read. "To guarantee true serializability PostgreSQL uses predicate locking, which means that it keeps locks which allow it to determine when a write would have had an impact on the result of a previous read from a concurrent transaction, had it run first." (13.2.3)
- Predicate locks are on data actually accessed, and fine ones merge into coarse ones. "and multiple finer-grained locks (e.g., tuple locks) may be combined into fewer coarser-grained locks (e.g., page locks) during the course of the transaction to prevent exhaustion of the memory used to track the locks." (13.2.3)
- Merging into a relation-level lock raises the failure rate. "When the system is forced to combine multiple page-level predicate locks into a single relation-level predicate lock because the predicate lock table is short of memory, an increase in the rate of serialization failures may occur." (13.2.3)
- A Read Committed SELECT sees its own transaction's earlier changes. "However, SELECT does see the effects of previous updates executed within its own transaction, even though they are not yet committed." (13.2.1)
- Why the hits DELETE misses: the 9 was skipped and the other row became 11. "the pre-update row value 9 is skipped, and when the UPDATE completes and DELETE obtains a lock, the new row value is no longer 10 but 11, which no longer matches the criteria." (13.2.1)
- At Repeatable Read the second updater also waits first, and fails only if the first commits a change. "If the first updater rolls back, then its effects are negated and the repeatable read transaction can proceed with updating the originally found row." (13.2.2)
- Read Uncommitted maps to Read Committed because of MVCC. "This is because it is the only sensible way to map the standard isolation levels to PostgreSQL's multiversion concurrency control architecture." (13.2)
- Declare read-only transactions. "Declare transactions as READ ONLY when possible." (13.2.3)
- On retry, the transaction starts from the committed change. "The second time through, the transaction will see the previously-committed change as part of its initial view of the database, so there is no logical conflict in using the new version of the row as the starting point for the new transaction's update." (13.2.2)
- DEFERRABLE is the only Serializable blocking. "This is the only case where Serializable transactions block but Repeatable Read transactions don't." (13.2.3)
- More predicate lock memory means less promotion. "You can avoid this by increasing max_pred_locks_per_transaction, max_pred_locks_per_relation, and/or max_pred_locks_per_page." (13.2.3)
- Index scans help. "It may be helpful to encourage the use of index scans by reducing random_page_cost and/or increasing cpu_tuple_cost." (13.2.3)
- A waiting SELECT FOR UPDATE at Read Committed locks and returns the new version. "In the case of SELECT FOR UPDATE and SELECT FOR SHARE, this means it is the updated version of the row that is locked and returned to the client." (13.2.1)

## Visuals worth redrawing

- Table 13.1, levels against the four phenomena, with the "not in PG"
  cells.

## My notes

- The page doesn't name lost update or write skew. Lost update shows up
  only as the "could not serialize access due to concurrent update"
  error; write skew as the class/value example.
