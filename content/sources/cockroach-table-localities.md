---
id: cockroach-table-localities
title: Table Localities (CockroachDB docs)
author: Cockroach Labs
url: https://www.cockroachlabs.com/docs/stable/table-localities
kind: docs
primary: true
---

## Summary

CockroachDB docs (stable, v26.3 when read) on choosing where each
table's or row's data lives in a multi-region database: regional
tables homed in one region, regional-by-row tables where each row has
its own home region, and global tables that read fast everywhere but
write slowly.

## Key claims

- A home region is where the leaseholder and voting replicas sit. "A table or row's home region is where the of its ranges is placed, along with a number of voting replicas determined by the applicable ." (intro; the link text, "leaseholder" and "survival goal", was dropped by the text extraction)
- Regional tables: fast in one region, slower elsewhere. "In a regional table, access to the table will be fast in the table's home region and slower in other regions." (Regional tables)
- Regional by row: each row has its own home. "In a regional by row table, each row is optimized for access from a specific home region." (Regional by row tables)
- Typical use: users next to their region. "A typical REGIONAL BY ROW use case is the users table in the , where user data can be co-located with the user's region for better performance." (Regional by row tables)
- Global tables: fast reads everywhere, slow writes. "The tradeoff is that writes will incur higher latencies from any given region, since writes have to be replicated across every region to make the global low-latency reads possible." (Global tables)
- Use global for read-mostly reference data. "Use global tables when your application has a "read-mostly" table of reference data that is rarely updated, and needs to be available to all regions." (Global tables)
- Default: everything homed in the primary region. "By default, all tables in a multi-region database are regional tables that use the database's primary region." (Regional tables)

## Visuals worth redrawing

None.

## My notes

- The multiregion overview page was also opened: survival goals are
  zone (default) or region, and super regions keep data inside a set of
  regions for data domiciling. Not cited.
