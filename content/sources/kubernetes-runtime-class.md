---
id: kubernetes-runtime-class
title: Runtime Class (Kubernetes documentation)
author: The Kubernetes Authors
url: https://kubernetes.io/docs/concepts/containers/runtime-class/
kind: docs
primary: true
---

## Summary

RuntimeClass lets a pod choose which container runtime configuration
runs it, for example a sandboxed runtime for untrusted work (Kubernetes
1.37 docs).

## Key claims

- What it is. "RuntimeClass is a feature for selecting the container runtime configuration." (intro)
- Why: trade performance against security. "You can set a different RuntimeClass between different Pods to provide a balance of performance versus security." (Motivation)
- Example: hardware virtualization for sensitive pods. "you might choose to schedule those Pods so that they run in a container runtime that uses hardware virtualization." (Motivation)
- The cost. "You'd then benefit from the extra isolation of the alternative runtime, at the expense of some additional overhead." (Motivation)
- Classes map to a handler configured in the CRI runtime. "The configurations have a corresponding handler name, referenced by the RuntimeClass." (Setup)
- A pod picks one by name. "you can specify a runtimeClassName in the Pod spec to use it." (Usage)
- Overhead can be declared so the scheduler accounts for it. "Declaring overhead allows the cluster (including the scheduler) to account for it when making decisions about Pods and resources." (Pod Overhead)

## Visuals worth redrawing

None.

## My notes

- Kubernetes 1.37 docs.
