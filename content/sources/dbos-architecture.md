---
id: dbos-architecture
title: DBOS Architecture
author: DBOS, Inc.
url: https://docs.dbos.dev/architecture
kind: docs
primary: true
---

## Summary

DBOS's architecture page. DBOS is a library, not a server: it
checkpoints workflow inputs and step outputs to a Postgres database,
and after a crash reruns each unfinished workflow, returning
checkpointed outputs for completed steps. Covers its cost per step,
recovery, the two rules your code must follow, and upgrades.

## Key claims

- A library that checkpoints workflows and steps to Postgres. "While your application runs, DBOS checkpoints those workflows and steps to a Postgres database." (intro)
- No separate orchestration server. "There's no separate orchestration server and no infrastructure required besides Postgres." (intro)
- Cost: one write per step, two per workflow. "The only overhead DBOS adds is database writes: one database write per step (to checkpoint the step's outcome) plus two additional database writes per workflow (one at the beginning to checkpoint workflow inputs, one at the end to checkpoint the workflow outcome)." (How DBOS Scales)
- Large step outputs mean large writes; return pointers instead. "we recommend architecting steps to avoid large output sizes (for example, store large files in cloud blob storage like S3 and have steps return pointers to those files)." (How DBOS Scales)
- On a single node, recovery finds PENDING workflows at startup. "In single-node deployments, this happens automatically at startup when DBOS scans for incomplete (PENDING) workflows." (How Workflow Recovery Works, step 1)
- A recovering workflow checks each step for a checkpoint before running it. "As the workflow re-executes, it checks before each step if that step's output is checkpointed in Postgres." (step 2)
- The first step without a checkpoint is where the crash happened. "Eventually, the recovered workflow reaches a step with no checkpoint. This marks the point where the original execution failed." (step 3)
- Rule one: the workflow function must be deterministic. "if executed multiple times, with the same arguments and step return values, the workflow should invoke the same steps with the same inputs in the same order." (How Workflow Recovery Works, requirement 1)
- Rule two: steps should be idempotent; a checkpointed step never reruns. "However, once a step completes and is checkpointed, it is never re-executed." (How Workflow Recovery Works, requirement 2)
- A breaking change is a change in which steps run or their order. "A breaking change to a workflow is any change in what steps run or the order in which steps run." (Upgrading Workflow Code)
- Two upgrade strategies: patching and versioning. "DBOS supports two strategies for safely upgrading workflow code: patching and versioning." (Upgrading Workflow Code)
- Workers poll durable queues. "All processes running DBOS periodically poll queues to find and execute new work." (Durable Queues)

- Recovery calls each interrupted workflow again with its checkpointed inputs. "Next, DBOS restarts each interrupted workflow by calling it with its checkpointed inputs." (How Workflow Recovery Works, step 2)
- Clock, randomness, database and API calls go in steps. "If you need to perform any non-deterministic operation like accessing the database, calling a third-party API, generating a random number, or getting the local time, you should do it in a step instead of directly in the workflow function." (How Workflow Recovery Works, requirement 1)

## Visuals worth redrawing

- The architecture diagram (app servers + Postgres, no orchestrator
  server). Not redrawn.

## My notes

- The page also claims >40K workflows or steps per second on one
  Postgres in the vendor's benchmarks; left out, no setup given.
