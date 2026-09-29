---
id: postgres-wiki-ssi
title: SSI (PostgreSQL wiki)
author: PostgreSQL wiki contributors (Kevin Grittner and others)
url: https://wiki.postgresql.org/wiki/SSI
kind: docs
primary: true
---

## Summary

A PostgreSQL wiki page, written for application developers, that walks
through anomalies Repeatable Read (snapshot isolation) lets through and
Serializable (SSI, since 9.1) stops: simple write skew (black and white
rows, overdraft protection), a three-transaction cycle, business rules in
triggers, and read-only anomalies. Each example is a two-session script.

## Key claims

- The page contrasts SSI with plain SI, which are Postgres's SERIALIZABLE and REPEATABLE READ since 9.1. "These correspond to the SERIALIZABLE and REPEATABLE READ transaction isolation levels, respectively, in PostgreSQL beginning with version 9.1." (intro)
- The promise of serializable. "With true serializable transactions, if you can show that your transaction will do the right thing if there are no concurrent transactions, it will do the right thing in any mix of serializable transactions or be rolled back with an error." (Overview)
- Write skew, defined. "When two concurrent transactions each determine what they are writing based on reading a data set which overlaps what the other is writing, you can get a state which could not occur if either had run before the other." (2.1 Simple Write Skew)
- Under SSI, the first committer wins. "When there is write skew in SSI, both transactions proceed until one transaction commits. The first committer wins and the other transaction is rolled back." (2.1)
- Black and white: one session turns white rows black, the other black rows white; at Repeatable Read the colours swap. "If they are run concurrently in REPEATABLE READ mode, the values will be switched, which is not consistent with any serial order of runs." (2.1.1)
- Overdraft: a bank allows withdrawals up to the total across accounts; two $900 withdrawals from two $500 accounts run at once. "Someone's trying to get clever and trick the bank by submitting $900 withdrawals to two accounts with $500 balances simultaneously. At the REPEATABLE READ transaction isolation level, that could work" (2.1.3)
- The error the loser gets, with the hint. "ERROR: could not serialize access due to read/write dependencies among transactions DETAIL: Cancelled on identification as a pivot, during commit attempt. HINT: The transaction might succeed if retried." (2.1.3)
- On retry the loser sees the new balances, and the app rejects the request. "We see they have a net of $100. This request for $900 will be rejected by the application." (2.1.3)
- Declarative constraints beat triggers when they fit. "Where a declarative constraint works, it will generally be faster, easier to implement and maintain, and less prone to bugs -- so triggers should only be used this way where a declarative constraint won't work." (2.3)
- A trigger-enforced rule (unique on the first six characters): two concurrent inserts each pass the check because neither sees the other's row. "This works for the moment, because the work of the other transaction is not visible to this transaction, but both transactions may not commit without violating the business rule." (2.3.1)

- Read-only transactions can see a state no serial order produces at Repeatable Read. "While a Read Only transaction cannot contribute to an anomaly which persists in the database, under Repeatable Read transaction isolation it can see a state which is not consistent with any serial (one-at-a-time) execution of transactions." (2.4)

## Visuals worth redrawing

- The two-column session scripts (session 1, session 2) are the natural
  layout for a write-skew timeline.

## My notes

- The overdraft example is the same shape as Berenson's H5.
