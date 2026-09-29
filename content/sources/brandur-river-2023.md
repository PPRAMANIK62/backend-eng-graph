---
id: brandur-river-2023
title: "River: a Fast, Robust Job Queue for Go + Postgres"
author: Brandur Leach
url: https://brandur.org/river
kind: blog
primary: true
---

## Summary

The announcement of River (2023), a Postgres job queue for Go, by one
of its two authors. He revisits his 2015 post on Postgres queue
trouble and argues that transactional enqueueing is worth it, lists
the failure modes of putting jobs in Redis next to a Postgres
transaction, and names the Postgres changes since 9.4 that help
queues.

## Key claims

- He sees transactions plus background jobs as avoiding a whole class of distributed problems. "When used well, transactions and background jobs are a match made in heaven and completely sidestep a whole host of distributed systems problems" (intro)
- Failure 1: a job sent to Redis inside a transaction runs before the commit and can't see its data. "the transaction that emitted it isn’t yet committed, so none of the data it needs is available." (intro list)
- Failure 2: the transaction rolls back, and the job fails on every retry until it reaches the dead letter queue. "The job fails and will also fail every subsequent retry, pointlessly eating resources despite never being able to succeed" (intro list)
- Failure 3: enqueue after commit, and a crash in between loses the job. "there’s a brief moment between the commit and job emit where if the process crashes or there’s a bug, the job is gone" (intro list)
- Postgres NOTIFY respects transactions, so a worker can be woken the moment a job commits. "Postgres’ NOTIFY respects transactions, so the moment a job is ready to work a job queue can wake a worker to work it" (intro)
- Heroku never replaced its database queue despite the trouble. "Despite our operational trouble, we never did replace our database job queue at Heroku." (intro)
- Performance claim, explicitly not a benchmark: about 10k trivial jobs a second on a MacBook Air. "on my commodity MacBook Air it works ~10k trivial jobs a second." (With performance in mind)
- Uses batch selects and updates and COPY FROM for bulk inserts. "Operations like bulk job insertions make use of COPY FROM for efficiency." (With performance in mind)
- Part of the Heroku trouble was many single-job Ruby processes each fighting for every job. "every worker was separately competing to lock every new job." (Ruby non-parallelism)
- River has one producer per process lock jobs for all its goroutines. "A producer inside each process consolidates work and locks jobs for all its internal executors" (Ruby non-parallelism)
- SKIP LOCKED in 9.5 is the biggest Postgres change for queues. "The most important for a queue was the addition of SKIP LOCKED in 9.5, which lets transactions find rows to lock with less effort by skipping rows that are already locked." (Improvements in Postgres)
- Postgres 12 REINDEX CONCURRENTLY, 13 B-tree deduplication, 14 removing expired B-tree entries to avoid splits all help queue tables. "Postgres 14 brought in an optimization to skip B-tree splits by removing expired entries as new ones are added." (Improvements in Postgres)
- Long transactions are still a hazard; at the time Postgres had no whole-transaction timeout. "Postgres has timeouts for individual statements and being idle in a transaction, but not for the total duration of a transaction." (Improvements in Postgres)
- River supports periodic jobs and unique jobs among its features. (Designed for generics)

## Visuals worth redrawing

None.

## My notes

- Written by River's author, so primary for River and for his own
  experience, but an advocate for the approach.
- The transaction timeout was "potential" when this was written;
  postgres-17-release-notes may say whether it landed.
