---
id: background-jobs
title: Background jobs
depth: deep
phase: 10
note: >-
  Job queues on Postgres with SKIP LOCKED vs Redis vs a broker.
needs: [message-queue, explicit-locking, transactional-outbox, idempotency, poison-messages, dead-letter-queue]
leads_to: [job-scheduling]
compare_with: [durable-execution, leases]
---

# Background jobs

A background job is work your request handler writes down instead of
doing: send the welcome email, resize the upload, charge the card. A
separate worker process picks it up and runs it later, so the user
isn't kept waiting. The idea is simple. The hard parts are making sure
two workers never grab the same job, a worker that crashes doesn't
lose one, and a job never runs before the data it needs exists.

## A job is a row or a message

Take a signup. `POST /users` inserts user 42 and wants a welcome
email sent. Sending it inside the request makes the user wait on your
email provider, and fails the signup if the provider is down. So the
handler records a job instead: "send the welcome email to user 42".
Store the id, not a copy of the user, because the worker should read
the current data when it runs.

That job has to live somewhere workers can find it. There are three
common places:

- **A table in your own database**, usually Postgres. Workers query it
  for the next job. Solid Queue (the default in new Rails 8 apps),
  River (Go) and Que work this way.
- **A list in Redis.** Sidekiq pushes jobs onto a Redis list and
  workers pop them off.
- **A [[message-queue]] broker** such as Amazon SQS, which hands each message to one consumer.

Whichever you choose, it has to answer the same three questions. How
does a worker claim a job so nobody else runs it? What happens to the
job if the worker dies halfway? And how does the job line up with the
database write that created it?

## Claiming a job in Postgres: FOR UPDATE SKIP LOCKED

With a jobs table, claiming means locking a row. The obvious query is
"give me the oldest ready job, and lock it":

```sql
SELECT id FROM jobs
ORDER BY id
LIMIT 1
FOR UPDATE;
```

`FOR UPDATE` takes a row lock, and any other transaction that wants
the same row waits for yours to commit or roll back (see
[[explicit-locking]]). The trouble is that every worker runs the
same query at the same time, so they all want the same first row. One
gets it. The rest wait on its lock, and when it's released they find
the row already taken. Adding workers adds waiting, not throughput.

`SKIP LOCKED`, added in Postgres 9.5, fixes this. Any row that can't be
locked right away is skipped instead of waited on. MySQL 8 and MariaDB
10.6 have it too.

