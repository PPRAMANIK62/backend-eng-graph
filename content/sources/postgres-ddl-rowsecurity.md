---
id: postgres-ddl-rowsecurity
title: "5.9. Row Security Policies (PostgreSQL 18 documentation)"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
kind: docs
primary: true
---

## Summary

The Postgres manual's chapter on row-level security (read at version
18): what enabling it does, who bypasses it, how policies combine, the
referential-integrity side channel, and a race condition when a policy
reads another table.

## Key claims

- Policies restrict rows per user, on top of GRANT. "tables can have row security policies that restrict, on a per-user basis, which rows can be returned by normal queries or inserted, updated, or deleted by data modification commands." (§5.9, first paragraph)
- Enabled with no policy means default deny. "If no policy exists for the table, a default-deny policy is used, meaning that no rows are visible or can be modified." (§5.9)
- TRUNCATE and REFERENCES aren't covered. "Operations that apply to the whole table, such as TRUNCATE and REFERENCES, are not subject to row security." (§5.9)
- The policy expression runs before the user's own conditions, except for leakproof functions. "This expression will be evaluated for each row prior to any conditions or functions coming from the user's query." (§5.9)
- Who bypasses it. "Superusers and roles with the BYPASSRLS attribute always bypass the row security system when accessing a table. Table owners normally bypass row security as well, though a table owner can choose to be subject to row security with ALTER TABLE ... FORCE ROW LEVEL SECURITY." (§5.9)
- Multiple policies: permissive ones OR together (the default), restrictive ones AND. (§5.9)
- A USING-only policy implicitly checks new rows too (WITH CHECK defaults to USING). (§5.9, account_managers example)
- Referential integrity checks bypass RLS, which can leak. "Referential integrity checks, such as unique or primary key constraints and foreign key references, always bypass row security to ensure that data integrity is maintained." (§5.9)
- Setting row_security to off doesn't bypass RLS; it raises an error if a query would be filtered, so a backup doesn't silently lose rows. "This does not in itself bypass row security; what it does is throw an error if any query's results would get filtered by a policy." (§5.9)
- Policies that only look at the current row are simplest and fastest. "This is the simplest and best-performing case; when possible, it's best to design row security applications to work this way." (§5.9)
- Policies with sub-SELECTs can race: under READ COMMITTED, a concurrent SELECT ... FOR UPDATE can see a row updated right after the user's privilege was lowered, because the sub-SELECT reads the old snapshot. "Be aware however that such accesses can create race conditions that could allow information leakage if care is not taken." (§5.9, mallory example)
- Fixes for that race: SELECT ... FOR SHARE in the sub-SELECT, an ACCESS EXCLUSIVE lock on the referenced table when updating it, or waiting for concurrent transactions to end. (§5.9)

## Visuals worth redrawing

None.

## My notes

- The mallory race is a small, local version of the new enemy problem:
  a permission change and a content change seen in the wrong order.
