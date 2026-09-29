---
id: opengitops-principles
title: OpenGitOps, GitOps Principles v1.0.0
author: OpenGitOps (CNCF GitOps Working Group)
url: https://opengitops.dev/
kind: spec
primary: true
---

## Summary

The four GitOps principles, version 1.0.0, as published by the
OpenGitOps project: desired state is declarative, versioned, pulled by
agents and continuously reconciled.

## Key claims

- Declarative. "A system managed by GitOps must have its desired state expressed declaratively." (principle 1)
- Versioned and immutable. "Desired state is stored in a way that enforces immutability, versioning and retains a complete version history." (principle 2)
- Pulled automatically. "Software agents automatically pull the desired state declarations from the source." (principle 3)
- Continuously reconciled. "Software agents continuously observe actual system state and attempt to apply the desired state." (principle 4)

## Visuals worth redrawing

None.

## My notes

- The principles don't name Git or any tool; Argo CD and Flux are the
  usual implementations but weren't opened.
