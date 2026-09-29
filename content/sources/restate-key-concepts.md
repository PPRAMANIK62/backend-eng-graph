---
id: restate-key-concepts
title: Key concepts (Restate docs)
author: Restate
url: https://docs.restate.dev/foundations/key-concepts
kind: docs
primary: true
---

## Summary

Restate's overview of its architecture. Services embed the Restate
SDK; a Restate Server sits in front of them like a reverse proxy,
records every step of each invocation in a journal, and replays the
journal after a failure. The server can run as a cluster that uses
consensus for its log.

## Key claims

- The server sits in front of services, like a proxy or broker. "The Restate Server sits in front of your services, similar to a reverse proxy or message broker." (Restate Server)
- It's one Rust binary built on stream processing. "The server is a single binary written in Rust with a stream-processing architecture for low latency and high throughput." (Restate Server)
- Every step and its result goes in a journal. "When you call other services, update databases, set timers, or perform any side-effecting operation, Restate records both the operation and its result." (Durable execution, how it works)
- On a crash it replays the journal and skips completed steps. "If your function crashes or fails, Restate replays the journal, skipping completed steps and resuming from exactly where it left off." (Durable execution, how it works)
- Idempotency keys on requests deduplicate them. "If you add an idempotency key to your request headers, Restate will automatically ensure that requests are deduplicated." (Durable execution, what it covers)
- The cluster needs a majority, via consensus. "The consensus algorithm requires a majority of nodes to be available, so if a network partition occurs, the cluster will still be able to process requests as long as a majority can still communicate." (Durable execution, what it covers)
- On serverless platforms, handlers can be suspended while waiting. "This lets you run long-running workflows on FaaS platforms without paying for wait time." (Suspensions on FaaS)

## Visuals worth redrawing

- The application structure diagram (clients, Restate Server,
  services). Not redrawn.

## My notes

- The old URL docs.restate.dev/concepts/durable_execution redirects
  here.
- "ensuring it runs exactly once regardless of failures" is the page's
  claim about invocations; side effects inside still need idempotency
  in the crash window (see temporal-activity-definition).
