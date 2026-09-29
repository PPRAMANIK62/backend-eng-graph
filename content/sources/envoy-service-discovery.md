---
id: envoy-service-discovery
title: Service discovery (Envoy architecture overview)
author: Envoy Project Authors
url: https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/service_discovery
kind: docs
primary: true
---

## Summary

How Envoy learns the members of an upstream cluster (docs for Envoy
1.40.0-dev): static lists, DNS in two flavours, original destination,
and the endpoint discovery service (EDS). Plus Envoy's argument that
discovery doesn't need to be strongly consistent if you also health
check.

## Key claims

- Service discovery is resolving a cluster's members. "When an upstream cluster is defined in the configuration, Envoy needs to know how to resolve the members of the cluster. This is known as service discovery." (Service discovery)
- Static: the config lists every host. (Static)
- Strict DNS: every returned IP is a host, resolved continuously in the background. "Each returned IP address in the DNS result will be considered an explicit host in the upstream cluster." (Strict DNS)
- DNS is never resolved in the request path. "Note that Envoy never synchronously resolves DNS in the forwarding path." (Strict DNS)
- Refresh defaults to 5000 ms unless TTLs are respected. "dns_refresh_rate defaults to 5000ms if not specified." (Strict DNS)
- Logical DNS uses only the first IP per new connection, for big services behind round robin DNS. "a logical DNS cluster only uses the first IP address returned when a new connection needs to be initiated." (Logical DNS)
- EDS is the preferred mechanism: an xDS server over gRPC or REST sends endpoints with weights, zones and canary status. "EDS is the preferred service discovery mechanism for a few reasons" (Endpoint discovery service (EDS))
- Envoy's view: strongly consistent stores are painful at scale. "Many existing RPC systems treat service discovery as a fully consistent process. To this end, they use fully consistent leader election backing stores such as Zookeeper, etcd, Consul, etc. Our experience has been that operating these backing stores at scale is painful." (On eventually consistent service discovery)
- Envoy assumes hosts come and go in an eventually consistent way, and uses active health checks alongside. "Envoy was designed from the beginning with the idea that service discovery does not require full consistency." (On eventually consistent service discovery)
- The 2x2 matrix: a host absent from discovery but passing health checks is still used; a discovered host failing checks is not. "Health check data is assumed to be more accurate than discovery data." (On eventually consistent service discovery)
- The only case where Envoy deletes a host is absent and failing. "This is the only state in which Envoy will purge host data." (On eventually consistent service discovery)

## Visuals worth redrawing

- The discovered/absent x health OK/failed matrix.

## My notes

- Contrast with Consul's "single source of truth" framing.
