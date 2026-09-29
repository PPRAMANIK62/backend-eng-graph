---
id: temporal-workflow-execution
title: Temporal Workflow Execution
author: Temporal Technologies
url: https://docs.temporal.io/workflow-execution
kind: docs
primary: true
---

## Summary

Temporal's docs page for a Workflow Execution: what makes it durable,
what a replay is, how workflow code turns API calls into Commands
that the Temporal Service records as Events, the open and closed
states, and the worker-side cache that avoids replaying from scratch.

## Key claims

- A workflow execution runs its code effectively once, however long it takes. "A Workflow Execution is durable because it executes a Temporal Workflow Definition (also called a Temporal Workflow Function), your application code, effectively once and to completion—whether your code executes for seconds or years." (Durability)
- It recovers from failures and resumes from the latest state. "The Temporal Platform ensures the state of the Workflow Execution persists in the face of failures and outages and resumes execution from the latest state." (Reliability)
- Replay is how an execution makes progress; its commands are checked against the history. "During a Replay the Commands that are generated are checked against an existing Event History." (Replays)
- After a failure it picks up at the last recorded event. "If a failure occurs, the Workflow Execution picks up where the last recorded event occurred in the Event History." (Replays)
- Workflow code can only block on awaitables the SDK provides. "A Workflow Execution may only ever block progress on an Awaitable that is provided through a Temporal SDK API." (Commands and awaitables)
- A command is a requested action sent to the service; the service records what it did as an event. "A Command is a requested action issued by a Worker to the Temporal Service after a Workflow Task Execution completes." (Command)
- Two sequential activities cost 11 state transitions, each recorded. "For example, a simple Workflow with two sequential Activity Tasks (and no retries) produces 11 State Transitions: two for Workflow start, four for each Activity, and one for Workflow completion." (State Transition)
- Each state transition is persisted. "Each State Transition is recorded in a persistence store." (State Transition)
- Workers cache workflow state so they don't replay from scratch every time. "This allows the Worker to continue processing subsequent Tasks for that Workflow without having to fetch the full Event History from the server and replay it from scratch." (Workflow Cache)
- If the cached state is evicted, the worker replays. "If the cached Workflow is evicted, to make room for another for example, the Worker must replay the Event History to restore its state before continuing." (Workflow Cache)
- The SDKs have replay APIs. "How to use Replay APIs using the Go SDK" (Replays, list of SDK guides)

## Visuals worth redrawing

- The command-to-event diagram. Not redrawn.

## My notes

- Page is unversioned; read when Temporal's docs covered SDKs in Go,
  Java, PHP, Python, Ruby, Rust, TypeScript and .NET.
