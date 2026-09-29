---
id: postgres-mvcc-serialization-failure-handling
title: "PostgreSQL documentation, 13.5 Serialization Failure Handling"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/mvcc-serialization-failure-handling.html
kind: docs
primary: true
---

## Summary

A short page in the Postgres manual (read at version 18) on which errors
an application should retry at Repeatable Read and Serializable, and how.

## Key claims

- Every serialization failure has SQLSTATE 40001. "Such an error's message text will vary according to the precise circumstances, but it will always have the SQLSTATE code 40001 (serialization_failure)." (13.5)
- Deadlocks (40P01) may be worth retrying too. "It may also be advisable to retry deadlock failures. These have the SQLSTATE code 40P01 (deadlock_detected)." (13.5)
- A unique violation after check-then-insert is really a serialization failure the server can't see. "This is effectively a serialization failure, but the server will not detect it as such because it cannot “see” the connection between the inserted value and the previous reads." (13.5)
- Retry the whole transaction, including the logic. "It is important to retry the complete transaction, including all logic that decides which SQL to issue and/or which values to use." (13.5)
- Postgres has no automatic retry. "Therefore, PostgreSQL does not offer an automatic retry facility, since it cannot do so with any guarantee of correctness." (13.5)
- Retries can fail again under high contention. "In cases with very high contention, it is possible that completion of a transaction may take many attempts." (13.5)
- Unique-key failures have SQLSTATE 23505 and are sometimes worth retrying, with care, since they can be permanent. "In some cases it is also appropriate to retry unique-key failures, which have SQLSTATE code 23505 (unique_violation)" and "more care is needed when retrying these other error codes, since they might represent persistent error conditions rather than transient failures." (13.5)

## Visuals worth redrawing

None.

## My notes

None.
