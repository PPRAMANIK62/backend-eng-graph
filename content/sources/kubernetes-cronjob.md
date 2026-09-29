---
id: kubernetes-cronjob
title: CronJob (Kubernetes documentation)
author: The Kubernetes Authors
url: https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/
kind: docs
primary: true
---

## Summary

The Kubernetes concept page for CronJob, stable since v1.21: a
crontab line that creates a Job on a schedule. Cron syntax, missed
runs and the starting deadline, the concurrency policy, time zones,
and the admission that a run can happen twice or not at all.

## Key claims

- One CronJob is like one crontab line. "One CronJob object is like one line of a crontab (cron table) file on a Unix system." (intro)
- The five cron fields: minute, hour, day of month, month, day of week; "0 3 * * 1" is Mondays at 3 AM. "For example, 0 3 * * 1 means this task is scheduled to run weekly on a Monday at 3 AM." (Schedule syntax)
- Runs are approximate: two or none can happen, so jobs must be idempotent. "there are certain circumstances where two Jobs might be created, or no Job might be created. Kubernetes tries to avoid those situations, but does not completely prevent them. Therefore, the Jobs that you define should be idempotent ." (Job creation)
- A single CronJob can even create concurrent Jobs. "in certain circumstances, a single CronJob can create multiple concurrent Jobs." (intro)
- startingDeadlineSeconds: how late a missed run may still start; after that it's skipped. "After missing the deadline, the CronJob skips that instance of the Job (future occurrences are still scheduled)." (Deadline for delayed Job start)
- Example: a twice-daily backup might be allowed to start up to 8 hours late but no later. (Deadline for delayed Job start)
- Concurrency policy Allow (default), Forbid (skip the new run), Replace (replace the running one). "Forbid : The CronJob does not allow concurrent runs; if it is time for a new Job run and the previous Job run hasn't finished yet, the CronJob skips the new Job run." (Concurrency policy)
- With no deadline and Allow, jobs always run at least once. "If startingDeadlineSeconds is set to a large value or left unset (the default) and if concurrencyPolicy is set to Allow , the Jobs will always run at least once." (Job creation)
- The controller checks every 10 seconds. "This is because the CronJob controller checks things every 10 seconds." (Job creation)
- More than 100 missed schedules and it won't start the Job. "If there are more than 100 missed schedules, then it does not start the Job and logs the error." (Job creation)
- Without a time zone, schedules follow the controller manager's local zone; .spec.timeZone is stable since v1.27. "For CronJobs with no time zone specified, the kube-controller-manager interprets schedules relative to its local time zone." (Time zones)
- Since v1.32 created Jobs carry an annotation with the originally scheduled time. "Starting with Kubernetes v1.32, CronJobs apply an annotation batch.kubernetes.io/cronjob-scheduled-timestamp to their created Jobs." (Job creation)
- Unsuspending a CronJob with no starting deadline schedules the missed Jobs at once. "When .spec.suspend changes from true to false on an existing CronJob without a starting deadline, the missed Jobs are scheduled immediately." (Schedule suspension)

## Visuals worth redrawing

- The cron field diagram (minute, hour, day of month, month, day of
  week) in Schedule syntax.

## My notes

- The "two or none" admission is the same trade-off any distributed
  scheduler faces, from the people who built a big one.
