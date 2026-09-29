---
id: kubernetes-networking
title: Kubernetes networking
depth: deep
phase: 14
note: >-
  Pods, Services and how traffic reaches a pod: a flat pod network,
  kube-proxy's address rewriting, DNS names.
needs: [kubernetes, service-discovery, nat]
leads_to: [kube-proxy]
compare_with: [grpc]
---

# Kubernetes networking

In [[kubernetes|Kubernetes]], every pod gets its own IP address and can
reach every other pod directly. On top of that flat network, a Service
puts one stable address and DNS name in front of a set of pods that
keeps changing, a gateway brings outside traffic in, and network
policies decide which pods may talk to which. Kubernetes defines the
rules for all of this; plugins and proxies do the work.

## Every pod is a host

Each pod gets a unique IP across the whole cluster. The containers
inside one pod share it and reach each other on `localhost`. Any pod
can connect to any other pod's IP, on the same node or another, with no
proxy and no [[nat|address translation]] in between.

Older container setups didn't work this way. You mapped each
container's port to a port on the host and told every client which one
to use. With an IP per pod, you can treat a pod like its own machine
for ports, naming and discovery: your server listens on the port it
always uses.

## Who builds the pod network: CNI plugins

Kubernetes only states those rules. The network itself is built by a
network plugin, which on Linux speaks the Container Network Interface
(CNI, spec version 1.1.0). The protocol is simple: the container
runtime creates a new [[linux-namespaces|network namespace]] for the
pod, then runs the plugin as a program, passing parameters in
environment variables and its configuration on standard input.

- An **interface plugin** creates a network interface inside the pod's
  namespace and makes sure it's connected.
- An **IPAM plugin** (IP address management) hands out the address.
- **Chained plugins** adjust an interface that already exists.

The same plugin runs again with `DEL` when the pod goes away. How
packets actually cross between nodes is up to the plugin, which is why
clusters with different plugins can behave differently in ways
Kubernetes itself doesn't define.

## A Service is an address nobody owns

Pods come and go, and each new one has a new IP. So clients don't talk
to pod IPs. They talk to a Service. A Service selects pods by label,
and Kubernetes keeps the list of pods currently behind it in
EndpointSlice objects. A normal Service gets a cluster IP from a range
set aside for Services.

No machine owns that cluster IP. On every node, [[kube-proxy]] watches
Services and EndpointSlices and writes kernel rules that rewrite a
packet sent to the cluster IP so it goes to one of the pods.

![A client pod sends a packet to the Service's cluster IP 10.0.0.1 on port 1234. On the client's own node, kube-proxy's rules match the cluster IP, pick one of three endpoints at random, and rewrite the destination to that pod's IP. The packet then crosses the pod network to pod B on another node. The source address is not changed.](img/kubernetes-networking-service-dnat.svg)

*The Service's address is rewritten on the sending node. No machine owns the cluster IP. Example address and port from the Kubernetes documentation, "Virtual IPs and Service Proxies".*

Services come in types, and each one builds on the one before:

| Type | What it adds |
|---|---|
| `ClusterIP` (default) | A virtual IP reachable only inside the cluster |
| `NodePort` | The same, plus a port (from 30000 to 32767 by default) on every node's IP that forwards to the Service |
| `LoadBalancer` | The same, plus an external load balancer, which Kubernetes doesn't provide: you bring one or a cloud provider does |
| `ExternalName` | No proxying at all: cluster DNS returns a CNAME to an outside hostname |

## Names: cluster DNS

Cluster [[dns|DNS]] gives each Service a name like
`my-svc.my-namespace.svc.cluster.local`, which resolves to its cluster
IP. The kubelet writes each pod's `/etc/resolv.conf` with a search list
that starts with the pod's own namespace, so inside the same namespace
the short name `my-svc` works, and from another namespace
`my-svc.my-namespace` does. This is Kubernetes'
[[service-discovery]]: a stable name, a stable virtual IP, and a
controller keeping the list behind it current.

## Getting traffic in: Ingress and Gateway API

A `ClusterIP` Service is only reachable inside the cluster. To expose
HTTP services to the internet you put a [[reverse-proxy]] in front, and
Kubernetes describes that proxy's routing with an API. The older one is
Ingress. Its successor is Gateway API, an add-on whose kinds are
modeled on the roles that manage networking: infrastructure providers,
cluster operators and application developers.

- a **GatewayClass** names the controller responsible for a kind of
  gateway;
- a **Gateway** is one gateway, tied to exactly one GatewayClass;
- **Routes** such as HTTPRoute send matching requests on to Services.

Routing by header or splitting traffic by weight, which Ingress could
only do through controller-specific annotations, are built into Gateway
API. Moving from Ingress is a one-time conversion, since Gateway API
doesn't include the Ingress kind.

## Who may talk to whom: network policies

By default every pod accepts every connection, in and out. A
NetworkPolicy changes that for the pods it selects:

- Once any policy with `Ingress` in its types selects a pod, that pod
  accepts only the inbound connections some policy allows (plus traffic
  from its own node). The same goes for `Egress` and outbound traffic.
- Policies never conflict. They only add allowed connections, so the
  order you apply them in doesn't matter.
- A connection needs both sides: the source pod's egress rules and the
  destination pod's ingress rules must allow it.

Policies work at the IP and port level (layers 3 and 4), not on HTTP
paths or methods.

## Where it gets tricky

**Some pieces do nothing without the plugin.** Network policies are
enforced by the network plugin. Create one in a cluster whose plugin
doesn't support them and it has no effect, with no error.

**The default is wide open.** Until a policy selects a pod, any pod in
the cluster can reach it.

**Short names cost extra lookups.** The default pod `resolv.conf` sets
`ndots:5`. Any name with fewer than five dots is tried with each search
domain appended before it's tried as written. A lookup of
`api.example.com` first asks for
`api.example.com.<namespace>.svc.cluster.local` and the other search
domains, and only then for the real name. Lowering `ndots` for pods
that mostly call outside names cuts those extra queries.

**Services balance connections, not requests.** [[grpc|gRPC]] clients
that keep one connection end up pinned to one pod; see [[kube-proxy]].

## What this means when you build

- Talk to Services by name, not to pod IPs.
- Expose HTTP services through a Gateway (or Ingress) rather than one
  `LoadBalancer` per Service.
- Start each namespace with a deny-all network policy, and check your
  plugin actually enforces policies.
- If lookups of outside names are slow, look at `ndots` first.

## Further reading

- [Services, Load Balancing, and Networking](https://kubernetes.io/docs/concepts/services-networking/), Kubernetes documentation, Kubernetes 1.37. The network model in one page: IP per pod, no NAT between pods, Services, and which parts plugins implement.
- [Service](https://kubernetes.io/docs/concepts/services-networking/service/), Kubernetes documentation, Kubernetes 1.37. Selectors and EndpointSlices, and the four Service types.
- [DNS for Services and Pods](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/), Kubernetes documentation, Kubernetes 1.37. Service names, the pod search list and `ndots:5`, headless Services.
- [Container Network Interface Specification](https://www.cni.dev/docs/spec/), CNI project, spec 1.1.0. How runtimes call network plugins to set up a pod's interface.
- [Gateway API](https://kubernetes.io/docs/concepts/services-networking/gateway/), Kubernetes documentation, Kubernetes 1.37. The role-oriented successor to Ingress.
- [Network Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/), Kubernetes documentation, Kubernetes 1.37. Isolation, additive policies, and why a plugin must enforce them.
