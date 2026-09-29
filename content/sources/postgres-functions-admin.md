---
id: postgres-functions-admin
title: "PostgreSQL documentation, 9.28 System Administration Functions (advisory lock functions)"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/functions-admin.html
kind: docs
primary: true
---

## Summary

The admin functions page (read at version 18). Used here for 9.28.10,
the advisory lock functions: session and transaction level, shared and
exclusive, blocking and try versions, and the key format.

## Key claims

- Keys are one 64-bit number or two 32-bit numbers, in separate spaces. "which can be identified either by a single 64-bit key value or two 32-bit key values (note that these two key spaces do not overlap)." (9.28.10)
- Shared and exclusive. "Locks can be either shared or exclusive: a shared lock does not conflict with other shared locks on the same resource, only with exclusive locks." (9.28.10)
- Two lifetimes. "Locks can be taken at session level (so that they are held until released or the session ends) or at transaction level (so that they are held until the current transaction ends; there is no provision for manual release)." (9.28.10)
- Session locks stack. "Multiple session-level lock requests stack, so that if the same resource identifier is locked three times there must then be three unlock requests to release the resource in advance of session end." (9.28.10)
- pg_advisory_lock waits. "Obtains an exclusive session-level advisory lock, waiting if necessary." (Table 9.109, pg_advisory_lock)
- The try versions don't wait. "This will either obtain the lock immediately and return true, or return false without waiting if the lock cannot be acquired immediately." (Table 9.109, pg_try_advisory_lock)
- Unlocking a lock you don't hold returns false and warns. "If the lock was not held, false is returned, and in addition, an SQL warning will be reported by the server." (Table 9.109, pg_advisory_unlock)
- Session end releases everything, even on a dropped connection. "(This function is implicitly invoked at session end, even if the client disconnects ungracefully.)" (Table 9.109, pg_advisory_unlock_all)
- Transaction-level versions: pg_advisory_xact_lock and pg_try_advisory_xact_lock. "Obtains an exclusive transaction-level advisory lock, waiting if necessary." (Table 9.109, pg_advisory_xact_lock)

## Visuals worth redrawing

None.

## My notes

- Nothing here about hashing strings into keys; people use hashtext()
  or their own hash, which isn't documented on this page.
