---
id: kubernetes-network-policies
title: Network Policies (Kubernetes documentation)
author: The Kubernetes Authors
url: https://kubernetes.io/docs/concepts/services-networking/network-policies/
kind: docs
primary: true
---

## Summary

How Kubernetes NetworkPolicy works (Kubernetes 1.37 docs): pods accept
all traffic until a policy selects them, policies only add allowed
connections, and the network plugin is what enforces them.

## Key claims

- Layer 3 and 4 only. "If you want to control traffic flow at the IP address or port level (OSI layer 3 or 4), NetworkPolicies allow you to specify rules for traffic flow within your cluster, and also between Pods and the outside world." (intro)
- Enforced by the plugin. "Network policies are implemented by the network plugin." (Prerequisites)
- Without one, nothing happens. "Creating a NetworkPolicy resource without a controller that implements it will have no effect." (Prerequisites)
- Default is open. "By default, a pod is non-isolated for egress; all outbound connections are allowed." (The two sorts of pod isolation)
- A policy that selects a pod isolates it. "A pod is isolated for ingress if there is any NetworkPolicy that both selects the pod and has "Ingress" in its policyTypes" [inner quotes around Ingress] (The two sorts of pod isolation)
- Policies add up. "Network policies do not conflict; they are additive." (The two sorts of pod isolation)
- Both ends must allow a connection. "For a connection from a source pod to a destination pod to be allowed, both the egress policy on the source pod and the ingress policy on the destination pod need to allow the connection." (The two sorts of pod isolation)

## Visuals worth redrawing

None.

## My notes

- Kubernetes 1.37 docs.
