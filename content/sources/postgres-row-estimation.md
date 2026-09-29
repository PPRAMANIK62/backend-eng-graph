---
id: postgres-row-estimation
title: "PostgreSQL documentation, 69.1 Row Estimation Examples"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/row-estimation-examples.html
kind: docs
primary: true
---

## Summary

Worked examples (read at version 18.6) of how the planner turns
statistics into a row estimate: histogram buckets for ranges, the
most-common-values list for equality, and the fallback for values that
aren't in it.

## Key claims

- Statistics come from random samples and drift between runs. "Note also that since ANALYZE uses random sampling while producing statistics, the results will change slightly after any new ANALYZE." (69.1)
- Per-column statistics include the null fraction, the distinct count, the MCVs and their frequencies. "SELECT null_frac, n_distinct, most_common_vals, most_common_freqs FROM pg_stats" (69.1)
- The test table is from the regression database. "The examples shown below use tables in the PostgreSQL regression test database." (69.1)
- Range condition: find the bucket, assume values are spread evenly inside it. "Assuming a linear distribution of values inside each bucket, we can calculate the selectivity as:" (69.1)
- The histogram has equal-frequency buckets. "The histogram divides the range into equal frequency buckets, so all we have to do is locate the bucket that our value is in and count part of it and all of the ones before." (69.1)
- Result for unique1 < 1000 on tenk1: 1007 rows. "= 1007 (rounding off)" (69.1)
- Equality uses the MCV list. "For equality estimation the histogram is not useful; instead the list of most common values (MCVs) is used to determine the selectivity." (69.1)
- A value in the MCV list: selectivity 0.003, 30 rows. "rows = 10000 * 0.003" (69.1)
- A value not in the list: the rest of the rows spread over the other distinct values. "This amounts to assuming that the fraction of the column that is not any of the MCVs is evenly distributed among all the other distinct values." (69.1)
- The histogram excludes the MCVs. "For a non-unique column, there will normally be both a histogram and an MCV list, and the histogram does not include the portion of the column population represented by the MCVs." (69.1)
- The unique1 histogram on tenk1 has ten buckets with these bounds: "{0,993,1997,3050,4040,5036,5957,7057,8029,9016,9995}" (69.1)
- 1000 falls in the second bucket; selectivity works out to 0.100697. "The value 1000 is clearly in the second bucket (993–1997)." (69.1)
- A value not in the MCV list, stringu1 = 'xxx', is estimated at 15 rows. "Seq Scan on tenk1 (cost=0.00..483.00 rows=15 width=244)" (69.1)

## Visuals worth redrawing

- The histogram bounds for unique1, `{0,993,1997,3050,4040,5036,5957,7057,8029,9016,9995}`, as ten equal-frequency buckets with the `< 1000` cut marked. (69.1)

## My notes

- The formulas are simplifications of what scalarltsel and eqsel do.
