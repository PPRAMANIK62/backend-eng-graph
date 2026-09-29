---
id: temporal-workflow-definition
title: Temporal Workflow Definition
author: Temporal Technologies
url: https://docs.temporal.io/workflow-definition
kind: docs
primary: true
---

## Summary

Temporal's page on writing workflow code. The useful parts are the
deterministic constraints (which calls produce Commands and must not
be added, removed or reordered), how a replay compares Commands with
the history, the timer-then-activity example of a breaking code
change, intrinsic non-determinism, and the two versioning strategies.

## Key claims

- Deterministic means the same API calls in the same order for the same input. "Generally speaking, this means you must take care to ensure that any time your Workflow code is executed it makes the same Workflow API calls in the same sequence, given the same input." (Deterministic constraints)
- Non-deterministic work (API calls, database queries) goes in activities. "To handle non-deterministic operations like API calls, LLM/AI invocations, database queries, and other external interactions, put them in Activities." (Deterministic constraints, tip)
- Safe changes include the duration of timers. "The duration of Timers (although changing them to 0 is not safe in all SDKs)" (Deterministic constraints, list of safe changes)
- Calls that produce Commands must not be reordered, added or removed without versioning; timers and activities are among them. "The following Workflow API calls all can produce Commands, and thus must not be reordered, added, or removed without proper Versioning techniques" (Deterministic constraints)
- On replay, each command is compared with the event at the same position. "When this API is called upon re-execution, that Command is compared with the Event that is in the same location within the sequence." (Deterministic constraints)
- A mismatch is a non-deterministic error. "If a generated Command doesn't match what it needs to in the existing Event History, then the Workflow Execution returns a _non-deterministic_ error." (Deterministic constraints)
- Two causes: code changes, or intrinsic non-determinism. "Code changes are made to a Workflow Definition that is in use by a running Workflow Execution." (Deterministic constraints, reason 1)
- Example: swapping a timer and an activity breaks a run that is waiting on the timer. "The first Command the Worker sees would be ScheduleActivityTask Command, which wouldn't match up to the expected TimerStarted Event." (Code changes can cause non-deterministic behavior)
- Changing a timer from or to 0 is non-deterministic in Java, Python and Go. "In Java, Python, and Go, changing a Timer's duration from or to 0 is a non-deterministic behavior." (Code changes)
- No branching on local time or random numbers. "For example, a Workflow Definition can not have inline logic that branches (emits a different Command sequence) based off a local time setting or a random number." (Intrinsic non-deterministic logic)
- SDK APIs for time and randomness store results in the history. "When those APIs are used, the results are stored as part of the Event History, which means that a re-executed Workflow Function will issue the same sequence of Commands, even if there is branching involved." (Intrinsic non-deterministic logic)
- Two versioning strategies. "Worker Versioning: keep Workers tied to specific code revisions, so that old Workers can run old code paths and new Workers can run new code paths." (Versioning Workflows)
- Worker Versioning is the recommended one. "This is the **recommended** way to handle versioning and users see improved error rates when adopting it." (Worker Versioning)
- Workflows fail only when code throws, not from infrastructure outages. "The only reason a Workflow Execution might fail is due to the code throwing an error or exception, not because of underlying infrastructure outages." (Handling unreliable Worker Processes)
- Patching keeps a change compatible with runs already in flight. "Versioning with patching: make sure your code changes are compatible across versions of your Workflow." (Versioning Workflows)
- Safe to change: inputs, return values and timeouts of activities and child workflows, but not their types or ids. "However, it is not safe to change the types or IDs of Child Workflows or Activities" (Deterministic constraints, list of safe changes)
- Versioning matters most for runs that outlive a deploy. "A versioning strategy is even more important if your Workflow Executions live long enough to run on multiple versions of your Worker." (Versioning Workflows)

## Visuals worth redrawing

None.

## My notes

- Patching details are on docs.temporal.io/patching (read, not
  cited): patched() writes a marker into the history on first run and
  returns false on replay of a history without the marker.
