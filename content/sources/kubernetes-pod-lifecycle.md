---
id: kubernetes-pod-lifecycle
title: Pod Lifecycle
author: Kubernetes documentation
url: https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/
kind: docs
primary: true
---

## Summary

Kubernetes' description of a pod's life, including the "Termination of
Pods" section: how a deleted pod gets SIGTERM (or a configured stop
signal), a grace period (30 s by default), then SIGKILL, and how it is
taken out of service endpoints while it shuts down.

## Key claims

- Graceful termination exists so processes can clean up instead of being killed. "it is important to allow those processes to gracefully terminate when they are no longer needed (rather than being abruptly stopped with a KILL signal and having no chance to clean up)." (Termination of Pods)
- The runtime first sends TERM to the main process in each container, with a grace period. "first sending a TERM (aka. SIGTERM) signal, with a grace period timeout, to the main process in each container." (Termination of Pods)
- Many runtimes send the image's STOPSIGNAL instead of TERM if one is set. "Many container runtimes respect the STOPSIGNAL value defined in the container image" (Termination of Pods)
- When the grace period ends, remaining processes get KILL. "Once the grace period has expired, the KILL signal is sent to any remaining processes" (Termination of Pods)
- The default grace period is 30 seconds. "The default terminationGracePeriodSeconds setting is 30 seconds." (Pod Termination Flow)
- A preStop hook runs before TERM is sent; if it overruns, it gets a one-off 2 s extension. "the kubelet requests a small, one-off grace period extension of 2 seconds." (Pod Termination Flow)
- The preStop hook's time counts against the grace period. "If the preStop hook needs longer to complete than the default grace period allows, you must modify terminationGracePeriodSeconds to suit this." (Pod Termination Flow, note; added in figure review)
- TERM goes to process 1 in each container. "The kubelet triggers the container runtime to send a TERM signal to process 1 inside each container." (Pod Termination Flow)
- At the same time, the control plane starts taking the pod out of service endpoints; terminating endpoints are marked not ready so load balancers stop sending regular traffic. "Terminating endpoints always have their ready status as false" (Pod Termination Flow)
- A shutting-down pod should finish open connections. "Pods that shut down slowly should not continue to serve regular traffic and should start terminating and finish processing open connections." (Pod Termination Flow)

## Visuals worth redrawing

- A timeline: delete -> preStop hook -> SIGTERM -> (endpoint removal in
  parallel) -> grace period ends -> SIGKILL.

## My notes

- Endpoint removal and SIGTERM happen at the same time, not in order, so
  a pod can get new requests after SIGTERM. The page says they happen "at
  the same time"; the exact race isn't spelled out.
