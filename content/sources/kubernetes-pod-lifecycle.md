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
- A Pod is scheduled once and never moved; it's replaced by a new Pod with a new UID. "instead, that Pod can be replaced by a new, near-identical Pod." (Pod lifetime; added for the kubernetes node)
- Scheduling happens once per Pod. "Pods are only scheduled once in their lifetime; assigning a Pod to a specific node is called binding, and the process of selecting which node to use is called scheduling." (Pod lifetime)
- Container restarts back off exponentially up to 5 minutes. "After containers in a Pod exit, the kubelet restarts them with an exponential backoff delay (10s, 20s, 40s, …), that is capped at 300 seconds (5 minutes)." (Container restarts)
- CrashLoopBackOff is what kubectl shows while the restart backoff is in effect. "When a pod is failing to start repeatedly, CrashLoopBackOff may appear in the Status field of some kubectl commands." (Pod lifetime)
- A shutting-down pod should finish open connections. "Pods that shut down slowly should not continue to serve regular traffic and should start terminating and finish processing open connections." (Pod Termination Flow)
- Endpoint removal starts at the same time as shutdown. "At the same time as the kubelet is starting graceful shutdown of the Pod, the control plane evaluates whether to remove that shutting-down Pod from EndpointSlice objects" (Pod Termination Flow)

## Visuals worth redrawing

- A timeline: delete -> preStop hook -> SIGTERM -> (endpoint removal in
  parallel) -> grace period ends -> SIGKILL.

## My notes

- Endpoint removal and SIGTERM happen at the same time, not in order, so
  a pod can get new requests after SIGTERM. The page says they happen "at
  the same time"; the exact race isn't spelled out.
