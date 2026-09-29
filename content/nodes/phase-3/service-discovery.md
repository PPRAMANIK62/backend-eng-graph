---
id: service-discovery
title: Service discovery
depth: short
phase: 3
note: >-
  How a caller finds the current list of addresses for a service whose
  instances keep moving.
needs: [dns, dns-records, load-balancing, health-checks]
leads_to: [kubernetes-networking, service-mesh]
compare_with: [coordination-services]
---

# Service discovery

Service discovery is how a caller finds out where a service's instances
are right now. On a fixed fleet you could write the addresses in a
config file. On anything that scales, reschedules or deploys often, the
addresses keep changing, and whoever does the
[[load-balancing|load balancing]] needs a live list.

## Why a config file stops working

Take a service called `payments` running as three instances in
Kubernetes. Each Pod has its own IP address. A deploy replaces all
three Pods with new ones on new addresses; a node failure moves one; a
scale-up adds two more. No single Pod, and no single address, is
meant to last. A caller holding old addresses sends traffic to
machines that are gone.

So there are two halves to the problem. Instances have to be recorded
somewhere as they start and stop, and callers have to read that record,
fresh enough to matter.

## A registry, and two ways to use it

The record is a registry (Consul calls it a service catalog, Kubernetes
keeps EndpointSlices). Instances are added when they start, removed
when they stop, and unhealthy ones are taken out, so discovery leans
on [[health-checks]] too.

There are two ways to use it:

![Two panels. Client-side discovery: the caller asks the registry for the list of payments instances, gets three addresses back, and picks one itself. Server-side discovery: the caller sends its request to one stable address; a proxy or virtual IP in front reads the registry and forwards the request to one instance.](img/service-discovery-client-server.svg)

*Client-side discovery puts the list and the balancing in the caller. Server-side discovery hides both behind one address. Adapted from HashiCorp, "What is service discovery?" (Consul docs).*

- **Client-side discovery.** The caller asks the registry for the list
  and picks an instance itself. The balancing happens in the caller's
  library.
- **Server-side discovery.** The caller talks to one stable address,
  and something in the middle (a proxy, or a virtual IP) looks up the
  list and forwards the request.

Kubernetes offers both. A normal Service gets a stable cluster IP, and
kube-proxy forwards connections to that IP on to the current Pods:
server-side. A headless Service has no cluster IP; its DNS name
returns the Pods' own addresses, and the caller chooses: client-side.

## DNS as the lookup

The most common way to read the registry is [[dns]], because every
program already knows how to use it. In Kubernetes, a cluster DNS
server watches the API and creates records for each Service, so a Pod
can look up `payments` or `payments.shop` (service and namespace).
There are SRV records too, which carry ports as well as addresses: a
query for `_http._tcp.payments.shop` finds the port of a port named
`http` (see [[dns-records]] for SRV). Consul answers DNS queries for
its catalog the same way.

DNS has limits here. Answers are cached for their TTL
([[dns-caching]]), so removals reach callers late. And a program that
resolves a name once at startup and keeps the addresses forever never
sees any change at all. Proxies handle this by resolving in the
background: Envoy's "strict DNS" mode treats every returned address as
a backend and re-resolves every 5 seconds by default, and it never
waits on DNS while forwarding a request.

## Watching instead of asking

The alternative is to subscribe to the registry and get changes pushed.
Kubernetes clients can query the API server for a Service's
EndpointSlices, which a controller keeps current as Pods change.
Envoy's endpoint discovery service (EDS), part of its xDS APIs, streams
endpoint lists to proxies, with extra data DNS can't carry: each
endpoint's weight, zone and whether it's a canary. That extra data is
why Envoy prefers EDS over DNS.

## Where it gets tricky

**How consistent does the registry need to be?** One view treats the
catalog as the single source of truth, kept by a set of servers, which
is how Consul describes itself. Envoy's designers took
the opposite view: running strongly consistent stores like ZooKeeper,
etcd or Consul at scale was painful, and discovery doesn't need to be
exact if you also health check. Envoy keeps routing to a host that has
vanished from discovery as long as it passes health checks, stops
routing to a discovered host that fails them, and only deletes a host
when it's both absent and failing. Health check data wins over
discovery data.

**Environment variables are frozen.** Kubernetes can also inject a
Service's address into a Pod as environment variables, but only for
Services that existed before the Pod started. DNS doesn't have that
ordering problem.

## What this means when you build

- Don't hard-code instance addresses. Resolve a service name.
- If you resolve DNS yourself, do it again periodically, and respect the
  TTL. Never resolve once at startup and cache forever.
- Decide who balances: the caller (client-side, headless) or a proxy
  or virtual IP (server-side).
- Let health checks overrule the registry, so a stale entry can't send
  traffic to a dead instance.

## Further reading

- [Service](https://kubernetes.io/docs/concepts/services-networking/service/), Kubernetes docs (1.37). Services, EndpointSlices, DNS names and SRV records, headless Services.
- [Service discovery](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/service_discovery), Envoy docs (1.40.0-dev). DNS-based and API-based discovery in a proxy, and the case for eventually consistent discovery.
- [What is service discovery?](https://developer.hashicorp.com/consul/docs/use-case/service-discovery), HashiCorp Consul docs. The catalog model and the client-side vs server-side patterns.
