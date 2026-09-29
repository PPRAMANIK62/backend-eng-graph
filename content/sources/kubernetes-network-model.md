---
id: kubernetes-network-model
title: Services, Load Balancing, and Networking (the Kubernetes network model)
author: Kubernetes documentation
url: https://kubernetes.io/docs/concepts/services-networking/
kind: docs
primary: true
---

## Summary

The overview page for Kubernetes networking (docs for Kubernetes 1.37).
It states the network model: every Pod gets its own cluster-wide IP, all
Pods reach all Pods without NAT, Services give a stable address in front
of changing Pods, and most of the actual work is done by plugins (CNI)
and a service proxy, not by Kubernetes itself.

## Key claims

- Every Pod gets its own IP. "Each pod in a cluster gets its own unique cluster-wide IP address." (The Kubernetes network model)
- Containers in a Pod share one network namespace. "Processes running in different containers in the same pod can communicate with each other over localhost." (The Kubernetes network model)
- Pod to Pod with no proxy or NAT. "Pods can communicate with each other directly, without the use of proxies or address translation (NAT)." (The Kubernetes network model)
- Services give a stable IP or name. "The Service API lets you provide a stable (long lived) IP address or hostname for a service implemented by one or more backend pods" (The Kubernetes network model)
- A service proxy programs the data plane. "A service proxy implementation monitors the set of Service and EndpointSlice objects, and programs the data plane to route service traffic to its backends, by using operating system or cloud provider APIs to intercept or rewrite packets." (The Kubernetes network model)
- Kubernetes keeps EndpointSlices current for each Service. "Kubernetes automatically manages EndpointSlice objects to provide information about the pods currently backing a Service." (The Kubernetes network model)
- NetworkPolicy controls pod traffic. "NetworkPolicy is a built-in Kubernetes API that allows you to control traffic between pods, or between pods and the outside world." (The Kubernetes network model)
- Older container systems mapped container ports to host ports. "it was often necessary to explicitly create links between containers, or to map container ports to host ports to make them reachable by containers on other hosts." (The Kubernetes network model)
- Pods can be treated like hosts. "Kubernetes's model is that pods can be treated much like VMs or physical hosts from the perspectives of port allocation, naming, service discovery, load balancing, application configuration, and migration." (The Kubernetes network model)
- Kubernetes defines the APIs, others implement them. "Only a few parts of this model are implemented by Kubernetes itself." (The Kubernetes network model)
- The pod network comes from CNI plugins. "On Linux, most container runtimes use the Container Networking Interface (CNI) to interact with the pod network implementation, so these implementations are often called CNI plugins." (The Kubernetes network model)
- kube-proxy is the default service proxy, but some plugins replace it. "Kubernetes provides a default implementation of service proxying, called kube-proxy, but some pod network implementations instead use their own service proxy" (The Kubernetes network model)
- NetworkPolicy may do nothing if the plugin doesn't implement it. "In these cases, the API will still be present, but it will have no effect." (The Kubernetes network model)

## Visuals worth redrawing

None.

## My notes

- "Without NAT" is about pod-to-pod traffic. Traffic to a Service's
  cluster IP is rewritten (see kubernetes-virtual-ips).
