---
id: kubernetes-components
title: Kubernetes Components
author: Kubernetes documentation
url: https://kubernetes.io/docs/concepts/overview/components/
kind: docs
primary: true
---

## Summary

A one-page map of a Kubernetes cluster (docs for Kubernetes 1.37): the
control plane (API server, etcd, scheduler, controller manager, optional
cloud controller manager) and what runs on every node (kubelet, optional
kube-proxy, a container runtime), plus addons like cluster DNS.

## Key claims

- A cluster is a control plane plus worker nodes. "A Kubernetes cluster consists of a control plane and one or more worker nodes." (Core Components)
- The API server exposes the HTTP API. "The core component server that exposes the Kubernetes HTTP API." (kube-apiserver)
- etcd holds all API server data. "Consistent and highly-available key value store for all API server data." (etcd)
- The scheduler assigns unbound Pods to nodes. "Looks for Pods not yet bound to a node, and assigns each Pod to a suitable node." (kube-scheduler)
- The controller manager runs controllers. "Runs controllers to implement Kubernetes API behavior." (kube-controller-manager)
- The kubelet runs Pods on each node. "Ensures that Pods are running, including their containers." (kubelet)
- kube-proxy is optional and implements Services. "Maintains network rules on nodes to implement Services." (kube-proxy)
- The container runtime runs containers. "Software responsible for running containers." (Container runtime)
- DNS is an addon. "For cluster-wide DNS resolution." (Addons, DNS)

## Visuals worth redrawing

- The components diagram: control plane boxes talking to the API server,
  nodes with kubelet and kube-proxy.

## My notes

- Only the API server talks to etcd; everything else goes through the API.
  (Stated in burns-borg-omega-kubernetes-2016.)
