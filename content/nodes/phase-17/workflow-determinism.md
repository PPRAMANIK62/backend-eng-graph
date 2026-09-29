---
id: workflow-determinism
title: Workflow determinism
depth: short
phase: 17
note: >-
  Why workflow code has to make the same choices when it's replayed.
needs: [durable-execution]
leads_to: [workflow-versioning]
compare_with: [replicated-state-machine, deterministic-simulation-testing]
---

# Workflow determinism

In [[durable-execution]], workflow code runs again from the top every
time it resumes, and the engine matches what the code asks for against
the recorded history. So given the same inputs and the same recorded
step results, the code has to make the same calls, in the same order,
with the same arguments. If it doesn't, a replay can take a different
path than the original run, and you get an error or a customer charged
twice.

## Why replay needs the same choices

A workflow is control flow (ifs, loops, local variables) plus calls to
steps that do the real work. On replay, completed steps don't run
again; the engine hands back their recorded results. But all of the
control flow runs again, every time. So it has to be a pure function of
the workflow's inputs and the results of steps already recorded.
Anything else it reads can change between the first run and the
replay.

Temporal checks this strictly. Each call that schedules something (an
activity, a timer, a child workflow) produces a command, and on replay
each command is compared with the event at the same position in the
history. A mismatch fails the workflow with a non-determinism error.

## The promo that charged twice

Here's a small workflow with a bug:

```
function processOrder(order):
    if now() <= order.promo.endDate:
        chargeWithDiscount(order)
    else:
        chargeFullPrice(order)
    sendReceipt(order)
```

The first run happens just before the promo ends. `now()` is before the
end date, so it charges the discounted price, and that step's result is
recorded. Then sending the receipt fails, and the workflow is retried
later, after the promo has ended.

On replay, `now()` returns a later time, and the same `if` takes the
other branch. There's no recorded result for `chargeFullPrice`, so it
runs: the customer is charged a second time. Temporal would stop this
one with a non-determinism error instead, because the command no
longer matches the history.

![Two runs of the same workflow side by side. First run: now() is before the promo end, the if takes the discount branch, chargeWithDiscount runs and its result is recorded, then sendReceipt fails. Replay: now() is after the promo end, the if takes the other branch, chargeFullPrice has no recorded result so it runs, and the customer is charged twice. A note says the fix is to read the time through the engine so the first value is recorded and returned on replay.](img/workflow-determinism-promo.svg)

*The same code, two different decisions. Adapted from Jack Vanlightly, "Demystifying Determinism in Durable Execution" (2025).*

The fix is to make the time a recorded value. The SDKs have
workflow-safe ways to get the time, random numbers and UUIDs: the first
run records the value, and every replay gets the same one back. The
replay then takes the same branch and finds `chargeWithDiscount`
already done.

A subtler version branches on data. The workflow pays with loyalty
points if the customer has enough, and charges the card otherwise. The
first run spends the points, then a later step fails. On replay, a
fresh read shows the points gone, so the card is charged too. Do the
read in a step, and the replay sees what the first run saw.

## What has to go through the engine

Anything whose value can differ between two runs:

- **The clock, randomness and ids.** Use the SDK's versions.
- **Anything outside the process.** Database reads, API calls, the
  file system. These go in steps.
- **Configuration that can change.** Environment variables,
  [[feature-flags|feature flags]], remote config. Read them in a step.
- **Mutable global state,** which other code can change.

The steps themselves don't need to be deterministic. A step that reads
a customer's address should see the current one; its result is recorded
once, so the control flow still sees one value. What steps need is
[[idempotency]], because a step can run again if it finished but its
result wasn't recorded.

One more trap runs the other way. A step's body doesn't run on replay,
so anything it did to variables *outside* itself doesn't happen
either. If a step appends to a list defined in the workflow, the first
run looks fine and a replay leaves the list empty. Have the step return
the value, and update your variables in workflow code.

## Where it gets tricky

**Changing the code is the hard part.** A workflow can outlive several
deploys, and runs that started on old code replay against new code.
Say the old code waits on a timer and then calls an activity, and you
swap the two. A run that's sleeping on the timer
wakes up, replays, and the first thing the new code asks for is the
activity. The history says timer. Non-determinism error.

Some changes are safe. In Temporal, you can change a timer's duration (though not to or from
zero in the Java, Python and Go SDKs) and the inputs, return values and
timeouts of activities. You can't add, remove or reorder calls that
schedule things, or change an activity's type, without a versioning
strategy.

**Changing code needs a plan.** Old runs replay against the new code,
so a breaking change needs a way to keep them on the old path; that's
[[workflow-versioning]].

**Detection isn't guaranteed.** Engines differ. Temporal compares every
command with the history and would flag the promo bug; in the general
model the same bug quietly runs a step that never ran before. Don't
count on the engine to catch it.

## What this means when you build

- Put every read of the outside world in a step, and use the SDK's
  clock, random numbers and UUIDs.
- Return values from steps; don't mutate workflow variables inside
  them.
- Before deploying a change to workflow code, ask whether it adds,
  removes or reorders a step, a timer or a wait. If it does, version
  it.

## Further reading

- [Demystifying Determinism in Durable Execution](https://jack-vanlightly.com/blog/2025/11/24/demystifying-determinism-in-durable-execution), Jack Vanlightly, 2025. Why control flow must be deterministic and side effects need not be, with the promo and loyalty-points bugs.
- [Temporal Workflow Definition](https://docs.temporal.io/workflow-definition), Temporal Technologies. Which calls produce commands, how replay compares them with the history, safe and unsafe code changes, and versioning.
- [Determinism during replay](https://docs.aws.amazon.com/durable-execution/patterns/best-practices/determinism/), Amazon Web Services (Lambda durable functions guide). The full list of non-deterministic sources and the trap of step bodies writing to outer variables.
