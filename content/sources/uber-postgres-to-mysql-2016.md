---
id: uber-postgres-to-mysql-2016
title: "Why Uber Engineering Switched from Postgres to MySQL"
author: Evan Klitzke
url: https://www.uber.com/blog/postgres-to-mysql-migration/
kind: blog
primary: false
---

## Summary

Uber's account (2016) of why it moved from Postgres 9.2 to MySQL. Used
here for its explanation of write amplification: in Postgres an update
that makes a new row version must add an entry to every index on the
table. The live page refused curl ("Not Acceptable"); read via the
Internet Archive copy of the same URL.

## Key claims

- Based on Postgres 9.2. "Note that the analysis that we present here is primarily based on our experience with the somewhat old Postgres 9.2 release series." (introduction)
- One logical update, many physical writes. "In our previous example when we made the small logical update to the birth year for al-Khwārizmī, we had to issue at least four physical updates:" (Write Amplification)
- Unchanged indexes are written too. "However, these indexes still must be updated with the creation of a new row tuple in the database for the row record." (Write Amplification)
- A dozen indexes, a dozen writes. "For instance, if we have a table with a dozen indexes defined on it, an update to a field that is only covered by a single index must be propagated into all 12 indexes to reflect the" (Write Amplification)
- Each write also goes to the WAL and to replicas. "Thus, the write amplification problem also translates into a replication amplification problem" (Replication)
- Each of those writes is also written to the WAL. "each of these writes needs to be reflected in the WAL as well, so the total number of writes on disk is even larger." (Write Amplification)

## Visuals worth redrawing

None.

## My notes

- The post doesn't mention HOT. In its example the updated column
  (birth_year) is indexed, so HOT wouldn't apply anyway (see postgres-hot).
