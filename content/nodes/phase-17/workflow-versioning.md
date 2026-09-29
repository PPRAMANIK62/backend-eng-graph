---
id: workflow-versioning
title: Workflow versioning
depth: short
phase: 17
note: >-
  Changing workflow code while old runs are still in flight: patches,
  version markers and pinned workers.
needs: [workflow-determinism]
leads_to: []
compare_with: []
---

# Workflow versioning

A [[durable-execution|durable workflow]] can run for days or months, and
the engine rebuilds its state by replaying its code against its recorded
history. So a deploy doesn't just affect new runs: every run still in
flight will replay the new code against a history written by the old
code. If the new code makes different calls, the replay no longer
matches ([[workflow-determinism]]). Workflow versioning is how you ship
changes anyway.

## What counts as a breaking change

Azure's Durable Functions docs give a checklist that holds for any such
engine. A change is breaking if you:

- change the name, input type or output type of an activity or entity;
- add, remove or reorder calls to activities, sub-workflows, timers or
  waits for external events in the workflow code;
- rename or remove a function that running workflows might still call.

Deploy one of these with no plan and running workflows can fail with
non-determinism errors, get stuck in a running state forever, or hit
low-level runtime failures that drag down performance.

## Three strategies

**1. Branch inside the code (patching).** Temporal's `GetVersion` works
like a feature flag that the engine remembers. The first time a run
reaches it, the engine records a marker in that run's history with the
version number. Every later replay of that run reads the marker and
takes the same branch:

```go
v := workflow.GetVersion(ctx, "Step1", workflow.DefaultVersion, 1)
if v == workflow.DefaultVersion {
    // old path: runs started before the change took this branch
    workflow.ExecuteActivity(ctx, ActivityA, data)
} else {
    // new path
    workflow.ExecuteActivity(ctx, ActivityC, data)
}
```

Runs that started before the change have no marker, get the default
version and keep the old path; new runs record version 1 and take the
new one. Old code paths stay in the codebase until the last old run has
finished. Keeping the first `GetVersion` call even after removing the
old branch makes any straggling old run fail loudly instead of
continuing on the wrong path. Azure's built-in orchestration versioning
is similar: each instance gets a version when it's created, and
orchestrator code can branch on it.

**2. Keep old code running on old workers.** Tag each set of workers
with the code version it runs, and let the engine send each workflow to
workers with the version it started on. Temporal calls this Worker
Versioning and pins workflows to deployment versions, so no branches are
needed in the code. Azure's runtime likewise stops workers running older
code from picking up instances created by newer versions. The cost is
running more than one version of the workers until old runs drain.

**3. Start a new workflow type.** Copy the workflow under a new name and
register both. New runs use the new name; old runs finish on the old
one. It works because incompatible changes only affect open runs of the
same type. Heavier variants deploy the new version side by side with
separate storage.

Stopping all in-flight runs and redeploying is a fourth option, fine for
prototypes, where losing running workflows doesn't matter.

## Where it gets tricky

**Some changes look harmless.** Adding one log statement that calls an
activity, or a timer, is a breaking change. Reordering two calls is a
breaking change even if both still happen.

**Old branches pile up.** Every patch leaves a branch that must stay
until no run can need it. With long-running workflows that can be a long
time, so track which versions still have open runs.

**Test with real histories.** Since the failure only shows up when an
old history meets new code, replay some recorded histories against the
new code before you deploy it.

## What this means when you build

- Treat every change to workflow code as potentially breaking, and check
  it against the list above.
- Pick one strategy per team: worker versioning if you can run several
  worker versions, patching if you can't.
- Replay saved histories in CI.
- Keep workflows short-lived where you can; long ones make every
  deploy harder.

## Further reading

- [Versioning](https://docs.temporal.io/develop/go/versioning), Temporal Go SDK docs. Patching with GetVersion, Worker Versioning, and cutting over to a new workflow type.
- [Versioning in Durable Functions](https://learn.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-versioning), Microsoft Azure docs. The breaking-change checklist, what happens with no plan, and orchestration versioning.
