---
id: aws-durable-determinism
title: Determinism during replay (AWS Durable Execution SDK Developer Guide)
author: Amazon Web Services
url: https://docs.aws.amazon.com/durable-execution/patterns/best-practices/determinism/
kind: docs
primary: true
---

## Summary

AWS's guide to determinism for Lambda durable functions. The handler
runs from the top on every invocation; completed steps return their
checkpointed results; everything outside a step must be a pure
function of the inputs and completed results. Includes the trap of a
step body writing to outer variables.

## Key claims

- Durable functions checkpoint and stop running while they wait. "The Durable Execution SDK checkpoints your code so that it can terminate the current invocation and not consume compute while it waits for a timed duration or processing result to be ready." (intro)
- The handler reruns from the top; completed steps return checkpoints. "A step that completed in an earlier invocation returns its checkpointed result on replay without re-executing the code inside the step." (intro)
- Code outside steps must be pure. "Any code that is not inside a durable operation must be a pure function of the handler inputs and the results of completed operations." (intro)
- The list of non-deterministic sources. "Anything that depends on wall-clock time, a random source, an external service, the local file system, or mutable global state is non-deterministic and must run inside a durable operation." (intro)
- A random id outside a step changes on replay and can double charge. "Without the wrapper, UUID.randomUUID() would produce a new value on every replay and the downstream step would either double-charge or hit an idempotency error from the payment service." (Non-deterministic code must be in a durable operation)
- A step body's writes to outer variables are lost on replay. "Replay discards any state a step body writes to variables outside itself through a closure, because the write happens inside the body and the body does not run." (Return values)
- Feature flags and remote config can change between runs; read them in a step. "Feature flags, environment variables read at runtime, and configuration pulled from a remote store could all change between the first invocation and a replay." (Stable branches)

## Visuals worth redrawing

None.

## My notes

- Lambda durable functions are the newest of the engines looked at
  here; the guide was read in the version current when this was
  written.
