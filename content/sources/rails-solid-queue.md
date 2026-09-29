---
id: rails-solid-queue
title: Solid Queue README
author: Rails core team (37signals) and contributors
url: https://github.com/rails/solid_queue
kind: code
primary: true
---

## Summary

The README of Solid Queue, the database-backed Active Job backend that
new Rails 8 apps get by default. Workers poll a ready table with
FOR UPDATE SKIP LOCKED; dispatchers move due scheduled jobs into the
ready table; a scheduler enqueues recurring (cron-like) tasks; a
supervisor watches heartbeats. Read from the main branch.

## Key claims

- Uses FOR UPDATE SKIP LOCKED to avoid lock waits when polling. "it leverages the FOR UPDATE SKIP LOCKED clause, if available, to avoid blocking and waiting on locks when polling jobs." (intro)
- Default in new Rails 8 apps. "Solid Queue is configured by default in new Rails 8 applications." (Installation)
- Needs MySQL 8+, MariaDB 10.6+ or PostgreSQL 9.5+ for SKIP LOCKED; older versions get lock waits with several workers. "You can use it with older versions, but in that case, you might run into lock waits if you run multiple workers for the same queue." (Workers, dispatchers, and scheduler)
- Workers take jobs from the ready table. "Workers are in charge of picking jobs ready to run from queues and processing them." (Workers, dispatchers, and scheduler)
- Delayed jobs: dispatchers move due jobs into the ready table. "which is simply moving them from the solid_queue_scheduled_executions table over to the solid_queue_ready_executions table so that workers can pick them up." (Workers, dispatchers, and scheduler)
- The scheduler enqueues recurring tasks when they're due. "The scheduler manages recurring tasks , enqueuing jobs for them when they're due." (Workers, dispatchers, and scheduler)
- The polling query: SELECT job_id FROM solid_queue_ready_executions [WHERE queue_name = ?] ORDER BY priority ASC, job_id ASC LIMIT ? FOR UPDATE SKIP LOCKED, shaped so a covering index is used. "To keep polling performant and ensure a covering index is always used, Solid Queue only does two types of polling queries" (Queues specification and performance)
- Default polling interval: 1 s for dispatchers, 0.1 s for workers. "This time defaults to 1 second for dispatchers and 0.1 seconds for workers." (Configuration)
- A process that dies without cleaning up leaves claimed jobs; heartbeats let the supervisor prune it and mark its jobs failed. "Jobs that were claimed by processes with an expired heartbeat will be marked as failed with a SolidQueue::Processes::ProcessPrunedError ." (Workers, dispatchers, and scheduler)
- Heartbeats are per process, so a stuck job in a live process stays claimed. "a single stuck job can remain claimed if the worker process itself is still alive." (Workers, dispatchers, and scheduler)
- Heartbeat defaults: every 60 seconds; dead after 5 minutes. "process_heartbeat_interval : the heartbeat interval that all processes will follow—defaults to 60 seconds." and "process_alive_threshold : how long to wait until a process is considered dead after its last heartbeat—defaults to 5 minutes." (Other configuration settings)
- On MySQL/MariaDB, REPEATABLE READ gap locks can deadlock enqueue against claim; they run READ COMMITTED. "Under the default REPEATABLE READ , InnoDB takes gap locks on the indexes Solid Queue polls, which under heavy load can occasionally deadlock jobs being enqueued against jobs being claimed or dispatched." (Workers, dispatchers, and scheduler)
- Concurrency controls: limit how many jobs with a key run at once, using semaphores, with a duration as a failsafe if a holder dies. "we have the duration as a failsafe." (Concurrency controls)
- Same-database queues give transactional integrity, which they call a sharp tool, so by default Solid Queue uses a separate database. "by default Solid Queue is configured in a different database as the main app." (Jobs and transactional integrity)
- Rails 8 can defer enqueueing until the transaction commits (enqueue_after_transaction_commit). "Starting from Rails 8, an option which doesn't rely on this transactional integrity and which Active Job provides is to defer the enqueueing of a job inside an Active Record transaction until that transaction successfully commits." (Jobs and transactional integrity)
- Recurring tasks run like cron jobs, managed by the scheduler. "Solid Queue supports defining recurring tasks that run at specific times in the future, on a regular basis like cron jobs." (Recurring tasks)
- Each task schedules the next one after it's enqueued. "Tasks are enqueued at their corresponding times by the scheduler, and each task schedules the next one." (Recurring tasks)
- Several schedulers can run the same schedule; a unique index on (task_key, run_at), written in the same transaction as the job, stops duplicates. "This table has a unique index on task_key and run_at , ensuring only one entry per task per time will be created." (Recurring tasks)
- That guarantee depends on keeping finished jobs. "This only works if you have preserve_finished_jobs set to true (the default), and the guarantee applies as long as you keep the jobs around." (Recurring tasks)
- For jobs sent to another backend there's no such guarantee. "there won't be any guarantees that the job is enqueued only once each time." (Recurring tasks)
- Schedules take a time zone; without one, the app's configured zone. "When a schedule doesn't specify one, it's interpreted in the application's configured time zone ( config.time_zone ) by default." (Recurring tasks)

## Visuals worth redrawing

None.

## My notes

- README on the main branch, so defaults can change between releases.
