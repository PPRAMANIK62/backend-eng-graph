---
id: airflow-best-practices
title: Best Practices (Apache Airflow 3.3.2 documentation)
author: Apache Airflow project
url: https://airflow.apache.org/docs/apache-airflow/stable/best-practices.html
kind: docs
primary: true
---

## Summary

Airflow's best-practices page. The "Creating a task" part is the one
that matters for backfills: tasks should behave like transactions and
give the same result on every re-run.

## Key claims

- Treat a task like a database transaction; no partial output. "You should treat tasks in Airflow equivalent to transactions in a database." (Creating a task)
- Re-runs must give the same outcome. "Thus, the tasks should produce the same outcome on every re-run." (Creating a task)
- Use UPSERT, not INSERT, so a re-run doesn't duplicate rows. "Do not use INSERT during a task re-run, an INSERT statement might lead to duplicate rows in your database." (Creating a task)
- Read a specific partition, never "the latest". "Never read the latest available data in a task." (Creating a task)
- Don't use now() for the computation. "This function should never be used inside a task, especially to do the critical computation, as it leads to different outcomes on each run." (Creating a task)
- Read and write a specific partition, named by the run's interval, in object stores too. "A better way is to read the input data from a specific partition. You can use data_interval_start as a partition. You should follow this partitioning method while writing data in S3/HDFS as well." (Creating a task)
- No incomplete output at the end of a task. "This implies that you should never produce incomplete results from your tasks." (Creating a task)

## Visuals worth redrawing

None.

## My notes

- Airflow's own backfill docs (airflow-dag-runs) rely on this: a
  backfill is just many re-runs over old intervals.
