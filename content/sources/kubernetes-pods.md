---
id: kubernetes-pods
title: Pods
author: Kubernetes documentation
url: https://kubernetes.io/docs/concepts/workloads/pods/
kind: docs
primary: true
---

## Summary

The Kubernetes docs page on Pods (docs for Kubernetes 1.37): the smallest
unit Kubernetes deploys, one or more containers sharing a network
namespace and volumes, usually created by a workload resource like a
Deployment from a pod template, and replaced rather than updated.

## Key claims

- Smallest deployable unit. "Pods are the smallest deployable units of computing that you can create and manage in Kubernetes." (intro)
- A Pod's shared context is namespaces and cgroups. "The shared context of a Pod is a set of Linux namespaces, cgroups, and potentially other facets of isolation - the same things that isolate a container." (What is a Pod?)
- One container per Pod is the common case. "model is the most common Kubernetes use case; in this case, you can think of a Pod as a wrapper around a single container" (What is a Pod?)
- Use workload resources, not bare Pods. "Usually you don't need to create Pods directly, even singleton Pods. Instead, create them using workload resources such as Deployment or Job." (Workload resources for managing pods)
- Pods are disposable. "This is because Pods are designed as relatively ephemeral, disposable entities." (Working with Pods)
- A Pod isn't a process. "A Pod is not a process, but an environment for running container(s)." (Working with Pods, note)
- Controllers replace Pods on failed nodes. "For example, if a Node fails, a controller notices that Pods on that Node have stopped working and creates a replacement Pod." (Pods and controllers)
- Changing the template doesn't touch running Pods; new Pods replace them. "Modifying the pod template or switching to a new pod template has no direct effect on the Pods that already exist." (Pod templates)
- Each Pod has an IP; its containers share it and talk over localhost. "Every container in a Pod shares the network namespace, including the IP address and network ports." (Pod networking)
- CPU limits can throttle even with idle CPU. "However, CPU limits can cause throttling even when the node has spare CPU capacity, potentially degrading latency-sensitive workload performance." (Resource requests and limits, note)
- The scheduler places Pods by their requests. "When you specify the resource request for containers in a Pod, the kube-scheduler uses this information to decide which node to place the Pod on." (Resource requests and limits)
- CPU limits throttle, memory limits OOM-kill. "Memory limits are enforced by the kernel with out-of-memory (OOM) kills when a container exceeds its limit." (Resource requests and limits)
- Containers in a Pod can share volumes. "All containers in the Pod can access the shared volumes, allowing those containers to share data." (Storage in Pods)
- CPU limits throttle. "CPU limits are enforced by CPU throttling." (Resource requests and limits)

## Visuals worth redrawing

None.

## My notes

- Requests decide placement; limits are enforced on the node by the
  kernel (cgroups).
