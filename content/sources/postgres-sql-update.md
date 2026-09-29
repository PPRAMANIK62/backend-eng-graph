---
id: postgres-sql-update
title: "PostgreSQL documentation, UPDATE"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/sql-update.html
kind: docs
primary: true
---

## Summary

The UPDATE reference page (read at version 18). Used here only for what
UPDATE reports back: the count of updated rows.

## Key claims

- UPDATE returns a count. "On successful completion, an UPDATE command returns a command tag of the form" UPDATE count. (Outputs)
- Zero rows isn't an error. "If count is 0, no rows were updated by the query (this is not considered an error)." (Outputs)
- RETURNING gives the updated rows back like a SELECT. "If the UPDATE command contains a RETURNING clause, the result will be similar to that of a SELECT statement containing the columns and values defined in the RETURNING list, computed over the row(s) updated by the command." (Outputs)

## Visuals worth redrawing

None.

## My notes

None.
