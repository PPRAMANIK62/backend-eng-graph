---
id: temporal-go-versioning
title: Versioning (Temporal Go SDK documentation)
author: Temporal Technologies
url: https://docs.temporal.io/develop/go/versioning
kind: docs
primary: true
---

## Summary

How to change Temporal workflow code while executions are still
running: patching with GetVersion (a recorded branch per change),
Worker Versioning (old workers keep old code), or copying the workflow
under a new name.

## Key claims

- What a patch is. "A Patch defines a logical branch in a Workflow for a specific change, similar to a feature flag." (Patching with GetVersion)
- What it does. "It applies a code change to new Workflow Executions while avoiding disruptive changes to in-progress Workflow Executions." (Patching with GetVersion)
- GetVersion records a marker so later replays take the same branch. "When workflow.GetVersion() is run for the new Workflow Execution, it records a marker in the Event History so that all future calls to GetVersion for this change Id" (Patching with GetVersion)
- Worker Versioning runs old code on old workers. "The Worker Versioning feature allows you to tag your Workers and programmatically roll them out in versioned deployments, so that old Workers can run old code paths and new Workers can run new code paths." (Versioning methods)
- The cutover option: a new workflow type. "you can avoid determinism errors by creating a whole new Workflow when making changes." (Workflow cutovers)
- Why: only open executions of the same type are affected. "Since incompatible changes only affect open Workflow Executions of the same type" (Workflow cutovers)
- Keep the first GetVersion call so leftover old executions fail loudly. "This ensures that if there is a Workflow Execution still running for an older version, it will fail here and not proceed." (Patching with GetVersion)

## Visuals worth redrawing

None.

## My notes

- The page warns that an older experimental Worker Versioning is being
  removed from the server; the current Worker Versioning is different.
