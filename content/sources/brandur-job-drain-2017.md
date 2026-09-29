---
id: brandur-job-drain-2017
title: Transactionally Staged Job Drains in Postgres
author: Brandur Leach
url: https://brandur.org/job-drain
kind: blog
primary: false
---

## Summary

The outbox idea applied to background jobs: instead of pushing a job to
a queue from inside a transaction, insert it into a staging table in the
same transaction, and have one enqueuer process move committed rows to
the real queue and then delete them.

## Key claims

- Enqueueing inside a transaction: a fast worker can run the job before the data it needs is committed. "A worker starts running it before its enclosing transaction is committed, and it fails to access data that it expected to be available." (intro)
- On rollback, a job already queued can never succeed. "jobs inserted into the queue will never succeed no matter how many times they’re retried." (intro)
- Enqueueing after commit risks a crash in between, and the work silently never happens. "If you queue a job after a transaction is committed, you run the risk of your program crashing after the commit, but before the job makes it to the queue." (For every complex problem ...)
- Staged jobs are invisible until their transaction commits. "the ACID properties of the running transaction keep them invisible until they’re ready to be worked." (Transactions as gates)
- One enqueuer runs at a time (under a lock), reads a batch ordered by id, sends it, then deletes the sent rows, inside a REPEATABLE READ transaction so the delete matches what was read. "Need at least repeatable read isolation level" (Transactions as gates, code comment)
- Rows are deleted only after they're sent, so a crash re-sends rather than loses: at least once. "At least once delivery semantics are guaranteed." (Transactions as gates)
- Compared with working jobs straight out of Postgres, draining in bulk to a store like Redis avoids workers fighting over row locks under load. "long-running transactions greatly increase the amount of time it takes for workers to find a job that they can lock" (Advantages over in-database queues)
- The drain loop backs off when there is nothing to send. "sleep for some time so we're not continuously hammering the database with no-ops." (Transactions as gates, code comment)

## Visuals worth redrawing

- Jobs invisible to the enqueuer until their transaction commits.

## My notes

- Brandur worked at Stripe and Heroku; this is a practitioner post, not
  from Postgres's builders. primary: false.
