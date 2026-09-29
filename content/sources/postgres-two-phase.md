---
id: postgres-two-phase
title: Two-Phase Transactions (PostgreSQL documentation)
author: PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/two-phase.html
kind: docs
primary: true
---

## Summary

A short internals page (section 67.4 in PostgreSQL 18) on how
PostgreSQL supports two-phase commit and where prepared transactions
are kept.

## Key claims

- PostgreSQL supports 2PC through three commands. "The commands are PREPARE TRANSACTION, COMMIT PREPARED and ROLLBACK PREPARED." (67.4)
- It follows X/Open XA, partly. "PostgreSQL follows the features and model proposed by the X/Open XA standard, but does not implement some less often used aspects." (67.4)
- After PREPARE only two commands are possible. "When the user executes PREPARE TRANSACTION, the only possible next commands are COMMIT PREPARED or ROLLBACK PREPARED." (67.4)
- Prepared is meant to be short but can last. "In general, this prepared state is intended to be of very short duration, but external availability issues might mean transactions stay in this state for an extended interval." (67.4)
- Where it's stored. "Short-lived prepared transactions are stored only in shared memory and WAL. Transactions that span checkpoints are recorded in the pg_twophase directory." (67.4)

## Visuals worth redrawing

None.

## My notes

None.
