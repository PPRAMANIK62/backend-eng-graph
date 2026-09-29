---
id: backfills
title: Backfills
depth: short
phase: 16
note: >-
  Recomputing history after a bug or a new column.
needs: [batch-processing, idempotency]
leads_to: []
compare_with: [etl-vs-elt, lambda-vs-kappa, job-scheduling]
---

# Backfills

A backfill reruns a data pipeline over past data. You do it when a bug
wrote wrong results for the last few weeks, when you add a column or a
table and want it filled for all of history, or when a job simply
didn't run for a while. It's only safe if each run of the job is tied
to a fixed slice of input and gives the same result every time it
runs.

## Pipelines run in intervals

Most scheduled pipelines are [[batch-processing|batch jobs]] that run
once per time slice. In Airflow (3.3.2 here), each run of a pipeline
has a **data interval**: for a daily job, one day from midnight to
midnight. The run starts after its interval ends, so all of that day's
data is there. The run for day 4 processes day 4's data, whether it
runs on day 5 or three months later.

That's what makes a backfill a plain operation. It's the same job, run
for a range of old intervals:

```
airflow backfill create --dag-id DAG_ID \
    --from-date START --to-date END \
    --reprocess-behavior failed \
    --max-active-runs 3
```

This creates one run per interval in the range. You choose what to do
about intervals that already ran (rerun only the failed ones, say), how
many runs may go at once, and whether to go newest first.

Two neighbours of the backfill:

- **Catchup** is Airflow creating a run for every interval that
  hasn't run yet (or was cleared). It's off by default, so a newly
  switched-on pipeline runs only for the latest interval.
- **Clearing** a task reruns it for a given interval, and can take its
  upstream or downstream tasks, or its past and future runs, with it.

## What makes a job safe to backfill

A backfill is just many reruns, so a job that can't be rerun can't be
backfilled. Treat each task like a database [[transaction]]: it either produces
its whole output or none of it, and running it again gives the same
outcome. In practice that means
three rules.

**Read a fixed slice, never "the latest".** The job for day 4 must read
day 4's input partition, named by the run's interval, not whatever the
newest data happens to be. Otherwise a rerun next month reads next
month's data.

**Don't let the clock into the logic.** Calling `now()` to decide what
to compute gives a different answer every run. Use the run's interval
instead.

**Replace, don't append.** If the job inserts rows, a rerun inserts them
again and you get duplicates. Overwrite the output partition for that
interval, or upsert by key, so that running twice leaves the same
result as running once. That's [[idempotency]] applied to a whole
partition.

![Two rows of ten daily output partitions. In the first, days 4 to 7 are marked wrong: a bug shipped before day 4 and was fixed on day 8. In the second, a backfill has rerun the fixed job for days 4 to 7, each run reading only its own day's input and overwriting its own day's partition, so those four partitions are now correct.](img/backfills-rerun-partitions.svg)

*A backfill after a bug: rerun the affected intervals and overwrite their partitions.*

With those rules, a backfill after a bug is simple: fix the code, then
rerun the intervals the bug touched. Each run replaces its own
partition, and it doesn't matter if a run fails halfway and runs again.
Writing each partition as one atomic step, for example a single commit
to an [[open-table-formats|open table format]], also keeps readers from
seeing a half-rewritten day.

## Where it gets tricky

**Catchup on a job that reads "now" does damage.** If a job ignores its
interval and reads the latest data, turning on catchup doesn't
recompute history. It runs the same latest data once per missed
interval, and writes it under old dates. Leave catchup off for jobs
like that.

**Downstream tables go stale.** When you rewrite day 4 of one table,
every table computed from it still holds the old day 4. Rerun the
downstream tasks for the same intervals too; clearing with
"downstream" does that.

**A big backfill is a lot of load at once.** A year of daily runs is
365 jobs. Cap how many run at the same time, so the backfill doesn't
starve the normal pipeline or the systems it reads from.

**You can only recompute what you kept.** A backfill rereads old input.
If the raw input for those days has been deleted, or was overwritten
in place, there's nothing to rerun against.

## What this means when you build

- Partition inputs and outputs by time, and have each run touch only
  its own interval.
- Make every run idempotent: overwrite or upsert, never plain insert.
- Keep raw input long enough to recompute from it.
- When you backfill, rerun downstream jobs for the same intervals, and
  limit how many runs go at once.

## Further reading

- [Dag Runs](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dag-run.html), Apache Airflow 3.3.2 docs. Data intervals, catchup, the backfill command and clearing tasks.
- [Best Practices](https://airflow.apache.org/docs/apache-airflow/stable/best-practices.html), Apache Airflow 3.3.2 docs. The "Creating a task" rules for jobs that give the same result on every rerun.
