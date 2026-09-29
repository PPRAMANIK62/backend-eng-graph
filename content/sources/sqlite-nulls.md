---
id: sqlite-nulls
title: NULL Handling in SQLite Versus Other Database Engines
author: D. Richard Hipp (SQLite)
url: https://www.sqlite.org/nulls.html
kind: docs
primary: true
---

## Summary

A page from the SQLite docs, by SQLite's author, recording how a test
script about NULL behaved on many SQL engines (SQLite, PostgreSQL,
Oracle, Informix, DB2, MS-SQL, MySQL, Firebird and others), run in 2002
and corrected in 2003. SQLite copied what the other engines did because
the standard wasn't clear.

## Key claims

- The SQL standard is ambiguous about NULLs. "But the descriptions in the SQL standards on how to handle NULLs seem ambiguous." (intro)
- SQLite was matched to other engines by experiment. "So SQLite was modified to work the same as Oracle, PostgreSQL, and DB2." (intro)
- NULLs count as equal for DISTINCT and UNION but as different in UNIQUE columns. "This involved making NULLs indistinct for the purposes of the SELECT DISTINCT statement and for the UNION operator in a SELECT. NULLs are still distinct in a UNIQUE column." (intro)
- Engines differ on UNIQUE. "The only significant difference is that Informix and MS-SQL both treat NULLs as indistinct in a UNIQUE column." (update note)
- The author finds the split puzzling. "It seems that NULLs should be either distinct everywhere or nowhere." (update note)
- Table rows: adding anything to null gives null and "null OR true" is true on every engine tested. (results table)
- The test script's comment on SQL's NULL rules. "I have about decided that SQL's treatment of NULLs is capricious and cannot be -- deduced by logic." (test script comment; the "--" is a comment marker in the original line break)
- The engines were tested by volunteers running a script, in 2002. "An SQL test script was developed and run by volunteers on various SQL RDBMSes and the results of those tests were used to deduce how each engine processed NULL values." (intro). The original tests ran in 2002. The results table has about a dozen engine columns.
- Behaviour converged over time toward the Postgres/Oracle model. "The original data showed a wide variety of behaviors, but over time the range of behaviors has converged toward the PostgreSQL/Oracle model." (update note)

## Visuals worth redrawing

- The results table (engine by behavior).

## My notes

- The engine versions in the table are old (MySQL 3.23 and 4.0). Behavior
  may have changed since; the article uses the page for the idea that
  NULL rules are inconsistent, not for current per-engine behavior.
