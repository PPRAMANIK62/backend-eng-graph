---
id: postgres-planner-stats
title: "PostgreSQL documentation, 14.2 Statistics Used by the Planner"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/planner-stats.html
kind: docs
primary: true
---

## Summary

What Postgres (read at version 18.6) knows about a table when it plans a
query: row and page counts, per-column statistics (most common values,
histograms, distinct counts), and the optional extended statistics across
columns.

## Key claims

- The planner needs row count estimates. "the query planner needs to estimate the number of rows retrieved by a query in order to make good choices of query plans." (14.2.1)
- Table size lives in pg_class. "This information is kept in the table pg_class, in the columns reltuples and relpages." (14.2.1)
- They aren't live. "For efficiency reasons, reltuples and relpages are not updated on-the-fly, and so they usually contain somewhat out-of-date values." (14.2.1)
- Who updates them. "They are updated by VACUUM, ANALYZE, and a few DDL commands such as CREATE INDEX." (14.2.1)
- The planner scales them to the current table size. "the planner will scale the values it finds in pg_class to match the current physical table size, thus obtaining a closer approximation." (14.2.1)
- Selectivity is the fraction of rows a condition keeps. "The planner thus needs to make an estimate of the selectivity of WHERE clauses, that is, the fraction of rows that match each condition in the WHERE clause." (14.2.1)
- Column statistics come from ANALYZE and are approximate. "Entries in pg_statistic are updated by the ANALYZE and VACUUM ANALYZE commands, and are always approximate even when freshly updated." (14.2.1)
- The pg_stats view is the readable form. "Rather than look at pg_statistic directly, it's better to look at its view pg_stats when examining the statistics manually." (14.2.1)
- The statistics target sets the size of MCV lists and histograms, default 100. "The default limit is presently 100 entries." (14.2.1)
- The target can be set per column. "can be set on a column-by-column basis using the ALTER TABLE SET STATISTICS command, or globally by setting the default_statistics_target configuration variable." (14.2.1)
- A higher target costs ANALYZE time and space. "at the price of consuming more space in pg_statistic and slightly more time to compute the estimates." (14.2.1)
- A higher target means a bigger sample. "Since the sample size is increased by increasing the statistics target for the table or any of its columns" (14.2.2)
- Too many combinations to collect automatically. "Because the number of possible column combinations is very large, it's impractical to compute multivariate statistics automatically." (14.2.2)
- The real frequency of the top (city, state) pair. "This indicates that the most common combination of city and state is Washington in DC, with actual frequency (in the sample) about 0.35%." (14.2.2.3)
- Correlated columns fool the planner. "It is common to see slow queries running bad execution plans because multiple columns used in the query clauses are correlated." (14.2.2)
- It assumes independence. "The planner normally assumes that multiple conditions are independent of each other, an assumption that does not hold when column values are correlated." (14.2.2)
- Extended statistics must be asked for. "Statistics objects are created using the CREATE STATISTICS command." (14.2.2)
- Without the dependency the planner underestimates. "without knowledge of the functional dependency, the query planner will assume that the conditions are independent, resulting in underestimating the result size." (14.2.2.1)
- Zip and city example. "CREATE STATISTICS stts (dependencies) ON city, zip FROM zipcodes;" (14.2.2.1)
- Multi-column MCV example: two orders of magnitude off without it. "The base frequency of the combination (as computed from the simple per-column frequencies) is only 0.0027%, resulting in two orders of magnitude under-estimates." (14.2.2.3)

## Visuals worth redrawing

None.

## My notes

- Three kinds of extended statistics: dependencies, ndistinct, mcv.
