---
id: vanlightly-determinism-2025
title: Demystifying Determinism in Durable Execution
author: Jack Vanlightly
url: https://jack-vanlightly.com/blog/2025/11/24/demystifying-determinism-in-durable-execution
kind: blog
primary: false
---

## Summary

Jack Vanlightly's framework-neutral explanation of where durable
execution needs determinism (2025, first post of his "Theory of
Durable Execution" series). The control flow reruns from the top on
every recovery, so it must decide the same way each time; side effects
run once when their result is recorded, so they need idempotency, not
determinism. Two worked double-charge bugs.

## Key claims

- Recovery reruns the function from the top and reuses stored results. "In durable execution, recovery consists of executing the function again from the top, and using the results of previously run side effects if they exist." (1)
- The control flow is rerun in full. "While any stored results of side effects from prior executions are reused, the control flow is executed in full." (3)
- Promo example: now() in a branch sends the replay down the other branch and double charges. "However, on the second invocation, the current time is after the promo end date, causing the else-branch to execute, double charging the customer." (3)
- Fix: make now() a durable step so its value is recorded. "This is fixed by making the now() deterministic by turning it into a durable step whose result is recorded." (3)
- SDKs provide deterministic time, random numbers and UUIDs. "The various SDKs provide deterministic dates, random numbers and UUIDs out of the box." (3)
- Loyalty points example: a branch on a database read changes after the first run's own side effect. "However, the points value of the order was deducted from the customer in the last execution, so that in execution 2, the customer no longer has enough loyalty points!" (3)
- A durable function isn't an atomic transaction. "We must remember that the durable function is not an atomic transaction." (3)
- Control flow must decide on the same state and pass the same arguments each time. "Re-execution of the control flow requires determinism: it must execute based on the same decision state every single time and it must also pass the same arguments to side effect code every single time." (3)
- Side effects need idempotency or duplication tolerance, not determinism. "However, side effects themselves do not need to be deterministic, they only require idempotency or duplication tolerance." (3)
- A completed side effect whose result wasn't stored runs again. "Well, the durable execution framework will replay the function, see no stored result and execute the side effect again." (4)
- Sending an email twice may be acceptable; a card charge must be idempotent. "On the other hand, a credit card payment most definitely should be idempotent." (4)
- Temporal separates control flow and side effects explicitly; Restate and Resonate use functions calling functions. "Other frameworks such as Resonate and Restate are based on functions which can call other functions which can result in a tree of function calls." (Implicit vs explicit)
- The need for determinism comes from recovery by rerunning. "The need for determinism in control flow is a by-product of recovery being based on retries of the function." (Conclusion)
- Frameworks differ; some examples would be a non-determinism error in Temporal. "Some of the examples would actually result in a non-determinism error in Temporal, due to how it records event history and expects a matching replay." (Conclusion)

## Visuals worth redrawing

- The promo flow (first run takes the discount branch, replay takes the
  full-price branch). Redrawn in `workflow-determinism`.

## My notes

- Vocabulary differs: Temporal "workflow/activity", Restate
  "handler/durable step", this post "control flow/side effect".
