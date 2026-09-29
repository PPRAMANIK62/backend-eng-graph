---
id: azure-durable-orchestrations
title: Durable orchestrations (Azure Durable Functions)
author: Microsoft (Azure Functions docs)
url: https://learn.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-orchestrations
kind: docs
primary: true
---

## Summary

Microsoft's docs for orchestrator functions in Durable Functions and
the Durable Task SDKs, written by the team that builds them. It
explains how an orchestration keeps its state with event sourcing: at
each await the new actions are appended to an execution history and
the function is unloaded; when a result arrives the function reruns
from the start, and completed tasks return their recorded results.
Includes a real history table for a three-activity chain.

## Key claims

- Workflows are ordinary procedural code. "They define workflows by using procedural code. No declarative schemas or designers are needed." (overview list)
- Progress is checkpointed at each await or yield. "They automatically checkpoint execution progress when the function calls an await or yield operator, so the process doesn't lose local state when it recycles or the VM reboots." (overview list)
- An orchestration can run for seconds or months, or forever. "The total lifespan of an orchestration instance can be seconds, days, or months, or you can configure the instance to never end." (overview list)
- User-chosen instance ids map an orchestration to a business entity. "Use user-generated instance IDs for scenarios where there's a one-to-one mapping between an orchestration instance and an external application-specific entity, like a purchase order or a document." (Orchestration identity)
- State is kept by event sourcing in an append-only store. "Instead of directly storing the current state of an orchestration, the Durable Task Framework uses an append-only store to record the full series of actions the function orchestration takes." (Reliability)
- At each await, new actions are committed to storage and the function can be unloaded. "The dispatcher then commits any new actions that the orchestrator function schedules to storage." (Reliability)
- After the commit, the function leaves memory. "At this point, the orchestrator function can be unloaded from memory." (Reliability)
- When there's more work, the function reruns from the start. "the orchestrator wakes up and re-executes the entire function from the start to rebuild the local state." (Reliability)
- During replay, completed activities return their recorded results. "If it finds that the activity already executed and yielded a result, it replays that function's result, and the orchestrator code continues to run." (Reliability)
- Replay stops when the code finishes or asks for new work. "Replay continues until the function code is finished or until it schedules new asynchronous work." (Reliability)
- Orchestrator code must be deterministic. "For the replay pattern to work correctly and reliably, orchestrator function code must be deterministic." (Reliability)
- Replay can duplicate log lines. "If an orchestrator function emits log messages, the replay behavior can cause duplicate log messages to be emitted." (Reliability)
- A checkpoint also enqueues the messages that schedule the work. "Enqueues messages for functions the orchestrator wants to invoke." (Orchestration history)
- Local variables come back as a side effect of replay. "After the current execution history is replayed, the local variables are restored to their previous values." (Orchestration history)
- The Azure Storage provider has no transaction between its tables and queues. "Azure Storage doesn't provide any transactional guarantees about data consistency between table storage and queues when it saves data." (Orchestration history)
- The history table for the three-city example has event types ExecutionStarted, OrchestratorStarted, TaskScheduled, OrchestratorCompleted, TaskCompleted and ExecutionCompleted, one TaskScheduled/TaskCompleted pair per activity. (History table)
- Use durable timers, not language sleep. "Use durable timers in orchestrator functions instead of language-native sleep APIs." (Features and patterns, durable timers)
- Activities can have retry policies. "the specified retry policy can automatically delay and retry the execution up to a specified number of times." (Features and patterns, error handling)
- A failed instance can't be retried. "You can't retry an orchestration instance after it fails." (Features and patterns, error handling)
- Orchestrators can't do I/O; wrap it in an activity. "To work around this limitation, wrap any code that needs to perform I/O operations in an activity function." (Calls to HTTP endpoints)

- Storage providers are pluggable. "You can use any of the available storage providers as runtime state store." (Reliability)
- Other providers are stronger than Azure Storage. "Alternative storage providers offer stronger consistency guarantees" (Orchestration history)
- An unhandled exception fails the instance. "If there's an unhandled exception in an orchestrator function, the orchestration instance finishes in a Failed state." (Features and patterns, error handling)
- Replay-safe logging exists for the duplicate log problem. "To learn why this behavior occurs and how to work around it, see Replay-safe logging." (Reliability)
- A response or an expired timer wakes the orchestrator. "When an orchestration function gets more work to do (for example, a response message is received or a durable timer expires), the orchestrator wakes up and re-executes the entire function from the start to rebuild the local state." (Reliability)
- Checkpoints also enqueue timer messages for the orchestrator itself. "Enqueues messages for the orchestrator itself, such as durable timer messages." (Orchestration history)
- Orchestrations can wait for external events, such as a human's input. "This Durable Functions feature is often useful for handling human interactions or other external callbacks." (Features and patterns, external events)

## Visuals worth redrawing

- The history table (event type per row). Used as the model for the
  history column in the `durable-execution` replay figure.

## My notes

- Terms: orchestrator function = workflow code, activity function =
  step.
