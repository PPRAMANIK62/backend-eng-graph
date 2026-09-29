---
id: google-sre-lb-frontend
title: "Load Balancing at the Frontend (Site Reliability Engineering, ch. 19)"
author: Piotr Lewandowski, edited by Sarah Chavis
url: https://sre.google/sre-book/load-balancing-frontend/
kind: book
primary: true
---

## Summary

How Google spreads user traffic before it reaches a server (2017): DNS
load balancing as the first layer, then virtual IPs served by a
network load balancer, which has to keep each connection on one
backend. Explains why `hash mod N` fails, consistent hashing, and the
ways a packet can be forwarded (NAT, layer 2 rewrite with direct
server response, GRE encapsulation).

## Key claims

- Google balances at several levels. "At Google, we’ve approached the problem by load balancing at multiple levels" (intro)
- Inside a datacenter, the goal is using resources well and not overloading any one server. "optimal distribution of load focuses on optimal resource utilization and protecting a single server from overloading." (intro)
- DNS is the first layer: return several addresses. "The simplest solution is to return multiple A or AAAA records in the DNS reply and let the client pick an IP address arbitrarily." (Load Balancing Using DNS)
- It gives little control. "records are selected randomly, and each will attract a roughly equal amount of traffic." (Load Balancing Using DNS)
- Recursive resolvers sit between users and the authoritative server, and cache by TTL, which bounds how fast changes spread. "DNS records need a relatively low TTL. This effectively sets a lower bound on how quickly DNS changes can be propagated to users." (Load Balancing Using DNS)
- A DNS server can answer with addresses of the closest datacenter. "In its reply, the server can return addresses routed to the closest datacenter." (Load Balancing Using DNS)
- One cached answer can reach thousands of users. "a single authoritative reply may reach a single user or multiple thousands of users." (Load Balancing Using DNS)
- The authoritative server can't flush resolver caches. "Given that authoritative nameservers cannot flush resolvers’ caches, DNS records need a relatively low TTL." (Load Balancing Using DNS)
- Not every resolver honours the TTL. "Sadly, not all DNS resolvers respect the TTL value set by authoritative nameservers." (footnote 104)
- SRV records could carry weights and priorities, but HTTP doesn't use them. "In theory, we could use SRV records to specify record weights and priorities, but SRV records have not yet been adopted for HTTP." (Load Balancing Using DNS)
- DNS alone isn't enough; VIPs come next. "it should be clear that load balancing with DNS on its own is not sufficient." (Load Balancing Using DNS)
- A VIP is shared by many machines and served by a network load balancer. "Virtual IP addresses (VIPs) are not assigned to any particular network interface. Instead, they are usually shared across many devices." (Load Balancing at the Virtual IP Address)
- Picking the least loaded backend per packet breaks stateful protocols; the balancer must track connections or hash. "this logic breaks down quickly in the case of stateful protocols, which must use the same backend for the duration of a request." (Load Balancing at the Virtual IP Address)
- `id(packet) mod N` remaps almost every connection when N changes. "Almost every packet suddenly maps to a different backend!" (Load Balancing at the Virtual IP Address)
- Consistent hashing keeps the mapping stable when backends change; Google uses connection tracking normally and consistent hashing under pressure. "we can usually use simple connection tracking, but fall back to consistent hashing when the system is under pressure" (Load Balancing at the Virtual IP Address)
- Direct Server Response: rewrite the MAC, backend replies straight to the client; needs everything in one layer 2 domain. "If user requests are small and replies are large (e.g., most HTTP requests), DSR provides tremendous savings" (Load Balancing at the Virtual IP Address)
- Google now uses GRE encapsulation, which adds 24 bytes for IPv4 and can push packets past the MTU. "Encapsulation introduces overhead (24 bytes in the case of IPv4+GRE, to be precise)" (Load Balancing at the Virtual IP Address)
- A larger MTU inside the datacenter avoids the fragmentation. "Once the packet reaches the datacenter, fragmentation can be avoided by using a larger MTU within the datacenter" (Load Balancing at the Virtual IP Address)

## Visuals worth redrawing

None used.

## My notes

- Uses the OSI numbering for layer 2 ("layer 2 of the OSI networking
  model").
