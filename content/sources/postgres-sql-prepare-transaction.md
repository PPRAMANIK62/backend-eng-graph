---
id: postgres-sql-prepare-transaction
title: PREPARE TRANSACTION (PostgreSQL documentation)
author: PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/sql-prepare-transaction.html
kind: docs
primary: true
---

## Summary

The reference page for PREPARE TRANSACTION in PostgreSQL 18 (current
when read): the first phase of two-phase commit as a SQL command, what
a prepared transaction keeps holding, and why the feature is off unless
you run a transaction manager.

## Key claims

- After PREPARE the transaction lives on disk, detached from the session. "After this command, the transaction is no longer associated with the current session; instead, its state is fully stored on disk, and there is a very high probability that it can be committed successfully, even if a database crash occurs before the commit is requested." (Description)
- Any session can finish it later. "Once prepared, a transaction can later be committed or rolled back with COMMIT PREPARED or ROLLBACK PREPARED, respectively." (Description)
- A failed PREPARE becomes a rollback. "If the PREPARE TRANSACTION command fails for any reason, it becomes a ROLLBACK: the current transaction is canceled." (Description)
- The transaction id is a string under 200 bytes. "must be less than 200 bytes long." (Parameters)
- It's meant for transaction managers, not applications. "Unless you're writing a transaction manager, you probably shouldn't be using PREPARE TRANSACTION." (Notes)
- Leaving it prepared blocks VACUUM and can threaten wraparound. "It is unwise to leave transactions in the prepared state for a long time." (Notes, Caution)
- In extreme cases a forgotten prepared transaction can force a shutdown. "in extreme cases could cause the database to shut down to prevent transaction ID wraparound" (Notes, Caution)
- A prepared transaction keeps its locks. "Keep in mind also that the transaction continues to hold whatever locks it held." (Notes, Caution)
- Keep it disabled without a transaction manager. "it is best to keep the prepared-transaction feature disabled by setting max_prepared_transactions to zero." (Notes, Caution)
- Prepared transactions are listed in pg_prepared_xacts. "All currently available prepared transactions are listed in the pg_prepared_xacts system view." (Notes)
- It's a PostgreSQL extension used by XA-style managers. "It is intended for use by external transaction management systems, some of which are covered by standards (such as X/Open XA), but the SQL side of those systems is not standardized." (Compatibility)

## Visuals worth redrawing

None.

## My notes

- Pairs with postgres-two-phase, which says where prepared state is
  stored.
