---
id: kubernetes-container-runtimes
title: Container Runtimes
author: Kubernetes documentation
url: https://kubernetes.io/docs/setup/production-environment/container-runtimes/
kind: docs
primary: true
---

## Summary

Kubernetes' setup page for node container runtimes: dockershim's
removal in v1.24, the runtimes to use instead (containerd, CRI-O), and
the cgroup driver that kubelet and runtime must agree on.

## Key claims

- dockershim removed in Kubernetes 1.24. "Dockershim has been removed from the Kubernetes project as of release 1.24." (note at top)
- Before that, Docker Engine was integrated directly. "Kubernetes releases before v1.24 included a direct integration with Docker Engine, using a component named dockershim." (note at top)
- Kubelet and runtime must use the same cgroup driver. "It's critical that the kubelet and the container runtime use the same cgroup driver and are configured the same." (cgroup drivers)
- With systemd as init, use the systemd driver; two managers can make a node unstable. "Two cgroup managers result in two views of the available and in-use resources in the system." (systemd cgroup driver)
- With cgroup v2, use systemd, not cgroupfs. "Additionally, if you use cgroup v2, use the systemd cgroup driver instead of cgroupfs." (cgroupfs driver)
- Mixed cgroup managers can destabilise a node. "In some cases, nodes that are configured to use cgroupfs for the kubelet and container runtime, but use systemd for the rest of the processes become unstable under resource pressure." (cgroupfs driver)

## Visuals worth redrawing

None.

## My notes

- Read at Kubernetes v1.36 docs.
