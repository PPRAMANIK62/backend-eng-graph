---
id: azure-durable-versioning
title: Versioning in Durable Functions (Azure)
author: Microsoft
url: https://learn.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-versioning
kind: docs
primary: true
---

## Summary

Which code changes break running Durable Functions orchestrations, and
the strategies for deploying them: built-in orchestration versioning,
side-by-side deployments, or stopping in-flight instances.

## Key claims

- What counts as breaking: signature changes. "Did you change the name, input type, or output type of an activity or entity function?" (Before deploying)
- Adding, removing or reordering calls. "Did you add, remove, or reorder calls to activities, sub-orchestrations, timers, or external events in orchestrator code?" (Before deploying)
- Removing a function old instances still call. "Did you rename or remove a function that in-flight orchestrations might still call?" (Before deploying)
- Why it breaks. "changes to function code affect both new and existing function orchestrations." (Types of breaking changes)
- Doing nothing fails in several ways. "can cause orchestrations to fail with nondeterministic orchestration errors, get stuck indefinitely in a Running status, or trigger low-level runtime failures that degrade performance." (Mitigation strategies)
- Built-in versioning: a version per instance. "Each orchestration instance gets a version permanently associated with it when created." (Orchestration versioning)
- Code can branch on it. "Orchestrator functions can examine their version and branch execution accordingly, keeping old and new code paths in the same codebase." (Orchestration versioning)
- Old workers don't run new instances. "The runtime prevents workers running older orchestrator function versions from executing orchestrations of newer versions." (Orchestration versioning)
- Side-by-side deployments isolate fully. "Apps that can't use orchestration versioning, or that need full isolation via separate task hubs or storage accounts." (strategy table)
- Stopping in-flight instances is for prototypes. "Prototyping and local development where losing in-flight orchestrations is acceptable." (strategy table)

## Visuals worth redrawing

None.

## My notes

- Azure docs, current when read.
