---
id: kubernetes-virtual-ips
title: Virtual IPs and Service Proxies
author: Kubernetes documentation
url: https://kubernetes.io/docs/reference/networking/virtual-ips/
kind: docs
primary: true
---

## Summary

The reference page for kube-proxy (docs for Kubernetes 1.37). kube-proxy
runs on every node, watches Services and EndpointSlices, and programs the
kernel so that traffic to a Service's cluster IP is rewritten (destination
NAT) to one Pod's IP. It covers the iptables, ipvs and nftables modes,
why Kubernetes proxies instead of relying on DNS round robin, and how
cluster IPs are allocated.

## Key claims

- kube-proxy runs on every node unless replaced. "Every node in a Kubernetes cluster runs a kube-proxy (unless you have deployed your own alternative component in place of kube-proxy)." (intro)
- It watches Services and EndpointSlices and redirects cluster IP traffic. "For each Service, kube-proxy calls appropriate APIs (depending on the kube-proxy mode) to configure the node to capture traffic to the Service's clusterIP and port, and redirect that traffic to one of the Service's endpoints" (intro)
- It's a control loop. "A control loop ensures that the rules on each node are reliably synchronized with the Service and EndpointSlice state as indicated by the API server." (intro)
- Why not DNS round robin: clients ignore TTLs. "There is a long history of DNS implementations not respecting record TTLs, and caching the results of name lookups after they should have expired." (intro)
- Some apps resolve once. "Some apps do DNS lookups only once and cache the results indefinitely." (intro)
- Low TTLs would load DNS. "the low or zero TTLs on the DNS records could impose a high load on DNS that then becomes difficult to manage." (intro)
- Default mode in 1.37 is iptables, moving to nftables later. "In Kubernetes 1.37, this is iptables, but a future version of Kubernetes will change the default to nftables." (Proxy modes)
- iptables mode picks a backend at random by default. "For each endpoint, it installs iptables rules which, by default, select a backend Pod at random." (iptables proxy mode)
- The per-endpoint rules use destination NAT. "the per- endpoint rules redirect traffic (using destination NAT) to the backends." (iptables proxy mode, Example)
- Client IP is kept for in-cluster traffic, not for NodePort or load balancer traffic. "packets are redirected to the backend without rewriting the client IP address." (iptables proxy mode, Example)
- Tens of thousands of rules in big clusters. "In clusters with tens of thousands of Pods and Services, this means tens of thousands of iptables rules, and kube-proxy may take a long time to update the rules in the kernel when Services (or their EndpointSlices) change." (Optimizing iptables mode performance)
- minSyncPeriod default 1 s batches changes; bigger means more lag. "The default value of 1s should work well in most clusters" (minSyncPeriod)
- Since 1.28 iptables mode only updates what changed. "Since Kubernetes v1.28, the iptables mode of kube-proxy uses a more minimal approach, only making updates where Services or EndpointSlices have actually changed." (Updating legacy minSyncPeriod configuration)
- ipvs is deprecated. "Feature state: Deprecated since Kubernetes v1.35" (IPVS proxy mode)
- ipvs removal plan. "ipvs mode will be fully removed in Kubernetes v1.43." (IPVS proxy mode)
- nftables needs kernel 5.13+. "This proxy mode is only available on Linux nodes, and requires kernel 5.13 or later." (nftables proxy mode)
- A conntrack bug before Linux 6.1 can reset long-lived connections to service IPs. "Linux kernels prior to 6.1 have a bug that can result in long-lived TCP connections to service IPs being closed with the error" (Migrating from iptables mode to nftables)
- Service IPs aren't owned by any host. "Unlike Pod IP addresses, which actually route to a fixed destination, Service IPs are not actually answered by a single host." (IP address assignment to Services)
- Each Service gets an IP from the service CIDR. "Kubernetes does that by allocating each Service its own IP address from within the service-cluster-ip-range CIDR range that is configured for the API Server." (Avoiding collisions)
- Session affinity by client IP is optional; default None. "you can select the session affinity based on the client's IP addresses by setting .spec.sessionAffinity to ClientIP for a Service (the default is None)." (Session affinity)
- iptables mode works around the conntrack bug, nftables does not by default. "The iptables mode of kube-proxy installs a workaround for this bug, but this workaround was later found to cause other problems in some clusters. The nftables mode does not install any workaround by default" (Migrating from iptables mode to nftables)
- The worked example uses cluster IP 10.0.0.1 and port 1234. "the Kubernetes control plane assigns a virtual IP address, for example 10.0.0.1. For this example, assume that the Service port is 1234." (iptables proxy mode, Example)

## Visuals worth redrawing

- The iptables chain: cluster IP, then per-Service rules, then
  per-endpoint rules, then DNAT to a Pod IP.

## My notes

- Because the choice is made per connection, a long-lived connection
  (HTTP/2, gRPC) sticks to one Pod; see morgan-grpc-lb-kubernetes-2018.
