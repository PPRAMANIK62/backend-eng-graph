---
id: kubernetes-deployment
title: Deployments (Kubernetes docs)
author: Kubernetes documentation contributors
url: https://kubernetes.io/docs/concepts/workloads/controllers/deployment/
kind: docs
primary: true
---

## Summary

The Kubernetes concept page for Deployments, read for v1.35: how a
Deployment rolls pods from one ReplicaSet to another, the two
strategies, maxSurge and maxUnavailable, revisions and rollback,
progress deadlines and pausing.

## Key claims

- A Deployment moves actual state to desired state at a controlled rate. "You describe a desired state in a Deployment, and the Deployment Controller changes the actual state to the desired state at a controlled rate." (intro)
- Default rolling update keeps at least 75% up. "By default, it ensures that at least 75% of the desired number of Pods are up (25% max unavailable)." (Updating a Deployment)
- And at most 125% in total. "By default, it ensures that at most 125% of the desired number of Pods are up (25% max surge)." (Updating a Deployment)
- It waits for new pods before killing old ones. "It does not kill old Pods until a sufficient number of new Pods have come up, and does not create new Pods until a sufficient number of old Pods have been killed." (Updating a Deployment)
- A stuck new version stops the rollout. "The Deployment controller stops the bad rollout automatically, and stops scaling up the new ReplicaSet." (Rolling Back a Deployment)
- Only a pod template change triggers a rollout; scaling doesn't. "A Deployment's rollout is triggered if and only if the Deployment's Pod template (that is, .spec.template) is changed" (Updating a Deployment)
- Rolling back restores only the pod template. "This means that when you roll back to an earlier revision, only the Deployment's Pod template part is rolled back." (Checking Rollout History)
- Rollback command: `kubectl rollout undo deployment/nginx-deployment`, with `--to-revision=2` for a specific one. (Rolling Back to a Previous Revision)
- History lives in old ReplicaSets, 10 by default. "By default, 10 old ReplicaSets will be kept" (Revision History Limit)
- A stalled rollout is only reported, not fixed. "Kubernetes takes no action on a stalled Deployment other than to report a status condition with reason: ProgressDeadlineExceeded." (Failed Deployment)
- Higher-level tools can act on it. "Higher level orchestrators can take advantage of it and act accordingly, for example, rollback the Deployment to its previous version." (Failed Deployment)
- progressDeadlineSeconds defaults to 600. "This defaults to 600." (Progress Deadline Seconds)
- Recreate kills everything first. "All existing Pods are killed before new ones are created when .spec.strategy.type==Recreate." (Recreate Deployment)
- maxUnavailable rounds down, maxSurge rounds up; both default to 25% and can't both be 0. (Max Unavailable, Max Surge)
- minReadySeconds (default 0) is how long a new pod must be ready without crashing to count as available. "specifies the minimum number of seconds for which a newly created Pod should be ready without any of its containers crashing, for it to be considered available." (Min Ready Seconds)
- A canary is done with a second Deployment. "you can create multiple Deployments, one for each release, following the canary pattern" (Canary deployments)
- A Deployment makes a ReplicaSet, and the ReplicaSet makes the Pods. "The Deployment creates a ReplicaSet that creates three replicated Pods, indicated by the .spec.replicas field." (Creating a Deployment)

## Visuals worth redrawing

- Old and new ReplicaSets trading pods during a rolling update, with the
  surge and unavailable limits.

## My notes

- Terminating pods don't count toward availableReplicas, so a rollout
  can briefly use more than replicas + maxSurge.
