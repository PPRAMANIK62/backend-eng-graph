---
id: temporal-timers
title: Timers and Start Delays (Temporal docs)
author: Temporal Technologies
url: https://docs.temporal.io/workflow-execution/timers-delays
kind: docs
primary: true
---

## Summary

Temporal's short page on Timers: they're persisted, a worker uses no
resources while waiting, a duration is a minimum rather than an exact
time, and Start Delay for a workflow that should start once, later.

## Key claims

- Timer APIs keep time handling deterministic. "Temporal SDKs offer Timer APIs so that the Workflow Definition is deterministic in its handling of time values." (What is a Timer?)
- Timers are persisted and fire even if everything was down at the due time. "Timers in Temporal are persisted, meaning that even if your Worker or Temporal Service is down when the time period completes, as soon as your Worker and Temporal Service become available, the call that is awaiting the Timer in your Workflow code will resolve, causing execution to proceed." (What is a Timer?)
- A waiting timer costs a worker nothing. "Workers consume no additional resources while waiting for a Timer to fire, so a single Worker can await millions of Timers concurrently." (What is a Timer?)
- Timers can be from one second to several years. "your Workflow might specify a value as short as one second or as long as several years." (What is a Timer?)
- Treat the duration as a minimum; don't rely on sub-second accuracy. "We recommend that you consider the duration as a minimum time, one which will be rounded up slightly due to the latency involved with scheduling and firing the Timer." (What is a Timer?)
- Example: 11.97 seconds ends up closer to 12. "For example, setting a Timer for 11.97 seconds is guaranteed to delay execution for at least that long, but will likely be closer to 12 seconds in practice." (What is a Timer?)
- Start Delay runs a workflow once, later, unlike a schedule. "This is useful if you have a Workflow you want to schedule out in the future, but only want it to execute once: in comparison to reoccurring Workflows using Schedules." (What is a Start Delay?)

## Visuals worth redrawing

None.

## My notes

- "Millions of timers" is the vendor's claim with no setup; not used as
  a number in the article.
