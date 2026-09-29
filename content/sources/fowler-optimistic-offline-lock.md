---
id: fowler-optimistic-offline-lock
title: Optimistic Offline Lock
author: David Rice (in Martin Fowler's Patterns of Enterprise Application Architecture catalog)
url: https://martinfowler.com/eaaCatalog/optimisticOfflineLock.html
kind: book
primary: false
---

## Summary

The catalog summary of the Optimistic Offline Lock pattern from
Patterns of Enterprise Application Architecture (the catalog page is
dated 2003). A "business
transaction" (a user editing a record over several requests) spans many
database transactions, so the database's own locks can't protect it; a
version check at save time does.

## Key claims

- The problem: one user action spans many database transactions. "Often a business transaction executes across a series of system transactions." (summary)
- Lost updates follow. "Data integrity is at risk once two sessions begin to work on the same records and lost updates are quite possible." (summary)
- The fix is validation before commit. "Optimistic Offline Lock solves this problem by validating that the changes about to be committed by one session don't conflict with the changes of another session." (summary)
- The check and the write must be in one database transaction. "So long as the validation and the updates occur within a single system transaction the business transaction will display consistency." (summary)
- Pessimistic vs optimistic is a bet on conflict odds. "Whereas Pessimistic Offline Lock assumes that the chance of session conflict is high and therefore limits the system's concurrency, Optimistic Offline Lock assumes that the chance of conflict is low." (summary)

## Visuals worth redrawing

None.

## My notes

- Only the online summary was read, not chapter 16 of the book.
