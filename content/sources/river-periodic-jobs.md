---
id: river-periodic-jobs
title: Periodic and cron jobs (River docs)
author: River (Brandur Leach, Blake Gentry)
url: https://riverqueue.com/docs/periodic-jobs
kind: docs
primary: true
---

## Summary

River's docs page on periodic jobs. The cluster's elected leader holds
the schedule in memory and inserts the jobs, so a leader change can
skip a run. Pairing periodic jobs with unique jobs and RunOnStart
closes most of that gap. A paid tier stores run times in the database.

## Key claims

- Only the elected leader inserts periodic jobs, from an in-memory schedule. "Periodic job insertion is performed by the cluster's leader , which holds the schedule in memory." (intro)
- The schedule resets across restarts or elections. "This makes periodic jobs prone to some caveats as the schedule resets across restarts or elections." (intro)
- No shared state about the next run time. "Periodic jobs are stateless, meaning there is no coordinated or persisted state between workers as far as when the next jobs will run." (Details and caveats)
- So a run can be skipped around a leader change. "With this architecture, there is a possibility that periodic jobs will sometimes be skipped." (Details and caveats)
- Unique jobs plus RunOnStart avoid the skip without duplicates. "a job which is configured to be unique at the hourly level will only enqueue once in that hour no matter how many times it's attempted." (Details and caveats)
- RunOnStart inserts the job when a new leader is elected. "This option causes the job to be inserted immediately anytime a new leader is elected." (Basic usage)
- Durable periodic jobs, whose run times are stored in the database, are a River Pro feature (added in River Pro v0.15). (intro)
- Cron examples: "*/15 * * * *" is every 15th minute of every hour. (Complex cron schedules)

## Visuals worth redrawing

None.

## My notes

- The opposite design from Solid Queue's unique (task_key, run_at)
  index: one leader instead of many schedulers racing.
