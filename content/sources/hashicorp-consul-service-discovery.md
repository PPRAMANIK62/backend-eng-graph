---
id: hashicorp-consul-service-discovery
title: What is service discovery? (Consul docs)
author: HashiCorp
url: https://developer.hashicorp.com/consul/docs/use-case/service-discovery
kind: docs
primary: true
---

## Summary

Consul's overview of service discovery (docs for Consul v2.0.x): a
service catalog that instances register into and consumers query, with
unhealthy instances removed, and the two patterns, client-side and
server-side discovery. Vendor docs, so read the comparison with load
balancers as a pitch.

## Key claims

- A catalog is the source of truth for where services are. "Service discovery registers and maintains a record of all your services in a service catalog." (intro)
- The catalog is meant as the single source of truth. "This service catalog acts as a single source of truth that allows your services to query and communicate with each other." (intro)
- Consumers read the catalog over DNS. "Service consumers (users or other services) then use DNS to dynamically retrieve other service's access information from the service catalog." (How does service discovery work?)
- Consumers look up by service identity, not IP and port. "Service discovery uses a service's identity instead of traditional access information (IP address and port)." (How does service discovery work?)
- New instances register and join the pool; unhealthy ones are removed. "The service catalog is dynamically updated as new instances of the service are added and legacy or unhealthy service instances are removed." (intro)
- Client-side discovery: the consumer gets the list and balances itself. "In systems that use client‑side discovery, the service consumer is responsible for determining the access information of available service instances and load balancing requests between them." (What are the two main types of service discovery?)
- Server-side discovery: an intermediary looks up and routes. "In systems that use server‑side discovery, the service consumer uses an intermediary to query the service catalog and make requests to them." (What are the two main types of service discovery?)
- The catalog is replicated across servers. "Implementing a resilient service discovery system involves creating a set of servers that maintain and facilitate service registry operations." (How do you implement service discovery?)

## Visuals worth redrawing

- Client-side vs server-side discovery diagrams.

## My notes

- The "no hyphen" characters in "client‑side" are non-breaking
  hyphens (U+2011) on the page.
