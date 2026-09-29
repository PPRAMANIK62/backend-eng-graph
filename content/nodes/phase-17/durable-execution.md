---
id: durable-execution
title: Durable execution
depth: deep
phase: 17
note: >-
  Workflows that survive crashes by recording each step's result and
  replaying the history. Temporal, Restate, DBOS.
needs: [event-sourcing, idempotency-keys, replicated-state-machine, orchestration-vs-choreography]
leads_to: [workflow-determinism, durable-timers]
compare_with: [sagas, background-jobs, long-running-operations]
---

# Durable execution

Durable execution lets you write a long, multi-step process as an
ordinary function, and makes that function survive crashes. The
runtime records the result of every step in a durable log. If the
process dies halfway, the function runs again from the top, gets the
recorded results back for the steps that already finished, and carries
on from the first step that didn't. Temporal, Restate, DBOS and Azure
Durable Functions all work this way.

## The problem with a plain function

Take an order that needs three things done: charge the card, reserve
the stock, send a confirmation email. As code, it's three calls in a
row:

```
function placeOrder(order):
    receipt = chargeCard(order)
    reserveStock(order)
    sendEmail(order, receipt)
```

Run this in a normal process and it's fragile. If the machine dies
after the charge and before the stock reservation, the fact that the
card was charged lived only in memory, and it's gone. Retrying the
whole function charges the card again. That's the limit of
[[background-jobs]]: a job is retried as a whole, so its early steps
repeat.

Without an engine, you'd turn the function into a state machine by hand:
store a status column after each step, have a worker pick up rows in
each status, and write the next step for each. It works, but the flow
you wrote as three lines is now scattered across tables and handlers.
Durable execution lets you keep the three lines.

## Record each step, replay the rest

A durable execution engine splits your code in two:

- **Workflow code** is the function above, the control flow. It
  decides which step comes next. It doesn't do any I/O itself.
- **Steps** do the real work: charge the card, call the stock service,
  send the email. Temporal calls them activities; DBOS and Restate call
  them steps; Azure calls the workflow an orchestrator and the steps
  activity functions.

This is orchestration, in the sense of [[orchestration-vs-choreography]]:
the workflow code is the orchestrator, calling each step and deciding
what comes next. What durable execution adds is an orchestrator whose
memory survives a crash.

When the workflow calls a step, the call doesn't run the step
directly. It goes to the engine, which records that the step was
scheduled, has it run, and appends its result to a per-workflow
history. The history is append-only. Azure's engine, for one, doesn't
store the workflow's current state at all, only the list of things
that happened. That's [[event-sourcing]] applied to one function call.

Between steps, the workflow doesn't need to stay in memory. Azure's
runtime unloads the orchestrator after each checkpoint. When the next
result arrives, it runs the whole function again from the start. Each
step call now checks the history first:

- If the history already has a result for this step, the call returns
  that result at once and the step doesn't run.
- If it doesn't, this is new work: the engine schedules the step, and
  the workflow stops there until it has a result.

So the function races through the steps it has already done, using
recorded results, and does real work only at the frontier. Its local
variables come back as a side effect, because the same code assigns
them from the same results. This rerun is called **replay**.

![Three columns. Left, the workflow code: chargeCard, reserveStock, sendEmail. Right, the history for one run: WorkflowStarted, chargeCard scheduled, chargeCard completed with result r-17, reserveStock scheduled, then a line where the worker crashed. Middle, the replay after the crash: chargeCard returns r-17 from the history and does not run; reserveStock has no recorded result, so it runs now; sendEmail runs next. Their events (reserveStock completed, sendEmail scheduled, sendEmail completed, WorkflowCompleted) are appended to the history below the crash line.](img/durable-execution-replay.svg)

*A crash after the first step. On replay, completed steps return their recorded results and only the missing ones run. The history events are modelled on the history table in Microsoft's "Durable orchestrations" docs.*

The same thing happens after a crash. DBOS, on startup, looks for
workflows still marked `PENDING`, calls each one again with its
recorded inputs, and before each step checks whether that step's
output is already stored. The first step with no stored output is
exactly where the crash hit. Temporal describes the same idea as
commands and events. Workflow API calls, like starting an activity or
a timer, produce commands; the service records what it did as events;
and on replay the new commands are checked against the events already
in the history.

If this sounds like a [[replicated-state-machine]], it is one, across
time instead of across machines. Given the same inputs and the same
recorded step results, the workflow code has to reach the same state
every time it runs. That's why the workflow code has strict rules,
covered in [[workflow-determinism]]: no reading the clock, no random
numbers, no I/O outside a step.

## Steps can still run twice

The history records a step's result only after the step returns. So
there's a window: the step finishes its work (the card is charged),
and the worker crashes before it reports back. The history shows no
result, so the engine runs the step again.

This is why durable execution engines say "exactly once" carefully.
Temporal's guarantee is that an activity is *observed* as completed
exactly once: the workflow sees one result. The activity itself may
run more than once, even partly more than once. What's exactly once
is the recording, not the side effect.

So every step that changes something outside needs [[idempotency]].
The usual tool is [[idempotency-keys]]: pass a key to the service you
call, and let that service drop duplicates. The key has to be the same
on every retry and different for every workflow. Temporal suggests
combining the workflow's run id with the activity's id, which has
exactly those properties. Restate also deduplicates whole requests
that carry an idempotency key.

