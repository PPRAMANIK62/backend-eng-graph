---
id: temporal-events-and-history
title: Events and Event History (Temporal docs)
author: Temporal Technologies
url: https://docs.temporal.io/workflow-execution/event
kind: docs
primary: true
---

## Summary

Temporal's page on Events and the Event History: the append-only log
per workflow execution that makes durable execution possible, the
events an activity adds, the size limits on a history, and why long
runs should Continue-As-New.

## Key claims

- The history is what lets an execution recover from a crash. "This information not only enables developers to know what took place, but is also essential for providing Durable Execution, since it enables the Workflow Execution to recover from a crash and continue making progress." (intro)
- An Event History is an append-only log. "An append-only log of Events for your application." (What is an Event History?)
- Scheduling an activity adds an ActivityTaskScheduled event and a task to a task queue. "When ActivityTaskScheduled is added to History, the Temporal Service adds a corresponding Activity Task to the Task Queue." (Activity Events)
- A worker polling that queue runs the activity. "A Worker polling that Task Queue picks up the Activity Task and runs the Activity function or method." (Activity Events)
- While an activity is retrying, only the scheduled event is in the history. "While the Activity is running and retrying, ActivityTaskScheduled is the only Activity-related Event in History" (Activity Events, note)
- The service warns after 10,240 events. "The Temporal Service logs a warning after 10,240 Events and periodically logs additional warnings as new Events are added." (Event History limits)
- The execution is terminated past 51,200 events. "exceeds 51,200 Events." (Event History limits, list of termination conditions)
- Continue-As-New closes the run and starts a new one to stay under the limits. "To avoid hitting these limits, you can use the Continue-As-New feature to close the current Workflow Execution and create a new one." (Event History limits)
- No limit on how long a workflow runs. "No, there is no time constraint on how long a Workflow Execution can run." (Time constraints)

## Visuals worth redrawing

- The swim-lane diagram of a workflow execution. Not redrawn.

## My notes

- The limits page (docs.temporal.io/workflow-execution/limits) adds a
  50 MB size cap and a 10 MB warning; that page wasn't made a note, so
  only the event counts are used.
- Continue-As-New page: new run keeps the Workflow Id, gets a new Run
  Id and a fresh history. Read, not cited.
