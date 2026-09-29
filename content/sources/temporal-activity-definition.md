---
id: temporal-activity-definition
title: Temporal Activity Definition
author: Temporal Technologies
url: https://docs.temporal.io/activity-definition
kind: docs
primary: true
---

## Summary

Temporal's page on writing activities, the steps that do the real
work. The useful part is idempotency: why activities can run more than
once, the crash window that causes it, and using the run id plus
activity id as an idempotency key.

## Key claims

- Completed activities don't rerun on replay, but aren't recorded until they return. "By design, completed Activities will not re-execute as part of a Workflow Replay. However, Activities won’t record to the Event History until they return or produce an error." (Idempotency, info box)
- Activities may run more than once, so make them idempotent. "Because Activities may be retried, these functions may be executed more than once." (Idempotency)
- The crash window: the activity finishes, the worker dies before reporting. "The Activity function completes successfully, but the Worker crashes just before it notifies the Temporal Service." (Idempotency)
- A retried activity reruns all of its steps, so smaller activities retry less. "During retry, the entire Activity—and therefore each of the three steps—is executed again." (Idempotency)
- Idempotency keys are enforced by the called service, not the activity. "These are enforced by the service you are calling from your Activity, not by the Activity itself." (Idempotency)
- Run id plus activity id makes a stable key. "You can use a combination of the Workflow Run ID and the Activity ID as an idempotency key since this is guaranteed to be consistent across retry attempts but unique among Workflow Executions." (Idempotency)
- Exactly once is about the observed completion, not the execution. "For an Activity with a Retry Policy that allows retries, Temporal guarantees that the Activity will be observed as completed exactly once." (Activity retry policy)
- The backoff schedule survives worker crashes. "Temporal will keep track of the exponential backoff delay even if the Worker crashes." (Activity retry policy)

- An activity may run, even partly, more than once. "However, the Activity may be executed multiple times and may even partially complete more than once during this process." (Activity retry policy)
- Smaller activities mean a larger history. "However, you must balance this against the potential for a larger Event History, since there would now be three Activity Executions instead of one." (Idempotency)

## Visuals worth redrawing

None.

## My notes

- Pairs with `idempotency-keys`.
