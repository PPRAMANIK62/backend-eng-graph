---
id: kubernetes-api-conventions
title: API Conventions
author: Kubernetes SIG Architecture (kubernetes/community repository)
url: https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api-conventions.md
kind: docs
primary: true
---

## Summary

The conventions every Kubernetes API type follows. The part used here is
spec and status: spec is what you want, status is what the system has
observed, and the system drives toward the latest spec without replaying
the steps in between (level-based, not edge-based).

## Key claims

- The system works toward the latest spec. "Over time the system will work to bring the `status` into line with the `spec`." (Spec and Status)
- Intermediate values can be skipped. "if a value is changed from 2 to 5 in one PUT and then back down to 3 in another PUT the system is not required to 'touch base' at 5 before changing the `status` to 3." (Spec and Status)
- Level-based, which survives missed changes. "This enables robust behavior in the presence of missed intermediate state changes." (Spec and Status)
- Spec fields name the desired state, not actions. "they represent the desired state, not actions intended to yield the desired state." (Spec and Status)
- Conditions are observations, not state machines. "The system is level-based rather than edge-triggered, and should assume an Open World." (Typical status properties)

## Visuals worth redrawing

None.

## My notes

- Spec and status can have separate permissions: users write spec,
  controllers write status.
