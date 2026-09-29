---
id: durable-timers
title: Durable timers
depth: short
phase: 17
note: >-
  Sleeping for a week inside a workflow, surviving restarts.
needs: [durable-execution]
leads_to: []
compare_with: [job-scheduling]
---

# Durable timers

A durable timer is a sleep inside a workflow that the engine stores
instead of your process. You can write "wait three days, then send a
reminder" as one line of workflow code, and it works even if every
worker restarts in between, because nothing is holding the wait in
memory. It's how [[durable-execution]] engines do delays and timeouts.

## Why a normal sleep doesn't work

Say a billing workflow sends an invoice, waits a day, and sends a
reminder if the invoice isn't paid. In ordinary code you'd call
`sleep(24h)`. Inside a workflow that breaks in three ways:

- **The process can die.** A sleeping thread is state in memory. If
  the worker restarts, the sleep, and the knowledge that one was going
  on, is gone.
- **It ties up a worker.** A blocked thread holds a slot for the whole
  wait, while a durable timer costs a worker nothing.
- **It breaks replay.** Workflow code reruns from the top every time it
  resumes. A real sleep would wait again on every replay, and working
  out "when is 24 hours from now" from the system clock gives a
  different answer each time; see [[workflow-determinism]].

So every engine gives you its own timer call, and the docs all say the
same thing: use it instead of the language's sleep.

## How the engine keeps a timer

When workflow code asks for a timer, the call goes to the engine like
any other step. The engine stores the timer with its due time, and the
workflow is unloaded until something happens.

Azure's Durable Task Framework stores the timer as a message in a
queue that stays invisible until the due time. When it becomes
visible, it wakes the workflow up, even if the app had scaled down to
zero instances in the meantime. Temporal's timers are persisted too:
if the workers or the Temporal service itself are down at the
due time, the timer fires as soon as they're back. A waiting timer uses
no worker resources at all.

When the timer fires, the workflow wakes up and replays from the top.
The history shows the timer already done, so the sleep returns at once
and the code carries on past it with all its local variables back in
place.

![Timeline with three lanes: workflow, engine storage and workers. The workflow sends an invoice and calls sleep(24h). The engine stores the timer with its due time, and the workflow is unloaded, not in memory. Partway through the wait a worker crashes and restarts, and the timer is unaffected. At the due time the timer fires, and the workflow replays and sends the reminder.](img/durable-timers-timeline.svg)

*A day-long wait that survives a restart, because the wait lives in the engine's storage, not in a worker.*

## Timeouts: race a timer against something else

The other main use is a timeout. Start an activity, or a wait for an
outside event like a human approval, and start a timer next to it. Wait
for whichever finishes first. If the timer wins, you've timed out.

Two details matter. First, if the activity wins, cancel the timer. In
Azure, an orchestration isn't marked completed while a timer it created
is still pending. Second, if the timer wins, the activity isn't
stopped. The workflow just stops waiting for it and ignores its result.
It may still finish and have its effect.

While a timer is pending, the workflow can still handle other incoming
events, so a timer and an approval can wait side by side.

## Where it gets tricky

**A timer is a minimum, not an appointment.** The engine fires it at
or after the due time, never before, and a bit late is normal because
scheduling and firing take time. Temporal's example: a timer set for
11.97 seconds will most likely end up closer to 12. Don't build
anything that needs sub-second precision on it.

**Long timers have limits in some SDKs.** Azure's JavaScript, Python
and PowerShell SDKs cap a durable timer at six days; you loop over
shorter timers for anything longer. Even where long timers are
allowed, the engine may build them out of shorter ones internally,
which you'll notice in the stored history. Temporal accepts anything
from one second to several years.

**Compute due times from the engine's clock.** If you work out "next
Monday at 9" yourself, use the workflow's current time from the SDK,
never the system clock, or the due time changes on replay.

**It's not a cron job.** A [[job-scheduling|scheduled job]] is a row
with a run time that some worker picks up later; the job starts fresh.
A durable timer sits inside a running workflow, which carries on from
the line after the sleep with its state intact. If you just want
something to happen once, later, and have no workflow around it,
Temporal also has a start delay for a whole workflow.

## What this means when you build

- Never call the language's sleep in workflow code. Use the SDK's
  timer.
- For timeouts, race a timer against the work, and cancel the loser if
  your SDK lets you.
- Remember that a timed-out activity may still complete. Make it
  idempotent, or compensate.
- Treat durations as "at least", and don't expect sub-second accuracy.
- Check your SDK's maximum timer length before sleeping for weeks.

## Further reading

- [Timers in Durable Functions](https://learn.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-timers), Microsoft (Azure Functions docs). How timers are stored as delayed queue messages, the timeout pattern, and the limits on long timers.
- [Durable orchestrations](https://learn.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-orchestrations), Microsoft (Azure Functions docs). How an expired timer wakes the orchestrator and replays it from the start.
- [Timers and Start Delays](https://docs.temporal.io/workflow-execution/timers-delays), Temporal Technologies. Persisted timers, the cost of waiting, and why a duration is a minimum.
