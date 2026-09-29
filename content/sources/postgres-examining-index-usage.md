---
id: postgres-examining-index-usage
title: "PostgreSQL documentation, 11.12 Examining Index Usage"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/indexes-examine.html
kind: docs
primary: true
---

## Summary

The manual's advice (read at version 18.6) on finding out whether the
planner uses your indexes and why not: analyze first, test on real data
at real size, force plans only to diagnose.

## Key claims

- Always analyze first; without statistics the defaults are wrong. "In absence of any real statistics, some default values are assumed, which are almost certain to be inaccurate." (11.12)
- Test data only tells you about test data. "Using test data for setting up indexes will tell you what indexes you need for the test data, but that is all." (11.12)
- Tiny tables fit in one page, where no index helps. "While selecting 1000 out of 100000 rows could be a candidate for an index, selecting 1 out of 100 rows will hardly be, because the 100 rows probably fit within a single disk page, and there is no plan that can beat sequentially fetching 1 disk page." (11.12)
- Made-up data skews statistics. "Values that are very similar, completely random, or inserted in sorted order will skew the statistics away from the distribution that real data would have." (11.12)
- Turning plan types off is a diagnostic. "If the system still chooses a sequential scan or nested-loop join then there is probably a more fundamental reason why the index is not being used; for example, the query condition does not match the index." (11.12)
- Total cost is per-row cost times selectivity; bad selectivity means bad statistics. "An inaccurate selectivity estimate is due to insufficient statistics." (11.12)

## Visuals worth redrawing

None.

## My notes

- Overall index usage per server is in the cumulative statistics views (section 27.2), not opened.
