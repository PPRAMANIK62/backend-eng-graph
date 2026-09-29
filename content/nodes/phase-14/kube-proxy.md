---
id: kube-proxy
title: kube-proxy
depth: short
phase: 14
note: >-
  How a Kubernetes Service's virtual IP becomes packet-rewriting rules
  on every node: iptables, IPVS or nftables.
needs: [kubernetes-networking, nat]
leads_to: []
compare_with: []
---

# kube-proxy

A Kubernetes Service has a cluster IP that no machine owns. Nothing
listens on it and no interface carries it. It works because on every
node a program called kube-proxy writes packet-rewriting rules into the
kernel: any packet sent to a Service's IP and port gets its destination
changed to one of the pods behind the Service, before it leaves the
node. kube-proxy is how [[kubernetes-networking|Kubernetes Services]]
become real traffic.

## A control loop that writes packet rules

Every node runs kube-proxy, unless the cluster uses a replacement for
it. It's a [[control-loops|control loop]]: it watches the API server
for Services and EndpointSlices (the lists of pods behind each Service)
and keeps the node's rules in sync with them. For each Service it
configures the kernel to capture traffic to the cluster IP and port and
send it to one of the Service's endpoints.

## The iptables mode, step by step

Take a Service with cluster IP 10.0.0.1 and port 1234, backed by three
pods. In the iptables mode:

1. A packet to 10.0.0.1:1234 matches the Service's rule.
2. That rule jumps to one rule per endpoint, and by default one is
   picked at random.
3. The endpoint's rule rewrites the destination address to that pod's
   IP, destination [[nat|NAT]], and the packet is routed to the pod.

For traffic from inside the cluster, the client's source address isn't
rewritten, so the pod sees who called it. The rewriting happens on the
sending node, which is why no machine has to own the cluster IP.

![A client pod sends a packet to the Service's cluster IP 10.0.0.1 on port 1234. On the client's own node, kube-proxy's rules match the cluster IP, pick one of three endpoints at random, and rewrite the destination to that pod's IP. The packet then crosses the pod network to pod B on another node. The source address is not changed.](img/kubernetes-networking-service-dnat.svg)

*The Service's address is rewritten on the sending node. Example address and port from the Kubernetes documentation, "Virtual IPs and Service Proxies".*

## Why not just use DNS?

Kubernetes could return the pod IPs in DNS and let clients pick. It
uses a virtual IP instead because many DNS clients don't respect record
TTLs, some applications resolve a name once and keep the answer
forever, and very short TTLs would load the DNS servers heavily. A
virtual IP that never changes sidesteps all three. When you do want the
pod IPs, a headless Service (one with no cluster IP) returns them in
DNS, and kube-proxy leaves it alone.

## The modes are changing

| Mode | Status in Kubernetes 1.37 |
|---|---|
| iptables | The default |
| nftables | Linux only, needs kernel 5.13 or later; planned as the future default |
| ipvs | Deprecated since 1.35, due to be removed in 1.43 |

In clusters with tens of thousands of pods and Services, the iptables
mode means tens of thousands of rules, and updating them in the kernel
can take a long time. Since 1.28 it only rewrites the rules for Services
and EndpointSlices that actually changed, and by default it batches
changes, syncing at most about once a second.

## Where it gets tricky

**It balances connections, not requests.** The pod is chosen when a
connection starts, and every packet on that connection goes to the same
pod. HTTP/1.1 clients open and close many connections, so load spreads
out. [[grpc|gRPC]] and other [[http2|HTTP/2]] clients keep one long
connection and send every call over it, so all of one client's calls
land on one pod. For request-level balancing you need a client that
connects to every pod (through a headless Service) or an
[[l4-vs-l7|L7]] proxy.

**Long connections and old kernels.** Linux before 6.1 has a
connection-tracking bug that can reset long-lived TCP connections to
Service IPs. The iptables mode installs a workaround, which in some
clusters caused other problems; the nftables mode doesn't install one by
default.

**Session affinity is off by default.** You can ask for a client IP to
keep landing on the same pod with `sessionAffinity: ClientIP`; the
default is `None`.

## What this means when you build

- Pin the kube-proxy mode in your cluster configuration, so an upgrade
  doesn't change it for you, and plan the move off ipvs.
- Check the node kernel version before switching to nftables.
- Don't expect Services to spread gRPC calls. Balance at the request
  level.

## Further reading

- [Virtual IPs and Service Proxies](https://kubernetes.io/docs/reference/networking/virtual-ips/), Kubernetes documentation, Kubernetes 1.37. How kube-proxy works, its modes and their status, sync behaviour and the conntrack caveat.
- [gRPC Load Balancing on Kubernetes without Tears](https://kubernetes.io/blog/2018/11/07/grpc-load-balancing-on-kubernetes-without-tears/), William Morgan, 2018. Why connection-level balancing pins gRPC calls to one pod.
