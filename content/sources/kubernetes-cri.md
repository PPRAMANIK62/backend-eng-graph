---
id: kubernetes-cri
title: Container Runtime Interface (CRI)
author: Kubernetes documentation
url: https://kubernetes.io/docs/concepts/architecture/cri/
kind: docs
primary: true
---

## Summary

Kubernetes' page on the CRI: the gRPC API between the kubelet and the
container runtime on each node, so the kubelet works with containerd,
CRI-O or others without being rebuilt.

## Key claims

- What the CRI is for. "The CRI is a plugin interface which enables the kubelet to use a wide variety of container runtimes, without having a need to recompile the cluster components." (intro)
- It's a gRPC protocol between kubelet and runtime. "The Kubernetes Container Runtime Interface (CRI) defines the main gRPC protocol for the communication between the node components kubelet and container runtime." (intro)
- The kubelet is the client. "The kubelet acts as a client when connecting to the container runtime via gRPC." (The API)
- Stable since Kubernetes v1.23; v1 API required since v1.26. "For Kubernetes v1.26 and later, the kubelet requires that the container runtime supports the v1 CRI API." (The API)
- CRI stable since v1.23. "Feature state: Stable since Kubernetes v1.23" (The API)

## Visuals worth redrawing

None.

## My notes

- Read at Kubernetes v1.36 docs. The dockershim removal is on the
  container runtimes setup page (kubernetes-container-runtimes).
