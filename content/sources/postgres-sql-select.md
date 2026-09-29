---
id: postgres-sql-select
title: "PostgreSQL documentation, SELECT"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/sql-select.html
kind: docs
primary: true
---

## Summary

The SELECT reference page (read at version 18; 19 was in beta). Gives the
order in which the parts of a SELECT are processed, then each clause in
detail (including the locking clause: FOR UPDATE, FOR NO KEY UPDATE, FOR
SHARE, FOR KEY SHARE, and the NOWAIT and SKIP LOCKED options), then how
Postgres differs from the SQL standard.

## Key claims

- The four locking clauses. "FOR UPDATE, FOR NO KEY UPDATE, FOR SHARE and FOR KEY SHARE are locking clauses; they affect how SELECT locks rows as they are obtained from the table." (The Locking Clause)
- NOWAIT errors instead of waiting. "With NOWAIT, the statement reports an error, rather than waiting, if a selected row cannot be locked immediately." (The Locking Clause)
- SKIP LOCKED skips. "With SKIP LOCKED, any selected rows that cannot be immediately locked are skipped." (The Locking Clause)
- SKIP LOCKED is for queues, not general work. "Skipping locked rows provides an inconsistent view of the data, so this is not suitable for general purpose work, but can be used to avoid lock contention with multiple consumers accessing a queue-like table." (The Locking Clause)
- NOWAIT and SKIP LOCKED apply to the row locks only; the ROW SHARE table lock is still taken normally. "Note that NOWAIT and SKIP LOCKED apply only to the row-level lock(s) — the required ROW SHARE table-level lock is still taken in the ordinary way (see Chapter 13)." (The Locking Clause)
- Only returned rows are locked, and LIMIT stops locking. "If a LIMIT is used, locking stops once enough rows have been returned to satisfy the limit (but note that rows skipped over by OFFSET will get locked)." (The Locking Clause)
- Not with aggregates. "for example they cannot be used with aggregation." (The Locking Clause)
- At Read Committed, ORDER BY with FOR UPDATE can return rows out of order, because sorting happens before locking. "It is possible for a SELECT command running at the READ COMMITTED transaction isolation level and using ORDER BY and a locking clause to return rows out of order." (The Locking Clause, Caution)
- At Repeatable Read or Serializable the same situation is a serialization failure instead. "At the REPEATABLE READ or SERIALIZABLE transaction isolation level this would cause a serialization failure (with an SQLSTATE of '40001'), so there is no possibility of receiving rows out of order under these isolation levels." (The Locking Clause, Caution)
- A locked row makes other lockers wait for the holder to commit (or roll back). "To prevent the operation from waiting for other transactions to commit, use either the NOWAIT or SKIP LOCKED option." (The Locking Clause)
- The general processing order: WITH, FROM, WHERE, GROUP BY and HAVING, the output list, DISTINCT, UNION/INTERSECT/EXCEPT, ORDER BY, LIMIT, then row locks. "SELECT retrieves rows from zero or more tables. The general processing of SELECT is as follows:" (Description, steps 1 to 10)
- Several FROM items are cross-joined. "If more than one element is specified in the FROM list, they are cross-joined together." (Description, step 2)
- Without ORDER BY, rows come back in whatever order is fastest. "If ORDER BY is not given, the rows are returned in whatever order the system finds fastest to produce." (Description, step 8)
- An output column alias can be used in ORDER BY and GROUP BY but not in WHERE or HAVING. "An output column's name can be used to refer to the column's value in ORDER BY and GROUP BY clauses, but not in the WHERE or HAVING clauses; there you must write out the expression instead." (SELECT List)
- Postgres evaluates output expressions after sorting and limiting when it can, though the standard says before. "PostgreSQL will effectively evaluate output expressions after sorting and limiting, so long as those expressions are not referenced in DISTINCT, ORDER BY or GROUP BY." (SELECT List)
- NULLs sort as if larger than every value by default. "(thus, the default is to act as though nulls are larger than non-nulls)" (ORDER BY Clause)
- LIMIT without ORDER BY returns an unpredictable subset. "Otherwise you will get an unpredictable subset of the query's rows" (LIMIT Clause)
- That's by design: SQL promises no order without ORDER BY. "This is not a bug; it is an inherent consequence of the fact that SQL does not promise to deliver the results of a query in any particular order unless ORDER BY is used to constrain the order." (LIMIT Clause)
- LIMIT and OFFSET are nonstandard; the standard form arrived in SQL:2008. "The SQL:2008 standard has introduced the clauses OFFSET ... FETCH {FIRST|NEXT} ... for the same functionality, as shown above in LIMIT Clause." (Compatibility)
- LEFT OUTER JOIN definition: all matching pairs plus one null-extended row per unmatched left row. "This left-hand row is extended to the full width of the joined table by inserting null values for the right-hand columns." (FROM Clause, join_type)
- UNION, INTERSECT and EXCEPT remove duplicates unless ALL is given, the opposite of SELECT. "Notice that DISTINCT is the default behavior here, even though ALL is the default for SELECT itself." (Description, step 7)
- WHERE keeps a row only when the condition returns true. "A row satisfies the condition if it returns true when the actual row values are substituted for any variable references." (WHERE Clause)
- LIMIT changes the plan, and so the row order. "The query planner takes LIMIT into account when generating a query plan, so you are very likely to get different plans (yielding different row orders) depending on what you use for LIMIT and OFFSET." (LIMIT Clause)
- LIMIT/OFFSET are Postgres syntax, also used by MySQL. "The clauses LIMIT and OFFSET are PostgreSQL-specific syntax, also used by MySQL." (Compatibility, LIMIT and OFFSET)

## Visuals worth redrawing

- The ten-step processing order as a pipeline.

## My notes

- The processing order is logical; the planner may run things in a
  different physical order as long as the result is the same.