A retried step also reruns everything inside it. If one step does a
database lookup, a service call and a file write, and the write fails,
the retry repeats all three. Smaller steps retry less, at the cost of a
longer history.

## Where the history lives

Every engine needs somewhere durable to keep histories and something
to notice runs that stopped. They split the work differently.

**A separate service.** Temporal runs a service that stores each
workflow's event history. When a workflow schedules an activity, the
service puts a task on a task queue, and your workers poll that queue
and run the activity. Workers keep recently used workflows in a cache,
so they usually carry on without replaying from scratch; if a workflow
is evicted from the cache, the next worker replays its history.

**A server in front of your code.** Restate's server sits in front of
your services like a reverse proxy or a message broker. It keeps a
journal of every step and its result, and replays the journal when a
handler fails. It can run as a cluster, which uses [[consensus]] and
needs a majority of nodes up to accept new entries.

**A library and your database.** DBOS has no separate server. It's a
library that writes checkpoints to Postgres: one write when a workflow
starts (its inputs), one per step (its output) and one when it
finishes. That's the whole overhead, which makes the cost easy to
reason about.

Azure Durable Functions sits between these: a framework inside your
function app, with a choice of storage providers. Its Azure Storage
provider has no transaction across its tables and queues, so it relies
on eventual consistency patterns to stay correct; other providers give
stronger guarantees.

Whichever you pick, the engine is now part of every workflow's
critical path. If its storage is down, no workflow moves.

## Waiting is cheap

Because a workflow between steps is just a history on disk, it can
wait a long time at no cost: for a human to approve something, for an
outside event, or on a timer. Azure orchestrations can live for
seconds, days or months, or never end. Temporal puts no time limit on
a workflow at all. Sleeping inside a workflow is its own concept; see
[[durable-timers]].

## Where it gets tricky

**It's not a transaction.** A durable function makes progress
reliably, but its steps commit one by one. If step three fails for
good, steps one and two have already happened. You still need
compensations, the way a [[sagas|saga]] does. Durable execution is a
good way to *run* a saga, since the orchestrator's progress survives
crashes, but it doesn't give you rollback.

**Histories grow.** Every step adds events, and replay reads them all.
Temporal warns once a history passes 10,240 events and terminates the
workflow past 51,200. A workflow that loops forever, or processes a
huge batch, has to start over with a fresh history from time to time
(Temporal calls this Continue-As-New). Step outputs are stored too, so
a step that returns a large file makes large writes; DBOS suggests
storing the file in [[object-storage]] and returning a pointer.

**Every step is a durable write.** Checkpointing isn't free. In
Temporal, a workflow with two sequential activities and no retries
records 11 state transitions. Wrapping every tiny operation in its own
step multiplies that cost.

**Changing code breaks running workflows.** A workflow started last
month replays against today's code. If you added, removed or reordered
a step, its history no longer matches. This is the hardest operational
part of durable execution, covered in [[workflow-determinism]].

**Outages stop being failures.** The engine keeps a workflow's state
through worker and server outages and resumes it afterwards, so a
workflow can stall during an outage and then finish as if nothing
happened. What does fail a workflow is its own code: in Azure, an
unhandled exception ends the instance in a Failed state, and a failed
instance can't be retried. Handle the errors you expect inside the
workflow.

**Logs repeat.** Workflow code runs on every replay, so a
plain log line in it prints again each time. Azure offers
replay-safe logging for that reason.

**Job queue or workflow engine?** Both run work in the background and
retry. A [[background-jobs|job]] is one unit retried as a whole, and
that's fine when the work is one step or when repeating it is
harmless. Once a task has several steps that must each happen once, in
order, with waits between them, a workflow engine saves you from
hand-writing the state machine.

## What this means when you build

- Put every piece of I/O in a step. Keep workflow code to decisions
  and calls to steps.
- Make every step idempotent, and pass a stable idempotency key (run id
  plus step id) to anything it calls.
- Size steps so a retry repeats only what failed, without making
  thousands of tiny ones.
- Keep step inputs and outputs small. Store large data elsewhere and
  pass references.
- Plan for code changes from day one: versioning or patching, and
  tests that replay real histories against new code (Temporal's SDKs
  have replay APIs for this).
- Design compensations for the steps that can fail for good. The engine
  keeps the workflow going; it can't undo what already happened.
- Watch history length on long-lived workflows and restart them with
  fresh histories before they hit limits.

## Further reading

- [Durable orchestrations](https://learn.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-orchestrations), Microsoft (Azure Functions docs). The clearest walk-through of event sourcing and replay in a workflow engine, with a real history table.
- [Temporal Workflow Execution](https://docs.temporal.io/workflow-execution), Temporal Technologies. Replay, commands and events, state transitions per activity, and the worker cache.
- [Events and Event History](https://docs.temporal.io/workflow-execution/event), Temporal Technologies. What goes into a history, how activities reach workers through task queues, and history size limits.
- [Temporal Activity Definition](https://docs.temporal.io/activity-definition), Temporal Technologies. Why activities can run more than once, and using run id plus activity id as an idempotency key.
- [DBOS Architecture](https://docs.dbos.dev/architecture), DBOS. Durable execution as a library on Postgres: checkpoints, recovery, the write cost per step.
- [Key concepts](https://docs.restate.dev/foundations/key-concepts), Restate. A server in front of your services that journals each step and replays the journal.
