---
id: airflow-dag-runs
title: Dag Runs (Apache Airflow 3.3.2 documentation)
author: Apache Airflow project
url: https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dag-run.html
kind: docs
primary: true
---

## Summary

How Airflow 3.3.2 turns a schedule into runs, each tied to a "data
interval"; catchup (runs for missed intervals); backfill (runs for a
chosen historical range); and clearing tasks to re-run them.

## Key claims

- Each run covers a data interval. "Each Dag run in Airflow has an assigned “data interval” that represents the time range it operates in." (Data Interval)
- A run starts after its interval ends, so all its data is there. "A Dag run is usually scheduled after its associated data interval has ended, to ensure the run is able to collect all the data within the time period." (Data Interval)
- Catchup is off by default. "The scheduler creates a Dag run only for the latest interval." (Catchup)
- Catchup only works if the DAG is limited to its interval. "If your Dag is not written to handle its catchup (i.e., not limited to the interval, but instead to Now for instance.), then you will want to turn catchup off" (Catchup)
- Backfill runs a DAG over a historical range. "The backfill command will re-run all the instances of the dag_id for all the intervals within the start date and end date." (Backfill)
- The backfill CLI takes a reprocess behaviour, a cap on active runs, and can run backwards. "--max-active-runs 3" (Backfill, CLI example)
- Failed tasks can be cleared and re-run, optionally with past, future, upstream or downstream tasks. "Once you have fixed the errors after going through the logs, you can re-run the tasks by clearing them for the scheduled date." (Re-run Tasks)
- A daily interval runs midnight to midnight. "each of its data interval would start each day at midnight (00:00) and end at midnight (24:00)." (Data Interval)
- With catchup on, the scheduler starts a run for every interval not yet run, or cleared. "the scheduler will kick off a Dag Run for any data interval that has not been run since the last data interval (or has been cleared)." (Catchup)
- The backfill form and CLI set a date range, reprocess behaviour, max active runs and optional backwards order. "Set the date range, reprocess behavior, max active runs, optional backwards ordering, and Advanced Config." (Backfill, UI)

## Visuals worth redrawing

None.

## My notes

- The page's examples use calendar dates; don't copy them.
