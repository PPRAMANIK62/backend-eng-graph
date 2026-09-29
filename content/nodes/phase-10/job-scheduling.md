---
id: job-scheduling
title: Job scheduling
depth: short
phase: 10
note: >-
  Cron jobs and delayed jobs that run once, even with several workers.
needs: [background-jobs]
leads_to: []
compare_with: [durable-timers, leader-election, backfills]
---

# Job scheduling

Some [[background-jobs]] run on a clock instead of in response to a
request: a report every night at 2 a.m., a cleanup every 15 minutes, a
reminder email 24 hours after signup. Scheduling turns a time into an
enqueued job. The hard part is that you run several servers, and each
one would happily enqueue the 2 a.m. report. You want it once, not
zero times and not three.

## Two kinds of scheduled job

**Delayed jobs** run once, at a time set when they're created:
"remind user 42 tomorrow". The job carries a `run_at` time and isn't
claimable until then. Solid Queue keeps
these in a separate table of scheduled jobs. A dispatcher process
checks it, every second by default, and moves the jobs that are due
into the ready table that workers poll. So a delayed job can start up
to one polling interval late, plus however long the queue is.

**Recurring jobs** run on a repeating schedule, usually written in cron
syntax. Five fields: minute, hour, day of month, month, day of week.
`0 3 * * 1` means 3 a.m. every Monday. `*/15 * * * *` means every 15
minutes. In Kubernetes, one CronJob is the same idea as one line of a
Unix crontab.

A schedule also needs a time zone, and the default is easy to miss.
Kubernetes reads a CronJob's schedule in the controller manager's local
time zone unless you set `.spec.timeZone` (stable since Kubernetes
1.27). Solid Queue uses the Rails app's configured zone unless the
schedule names one.

## Once, with several schedulers

One scheduler process is a single point of failure. So you run one on
every server, and then need them not to duplicate each other.

Solid Queue does it with a unique index. When a scheduler enqueues a
recurring task, in the same [[transaction]] it inserts a row into a
table of recurring executions, keyed by the task name and the time the
run was due. That pair has a unique index. The first scheduler to
commit wins. The second one's insert breaks the unique constraint, its
transaction rolls back, and its copy of the job goes with it.

![Two schedulers, on server 1 and server 2, both decide at 02:00 that the task nightly_report is due. Each opens a transaction that inserts the job and a recurring_execution row keyed by (task_key, run_at). A unique index on (task_key, run_at) lets only one row exist. Server 1 commits; server 2 gets a unique violation, rolls back, and its job insert goes with it.](img/job-scheduling-unique-run.svg)

*The run's due time, not the clock, is the key. Both schedulers compute the same key, so the database can pick one. Adapted from the Solid Queue README.*

The key is the time the run was *due*, not the time the scheduler woke
up. The servers' clocks disagree a little (see [[clock-skew]]), but
both compute the same due time from the same schedule, so they collide
on the same key. This
works only while the rows are kept: Solid Queue's guarantee holds as
long as finished jobs stay in the table, and a job sent to a different
queue backend gets no such check.

The other common design is to let one process at a time own the
schedule, picked by [[leader-election]]. River, a Go job queue, works
this way: only the leader inserts periodic jobs, from a schedule it
keeps in memory. That avoids duplicates, but the schedule starts over
when a new leader takes over, so a run that falls due during the
handoff can be skipped. River's fix borrows the unique-key idea: make
the job unique per hour (or per run) and have a new leader enqueue it
as soon as it's elected. The unique key rejects any duplicate that causes.

## What "once" really means

A Kubernetes CronJob creates a Job *about* once per scheduled time.
Sometimes it creates two, or none, so its docs tell you to make the
job itself [[idempotency|idempotent]]. The same holds for every
scheduler: a unique key makes duplicates rare, and the job must
survive the rest.

Two settings shape what happens when things go wrong:

- **Missed runs.** If the controller was down at the due time,
  `startingDeadlineSeconds` says how late a run may still start. Past
  that, the run is skipped and counted as missed. The Kubernetes docs
  give a twice-daily backup as the example: allow it to start up to 8
  hours late, but no later, because a later backup isn't worth taking.
  Without a deadline, a controller that missed more than 100 runs
  refuses to start the job at all. The controller checks every 10
  seconds, so a deadline under 10 seconds may never be met.
- **Overlap.** If a run takes longer than the interval, the next one
  arrives while it's still going. `concurrencyPolicy` picks: `Allow`
  (the default) runs both, `Forbid` skips the new run, `Replace` swaps
  the running one for the new one.

## Where it gets tricky

**Catch up or skip?** After an outage, should the scheduler run every
missed tick, one of them, or none? A cleanup should run once; a
daily billing run may need every missed day. Pausing a Kubernetes CronJob and then
resuming it without a deadline starts the missed runs at once.

**Long waits belong elsewhere.** A delayed job is fine for "email in 24
hours". For "wait a week, then check whether they paid, then maybe
cancel", the wait is one step of a longer process, and
[[durable-timers]] inside a workflow are a better fit.

## What this means when you build

- Key each run by its due time and let a unique index reject
  duplicates. Keep those rows as long as the guarantee needs them.
- Make scheduled jobs idempotent anyway.
- Set a time zone on every schedule.
- Decide for each job what to do with missed runs and overlapping
  runs, instead of taking the defaults.

## Further reading

- [CronJob](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/), Kubernetes docs. Cron syntax, starting deadlines, concurrency policy, time zones, and why a run can happen twice or not at all.
- [Periodic and cron jobs](https://riverqueue.com/docs/periodic-jobs), River docs. The leader-elected design, why it can skip a run, and how unique jobs cover the gap.
- [Solid Queue README](https://github.com/rails/solid_queue), Rails, main branch. Delayed jobs through a dispatcher, and recurring tasks made unique across schedulers with a `(task_key, run_at)` index.
