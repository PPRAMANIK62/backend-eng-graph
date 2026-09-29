---
id: postgres-tutorial-transactions
title: "PostgreSQL documentation, 3.4 Transactions (tutorial)"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/tutorial-transactions.html
kind: docs
primary: true
---

## Summary

The tutorial's introduction to transactions (read at version 18). A
bank transfer as the running example: all-or-nothing, durable once
reported complete, invisible to others until commit. Then BEGIN,
COMMIT, ROLLBACK, the implicit transaction around every statement, and
savepoints.

## Key claims

- A transaction bundles several steps into one all-or-nothing operation. "it bundles multiple steps into a single, all-or-nothing operation." (3.4, first paragraph)
- Other transactions don't see the steps in between. "The intermediate states between the steps are not visible to other concurrent transactions" (3.4, first paragraph)
- If something fails partway, none of the steps count. "if some failure occurs that prevents the transaction from completing, then none of the steps affect the database at all." (3.4, first paragraph)
- Once reported complete, the updates are on disk. "A transactional database guarantees that all the updates made by a transaction are logged in permanent storage (i.e., on disk) before the transaction is reported complete." (3.4)
- All of a transaction's updates become visible at the same moment, at commit. "The updates made so far by an open transaction are invisible to other transactions until the transaction completes, whereupon all the updates become visible simultaneously." (3.4)
- In Postgres you wrap the statements in BEGIN and COMMIT; ROLLBACK cancels. "we can issue the command ROLLBACK instead of COMMIT, and all our updates so far will be canceled." (3.4)
- Without BEGIN, every statement is its own transaction. "If you do not issue a BEGIN command, then each individual statement has an implicit BEGIN and (if successful) COMMIT wrapped around it." (3.4)
- Some client libraries send BEGIN and COMMIT for you. "Some client libraries issue BEGIN and COMMIT commands automatically, so that you might get the effect of transaction blocks without asking." (3.4, Note)
- Savepoints let you undo part of a transaction. "Savepoints allow you to selectively discard parts of the transaction, while committing the rest." (3.4)
- Releasing or rolling back to a savepoint also releases the savepoints defined after it. "either releasing or rolling back to a savepoint will automatically release all savepoints that were defined after it." (3.4)
- After an error the transaction block is in an aborted state; only ROLLBACK TO a savepoint or a full rollback gets you out. "ROLLBACK TO is the only way to regain control of a transaction block that was put in aborted state by the system due to an error, short of rolling it back completely and starting again." (3.4, last paragraph)
- A savepoint stays defined after you roll back to it. "After rolling back to a savepoint, it continues to be defined, so you can roll back to it several times." (3.4)

## Visuals worth redrawing

None. The bank transfer example (debit Alice, credit Bob, adjust both
branches) is worth reusing as the running example.

## My notes

- The tutorial doesn't name the error you get in an aborted block; it
  only says the block is "in aborted state".
