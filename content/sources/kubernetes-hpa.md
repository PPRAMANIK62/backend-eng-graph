---
id: kubernetes-hpa
title: Horizontal Pod Autoscaling (Kubernetes docs)
author: Kubernetes documentation contributors
url: https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/
kind: docs
primary: true
---

## Summary

The Kubernetes concept page for the HorizontalPodAutoscaler, read for
v1.35: the control loop, the scaling formula, how it treats unready
pods and missing metrics, stabilization windows and default scaling
policies.

## Key claims

- HPA adds pods (horizontal), unlike giving pods more CPU or memory (vertical). "Horizontal scaling means that the response to increased load is to deploy more Pods." (intro)
- It's a control loop that runs every 15 seconds by default. "Kubernetes implements horizontal pod autoscaling as a control loop that runs intermittently (it is not a continuous process)." (How does a HorizontalPodAutoscaler work?)
- "The interval is set by the --horizontal-pod-autoscaler-sync-period parameter to the kube-controller-manager (and the default interval is 15 seconds)." (How does it work)
- CPU utilization is a share of the pod's request; with no request, no action. "if some of the Pod's containers do not have the relevant resource request set, CPU utilization for the Pod will not be defined and the autoscaler will not take any action for that metric." (How does it work)
- Formula: desiredReplicas = ceil(currentReplicas × currentMetricValue / desiredMetricValue). Example: 200m current vs 100m target doubles the replicas. (Algorithm details)
- A tolerance of 0.1 skips small changes. "The control plane skips any scaling action if the ratio is sufficiently close to 1.0 (within a configurable tolerance, 0.1 by default)." (Algorithm details)
- Pods not ready yet are assumed to use 0%, damping scale-up. "the controller conservatively assumes that the not-yet-ready pods are consuming 0% of the desired metric, further dampening the magnitude of a scale up." (Algorithm details)
- CPU of starting pods is ignored for up to 5 minutes (cpu-initialization-period) and a 30-second readiness delay applies. "This command line option helps exclude misleading high CPU usage from initializing Pods (for example: Java apps warming up) in HPA scaling decisions." (Pod readiness and autoscaling metrics)
- With several metrics, the biggest answer wins. "this calculation is done for each metric, and then the largest of the desired replica counts is chosen." (Algorithm details)
- Scale-down stabilization of 5 minutes. "This means that scaledowns will occur gradually, smoothing out the impact of rapidly fluctuating metric values." (Algorithm details; option defaults to 5 minutes)
- Flapping. "This is sometimes referred to as thrashing, or flapping." (Stability of workload scale)
- Default scale-up has no stabilization window and adds at most 4 pods or 100% every 15 seconds. "There are 2 policies where 4 pods or a 100% of the currently running replicas may at most be added every 15 seconds till the HPA reaches its steady state." (Default behavior)
- Default scale-down: 300-second window, may remove down to the minimum. "For scaling down the stabilization window is 300 seconds" (Default behavior)
- Summed container usage can hide one hot container. "This could lead to situations where a single container might be running with high usage and the HPA will not scale out because the overall pod usage is still within acceptable limits." (Support for resource metrics)
- Resource metrics usually come from the Metrics Server add-on. "The metrics.k8s.io API is usually provided by an add-on named Metrics Server, which needs to be launched separately." (How does a HorizontalPodAutoscaler work?)

## Visuals worth redrawing

- The loop: read metrics, compute ratio, set replicas on the Deployment.

## My notes

- Metrics usually come from Metrics Server, an add-on; its own scrape
  interval adds delay but isn't given on this page.