![Three workers, A, B and C, run the same SELECT ... FOR UPDATE SKIP LOCKED query at once against a jobs table of five rows. A locks job 1. B finds job 1 locked, skips it and locks job 2. C skips jobs 1 and 2 and locks job 3. Jobs 4 and 5 stay ready for the next free worker. A note says that without SKIP LOCKED, B and C would wait on job 1's lock.](img/background-jobs-skip-locked.svg)

*Each worker gets a different row, and nobody waits.*

The Postgres docs are clear about the trade. A query that skips locked
rows sees an inconsistent view of the table, so it's wrong for general
queries and right for a queue, where you only want *some* free row.
With `LIMIT`, Postgres stops locking once it has enough rows, so a
worker doesn't lock more than it asked for.

Solid Queue's whole polling loop is two queries of this shape:
`SELECT job_id FROM solid_queue_ready_executions`, optionally filtered
by one queue name, `ORDER BY priority, job_id LIMIT n FOR UPDATE SKIP
LOCKED`. They're kept that narrow so a covering index serves them.

Before 9.5, queue libraries built the same thing by hand. Que, for
example, walked the jobs in order with a recursive query and tried a
[[advisory-locks|advisory lock]] on each one until it got one.

## When the worker dies halfway

A worker claims job 7 and then the machine loses power. Something has
to notice and give job 7 to someone else. There are two families of
answers.

**Hold the lock for the whole job.** The worker keeps its transaction
open while it works. A row lock lasts until its transaction ends, so
if the worker's transaction is rolled back, the row is free for the
next worker. This is simple, but every running job now means an open
transaction and a held database connection for as long as the job
takes, and open transactions have a cost of their own (see "Where it
gets tricky").

**Claim, commit, then work.** The worker marks the job as claimed by
itself and commits right away. Now nothing in the database ends
automatically when the worker dies, so the worker must prove it's
alive. Solid Queue has each process write a heartbeat, every 60
seconds by default. A supervisor treats a process as dead five minutes
after its last heartbeat and marks the jobs it had claimed as failed,
instead of leaving them claimed forever.

Brokers use the same idea. When an SQS consumer receives a message, the
message stays in the queue but is hidden for a visibility timeout, 30
seconds by default. Delete it in time and it's gone. Don't, and it
reappears for another consumer. For long jobs you extend the timeout
while you work, up to 12 hours from the first receive.

Plain Redis is the cautionary case. Sidekiq's basic fetch uses `BRPOP`,
which removes the job from Redis as it hands it over. If the process
crashes mid-job, the job is gone. Sidekiq's paid tier adds a fetch that
uses `LMOVE` to keep the job in Redis while it runs, and recovers
orphans once a process's heartbeat has been expired for 60 seconds. Its
own docs admit recovery can take anywhere from minutes to hours.

All of these are [[leases]]: a claim that expires unless it's renewed.
A lease has a cost. If a worker is slow rather than dead, say stuck in a
long [[process-pauses|pause]], its lease can run out while it's still
working. Another worker takes the job, and it runs twice. So every
design here gives you **at-least-once** execution, never exactly once
(see [[delivery-guarantees]]). Your job code has to be
[[idempotency|idempotent]]: running it twice must leave the same
result as running it once.

The flip side of automatic recovery is the job that kills its worker
every time, by running out of memory or hitting a crash. It gets
recovered, crashes the next worker, and repeats. Sidekiq calls it a
poison pill and kills any job that's been recovered three times in 72
hours. That's the [[poison-messages]] problem, and the usual answer is
a [[dead-letter-queue]] where failed jobs wait for a human.

## The job and the data it needs

Back to the signup. Suppose the jobs live in Redis and the user in
Postgres. There's no good moment to push the job.

![Three timelines of one API request. First: the job is pushed to Redis inside the transaction, before COMMIT, and a fast worker runs it and fails because user 42 isn't committed yet. Second: the job is pushed after COMMIT, but the process crashes between COMMIT and the push, so user 42 is saved and the job is lost. Third: the job row is inserted in the same database transaction as the user, and both commit together.](img/background-jobs-enqueue-timing.svg)

*Two stores give you two bad windows; one transaction closes both. Adapted from Brandur Leach, "River: a Fast, Robust Job Queue for Go + Postgres" (2023).*

Push before the commit, and a fast worker can run the job before the
user row is visible. It fails with "user not found". If the
transaction then rolls back, the job fails on every retry until it
lands in the dead-letter queue. Push after the commit, and a crash in
the gap between the two loses the job with no trace. This is the
[[dual-writes]] problem in its smallest form.

A jobs table in the same database closes both windows. The job row is
inserted in the same [[transaction]] as the user. Workers can't see it
until the transaction commits, and if it rolls back, the job goes with
it. It's the same trick as the [[transactional-outbox]], with the
worker reading the outbox directly. A related bonus in Postgres:
`NOTIFY` is also transactional, so the commit can wake a worker at the
same moment the job becomes visible.

Rails 8 offers a middle path for apps whose jobs aren't in the main
database: `enqueue_after_transaction_commit` holds the push until the
transaction commits. That removes the "ran too early" failure. It
doesn't remove the crash window after the commit.

## Postgres, Redis or a broker

| | Jobs table in Postgres | Redis list (Sidekiq) | Broker (SQS and friends) |
|---|---|---|---|
| Enqueue with your data | Same transaction | Separate write | Separate write |
| Claim | `FOR UPDATE SKIP LOCKED` | Pop from a list | Visibility timeout |
| Worker crash | Lock or heartbeat expires | Lost with basic fetch | Message reappears |
| Extra system to run | None | Redis | The broker |
| Main risk | Dead rows and long transactions | Losing jobs, two stores | Two stores, duplicates |

A database queue costs you database work. Every claim takes a row lock, idle
workers poll (Solid Queue's default is every 0.1 seconds per worker),
and every finished job leaves a dead row behind. That's fine for most
apps, and one fewer system to run is worth a lot. River's author
reports around 10,000 trivial jobs a second on a laptop, as a rough
sense of scale rather than a benchmark. Past the point where your
database can't absorb the churn, a dedicated broker is the better
home.

## Where it gets tricky

**A long transaction anywhere can stall the queue.** This is the
classic failure of Postgres queues. In [[mvcc]], a finished job's row
isn't removed at once. It becomes a dead row that [[vacuum]] cleans up
later, but only once no open transaction could still see it. One
forgotten analytics transaction holds back that cleanup. Dead job rows pile up, and each worker's
claim query has to step over all of them in the index, checking each
against the table, to find a live one. At Heroku in 2015, this took a
queue with job locks under 0.01 seconds to lock times about 15 times
slower, then to a backlog that grew faster than workers could drain
it. Their test table reached about 100,000 dead rows. Killing the one
open transaction cleared the backlog at once. See
[[long-running-transactions]].

That story predates `SKIP LOCKED`, and Postgres has improved since.
Version 12 added `REINDEX CONCURRENTLY`, 13 added B-tree deduplication,
and 14 lets B-tree pages drop expired entries before splitting, which
helps an index with as much churn as a queue's. None of that removes the rule: don't let other teams run long queries
on your queue's database.

**Same-database queues are a choice, not a default everyone agrees
on.** River's authors argue transactional enqueueing should be the
normal way to build. Solid Queue puts its tables in a *separate*
database by default. Its authors call same-transaction enqueueing a
sharp tool: code quietly comes to depend on it, and breaks the day you
move the queue somewhere else. If you rely on it, say so in the code.

**Heartbeats are per process, not per job.** A job stuck in an
infinite loop inside a healthy process keeps its claim forever. You
need a per-job timeout on top.

**Lock behavior differs by database.** On MySQL and MariaDB at their
default REPEATABLE READ level, InnoDB's gap locks on the polled index
can deadlock enqueues against claims under load. Solid Queue runs its
queue database at READ COMMITTED to avoid it.

**Fairness.** Workers that always drain the high-priority queue first
can starve the low one completely. Claiming several jobs at once saves
round trips, but a slow job can hold up the others claimed with it.

**Jobs aren't workflows.** A job is one unit of work retried as a
whole. When a task has several steps that each must happen once, like
charge, then ship, then email, retrying the whole job repeats the early
steps. That's where [[durable-execution]] comes in.

## What this means when you build

- If your data is in Postgres and your volume is moderate, a jobs
  table with `FOR UPDATE SKIP LOCKED` is a good default. Insert jobs in
  the same transaction as the data they need.
- Assume every job runs at least once, and sometimes twice. Make it
  idempotent.
- Decide how a crashed worker's job comes back: lock, heartbeat or
  visibility timeout. Know how long it takes.
- Put a per-job timeout on top of process heartbeats.
- Send jobs that keep failing to a dead-letter queue, and watch it.
- Watch for long-open transactions on the queue's database, and set
  timeouts that end them.
- For jobs that run on a clock (every night at 2 a.m.), see
  [[job-scheduling]].

## Further reading

- [SELECT, the locking clause](https://www.postgresql.org/docs/current/sql-select.html), PostgreSQL docs, version 18. What `FOR UPDATE`, `NOWAIT` and `SKIP LOCKED` do, and why skipping locked rows is only for queue-like tables.
- [Postgres Job Queues & Failure By MVCC](https://brandur.org/postgres-queues), Brandur Leach, 2015. How one long transaction ruined a Heroku job queue, traced through dead tuples and the B-tree.
- [River: a Fast, Robust Job Queue for Go + Postgres](https://brandur.org/river), Brandur Leach, 2023. The case for transactional enqueueing, the failure modes of a separate queue, and the Postgres changes that help queues.
- [Solid Queue README](https://github.com/rails/solid_queue), Rails, main branch. A real database queue: the polling queries, heartbeats, and why it defaults to a separate database.
- [Reliability](https://github.com/sidekiq/sidekiq/wiki/Reliability), Sidekiq wiki. Why a plain Redis pop loses jobs on a crash, and how super_fetch and poison-pill detection work.
- [Amazon SQS visibility timeout](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html), AWS docs. The broker version of a lease: hide, delete or reappear, with defaults and limits.
