---
id: service-mesh
title: Service meshes
depth: short
phase: 17
note: >-
  Proxies beside every service that handle retries, mTLS and telemetry,
  so the services don't have to.
needs: [mtls, load-balancing, service-discovery, monolith-vs-microservices, retry-budgets, zero-trust]
leads_to: []
compare_with: [api-gateway]
---

# Service meshes

A service mesh is a layer of proxies that carries every call between
your services and adds the same features to all of them: encryption
with [[mtls|mutual TLS]], load balancing, retries, and metrics. The
services don't implement any of it, and often don't know it's there.
It becomes worth thinking about once a system has been split into many
services (see [[monolith-vs-microservices]]) and every team is
rewriting the same networking code.

## One call, through two proxies

The order service calls the payment service. With a mesh in the
classic "sidecar" layout, each service runs with a proxy right next to
it, in the same pod on [[kubernetes]], and all its traffic is routed
through that proxy.

1. **The order service sends a plain request** to the payment
   service's name. Its own proxy intercepts it.
2. **Routing.** The proxy applies routing rules: this cluster or
   another, the current version or a [[deployment-strategies|canary]] taking a share of traffic.
3. **Picking an instance.** From the current list of payment instances
   (kept up to date from [[service-discovery]]), it picks one, favouring
   instances that have been answering fast and aren't busy
   ([[load-balancing]]).
4. **A secure connection.** It reuses a pooled connection to that
   instance's proxy, or opens one with mutual TLS, so both sides prove
   their identity and the traffic is encrypted. It may even run HTTP/2
   between the two proxies when the app speaks HTTP/1.1.
5. **Failures.** If the instance fails, the proxy can retry on another,
   but only if the request is safe to repeat and a retry budget allows
   it ([[retry-budgets]]). An instance that keeps failing is taken out
   of the pool for a while.
6. **On the other side**, the payment service's proxy terminates the
   TLS, checks policy (is the order service allowed to call this?), and
   hands the request to the app. Both proxies record latency and result
   codes.

Neither service wrote code for any of this.

## Data plane and control plane

The proxies that touch traffic are the **data plane**. In Istio they're
Envoy. The **control plane** doesn't carry requests; it configures the
proxies. Istio's control plane, istiod, does three jobs:

- turns high-level routing rules into proxy configuration and pushes it
  to every proxy while they run,
- gathers service discovery information from the platform,
- acts as a certificate authority, issuing the certificates each
  workload uses for mTLS.

Because every workload gets a certificate, policy can say "the order
service may call payments" using service identities, instead of IP
addresses that change every time a pod moves. That's the basis for
[[zero-trust]] networking between services.

## Where it came from

Before meshes, companies like Twitter, Netflix and Google put this
logic in a shared RPC library (Finagle, Hystrix, Stubby) that every
service linked in, so the features were bound into each service at
compile time. The mesh moves the same logic out of the process: containers made it possible
to run it as a separate proxy, and orchestrators like Kubernetes made it
cheap to deploy thousands of them. The features are attached at runtime
instead of compiled in.

## Sidecars, or proxies per node

A proxy beside every instance is a lot of proxies. Istio's newer
**ambient mode** (informally, "sidecar-less") splits the work in two:

- **ztunnel**, one proxy per node, written in Rust, handles only layer 3
  and 4 work: mTLS, identity, layer-4 authorization and telemetry. It
  never parses HTTP.
- **Waypoint proxies**, Envoy again, run per namespace outside the app
  pods and are added only where you need HTTP features like routing
  rules and HTTP-level policy.

Some uses need only the encrypted, authenticated layer-4 overlay, and
never get a waypoint; the heavier HTTP proxy is deployed only where its
features are needed. Sidecar and ambient workloads can share one mesh.

![Two layouts. Top, sidecar mode: an order pod and a payment pod each contain the app and its own proxy; the call goes app to proxy, over mTLS to the other proxy, then to the app; a control plane above pushes config and certificates to both proxies. Bottom, ambient mode: the pods contain only apps; each node runs one ztunnel that carries mTLS between nodes, and an optional waypoint proxy per namespace handles HTTP features; the same control plane configures both.](img/service-mesh-sidecar-vs-ambient.svg)

*Sidecar mode and ambient mode. Adapted from the Istio documentation, "Architecture" and "Ambient mode overview" (Istio 1.31).*

## Where it gets tricky

**Mesh or [[api-gateway|API gateway]]?** Both are proxies, and their
features overlap. The gateway is the single front door for clients
outside the system. The mesh handles the calls your services make to
each other.

**It isn't free.** Every call now passes through extra proxies that do
work on each request, and the mesh itself is a system to run, upgrade
and debug. None of the sources read here give an
overhead number, so measure it on your own workload. Outside Kubernetes
the cost of adopting a mesh rises quickly, because the platform no
longer deploys and wires up the proxies for you.

**Retries still need care.** Repeating a request is only safe when it's
[[idempotency|idempotent]]. Linkerd, for one, retries only requests it
knows are idempotent, and only while a retry budget allows it; see
[[retry-budgets]] for why an unlimited retry policy makes outages
worse.

**It moves code, not understanding.** The mesh takes over the
mechanics of calls between services. It doesn't decide timeouts that
make sense for your requests, or fix a design with too many calls per
request.

## What this means when you build

- Consider a mesh when you have many services, several languages, and
  a need for mTLS and consistent metrics everywhere. With a handful of
  services, a shared library or plain proxies may be simpler.
- Turn on mTLS and identity-based policy first; that's the part that's
  hardest to do any other way.
- Configure retries per route, only for idempotent calls, with a
  budget.
- Measure the latency and resource cost of the proxies on your own
  traffic before and after.

## Further reading

- [What is a service mesh?](https://linkerd.io/what-is-a-service-mesh/), Linkerd project. One request through a mesh proxy step by step, and where meshes came from.
- [Istio architecture](https://istio.io/latest/docs/ops/deployment/architecture/), Istio project, read at Istio 1.31. Data plane and control plane, and what istiod does.
- [Istio ambient mode overview](https://istio.io/latest/docs/ambient/overview/), Istio project, read at Istio 1.31. The per-node ztunnel and per-namespace waypoint design.
