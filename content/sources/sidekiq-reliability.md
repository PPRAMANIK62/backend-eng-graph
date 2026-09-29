---
id: sidekiq-reliability
title: Reliability (Sidekiq wiki)
author: Mike Perham and Sidekiq contributors
url: https://github.com/sidekiq/sidekiq/wiki/Reliability
kind: docs
primary: true
---

## Summary

The Sidekiq wiki page on not losing jobs with Redis. Plain Sidekiq
pops a job off a Redis list with BRPOP, so a crash mid-job loses it.
Sidekiq Pro's super_fetch keeps the job in Redis until it's done,
recovers orphans after a heartbeat expires, and kills poison pills.
Also: the default scheduler for future jobs isn't atomic.

## Key claims

- Basic fetch removes the job from Redis, so a crash loses it. "Sidekiq uses BRPOP to fetch a job from the queue in Redis. This is very efficient and simple but it has one drawback: the job is now removed from Redis. If Sidekiq crashes while processing that job, it is lost forever." (Using super_fetch)
- The only guarantee is to keep the job until it's finished. "the only way to guarantee job durability is to not remove it from Redis until it is complete" (Using super_fetch)
- super_fetch uses LMOVE to keep jobs in Redis while they run. "Sidekiq Pro offers an alternative fetch strategy, super_fetch, for job processing using Redis' LMOVE command which keeps jobs in Redis." (Using super_fetch)
- A process killed without warning leaves orphaned jobs; recovery waits for its heartbeat to expire (60 seconds). "if the process's heartbeat has expired (it takes 60 seconds to expire)" (Recovering Jobs)
- Recovery time isn't bounded. "In summary, super_fetch might recover jobs in 5 minutes or 3 hours, there's no guarantee." (Recovering Jobs)
- A job recovered three times in 72 hours is a poison pill and gets killed. "If the same job is recovered three times in 72 hours, it will be classified as a poison pill and automatically killed (i.e. placed in the Dead set)." (Poison Pills)
- Strict queue ordering can starve lower queues. "Beware that strict ordering can lead to starvation" (Strict ordering)
- The default scheduler moves due jobs in two round trips, not atomically. "Sidekiq's default scheduler is not atomic, it pops jobs off the scheduled queue and enqueues them with two network round trips." (Scheduler)

## Visuals worth redrawing

None.

## My notes

- super_fetch and the reliable scheduler are Sidekiq Pro (paid) features.
- The Best Practices page of the same wiki says Sidekiq runs jobs at
  least once, not exactly once; not given a note here.
