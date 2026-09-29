---
id: kubernetes-scheduler
title: Kubernetes Scheduler
author: Kubernetes documentation
url: https://kubernetes.io/docs/concepts/scheduling-eviction/kube-scheduler/
kind: docs
primary: true
---

## Summary

How kube-scheduler places Pods (docs for Kubernetes 1.37): it watches for
Pods with no node, filters out nodes that can't run the Pod, scores the
rest, picks the highest, and tells the API server (binding).

## Key claims

- The scheduler watches for unassigned Pods. "A scheduler watches for newly created Pods that have no Node assigned." (Scheduling overview)
- You can replace it. "kube-scheduler is designed so that, if you want and need to, you can write your own scheduling component and use that instead." (kube-scheduler)
- No feasible node means the Pod waits. "If none of the nodes are suitable, the pod remains unscheduled until the scheduler is able to place it." (kube-scheduler)
- Binding is telling the API server. "The scheduler then notifies the API server about this decision in a process called binding." (kube-scheduler)
- Two steps. "kube-scheduler selects a node for the pod in a 2-step operation:" (Node selection in kube-scheduler)
- Filtering checks resource requests. "the PodFitsResources filter checks whether a candidate Node has enough available resources to meet a Pod's specific resource requests." (Node selection in kube-scheduler)
- Ties are broken at random. "If there is more than one node with equal scores, kube-scheduler selects one of these at random." (Node selection in kube-scheduler)
- Filter, then score, then pick the highest. "The scheduler finds feasible Nodes for a Pod and then runs a set of functions to score the feasible Nodes and picks a Node with the highest score among the feasible ones to run the Pod." (kube-scheduler)

## Visuals worth redrawing

None.

## My notes

- Filtering uses requests, not actual usage. The page says "resource
  requests"; it doesn't discuss usage.
