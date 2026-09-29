---
id: brandur-postgres-queues-2015
title: Postgres Job Queues & Failure By MVCC
author: Brandur Leach
url: https://brandur.org/postgres-queues
kind: blog
primary: true
---

## Summary

Brandur Leach, then at Heroku, on a Postgres-backed job queue (Que,
and Queue Classic before it) that fell behind whenever a long
transaction was open anywhere on the database. Dead job rows pile up
that VACUUM can't remove, and every worker has to walk past them in
the index to find a live job. Written against Postgres 9.4, before
SKIP LOCKED. Primary for the Heroku incident and the test bench; the
Postgres internals are his explanation, checked by a Postgres
developer (acknowledgements).

## Key claims

- Why jobs go in Postgres at all: they commit or roll back with the work that made them. "when an operation fails and rolls back, an injected job rolls back with it." (Why put a job queue in Postgres?)
- Workers can't see a job until the transaction that inserted it commits. "Postgres transactional isolation also keeps jobs invisible to workers until their transactions commit and are ready to be worked." (Why put a job queue in Postgres?)
- Without that, jobs running before the enqueuing request commits is a common problem. "having jobs that are worked before the request that enqueued them is fully committed is a common problem." (Why put a job queue in Postgres?)
- The incident: one idle analytical transaction held the queue back; killing it cleared the backlog. "You promptly send it a SIGINT. The queue’s backlog evaporates in the blink of an eye and normalcy returns." (opening)
- At about 50 jobs a second in the test, the effect shows up fast. "With a relatively high rate of churn through the jobs table (roughly 50 jobs a second here), the effect can be reproduced quite quickly." (opening)
- Locking a job normally takes under 0.01 s and grew about 15 times as the oldest transaction aged. "During stable operation, a worker locking a job to make sure that it can be worked exclusively takes on the order of < 0.01 seconds." (Slow lock time)
- The runaway: slower locking means fewer jobs worked than produced. "the queue will eventually reach a point where more jobs are being produced than being worked, leading to a runaway queue." (Slow lock time)
- Que locked jobs with advisory locks. "Que is implemented using Postgres advisory locks because they’re atomic and fast" (Locking algorithms)
- Dead tuples in the jobs table grew toward 100,000 in the test. "by the end of our experiment, we’re approaching an incredible 100,000 dead rows." (Dead tuples)
- VACUUM can't remove rows that an open snapshot might still see; the manual VACUUM output showed "247311 dead row versions cannot be removed yet". (Dead tuples)
- A Postgres index doesn't generally hold visibility information, so each index hit means a heap visit to check it. "a Postgres index doesn’t generally contain tuple visibility information" (Descending the B-tree)
- Every worker walks the dead entries on every lock attempt, and each finished job adds another. "every time a job is successfully worked a new dead tuple is left in the index, making the next job that much harder to lock." (Descending the B-tree)
- Queues are especially hit because they take one job at a time and throw the work away between jobs. "A job queue’s access pattern is particularly susceptible to this kind of degradation because all this work gets thrown out between every job that’s worked." (Descending the B-tree)
- Locking several jobs at once spreads the cost but lets jobs get stuck behind a slow one in the same batch. "jobs can get “stuck” behind a long-running job that happened to come out ahead of them in the same batch." (Lock multiple jobs)
- Alternative: a pending_jobs table in the database, moved in bulk into a Redis queue like Sidekiq, keeps transactional consistency. (Batch jobs to Redis)
- Any hot Postgres table can suffer this, not only queues. "similar problems can develop for any sufficiently hot Postgres table." (Lessons learnt)
- Kill long transactions; statement_timeout alone isn't enough. "Postgres also provides a built-in setting called statement_timeout that’s worth enabling as well, but which is insufficient in itself" (Lessons learnt)
- Don't share a database across team boundaries. "don’t share databases across component or team boundaries." (Summary)
- Que walks jobs in priority order with a recursive CTE and tries an advisory lock on each until one succeeds. "By recursing continually given this stable sorting mechanism, jobs in the table are iterated one-by-one and a lock is attempted on each." (Locking algorithms)
- Lock time rose to about 15 times its normal level. "this lock time escalates quickly until it’s 15x that level at times of 0.1 s and above." (Slow lock time)

## Visuals worth redrawing

- The two index diagrams: a B-tree search that lands on a live job right
  away, and one that walks through a run of dead tuples first
  (Descending the B-tree).

## My notes

- Postgres 9.4 era, no SKIP LOCKED. The mechanism (dead tuples held by
  an old snapshot) still applies to any queue table today.
- Numbers are from his que-degradation-test on Heroku Postgres plans,
  not a general benchmark.
