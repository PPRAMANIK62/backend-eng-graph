---
id: eisenbud-maglev-2016
title: "Maglev: A Fast and Reliable Software Network Load Balancer"
author: Danielle E. Eisenbud, Cheng Yi, Carlo Contavalli, Cody Smith, Roman Kononov, Eric Mann-Hielscher, Ardas Cilingiroglu, Bin Cheyney, Wentao Shang, Jinnah Dylan Hosein (Google)
url: https://research.google.com/pubs/archive/44824.pdf
kind: paper
primary: true
---

## Summary

Google's software network (layer 4) load balancer, NSDI 2016. Routers
spread packets across Maglev machines with ECMP; each Maglev picks a
backend for the packet's connection and forwards it in a GRE tunnel;
replies skip Maglev. Connection tracking plus a new consistent hashing
scheme (Maglev hashing) keep a connection on one backend even when
Maglevs or backends change.

## Key claims

- Routers spread packets to Maglev machines by ECMP, and each Maglev spreads them to endpoints. "Network routers distribute packets evenly to the Maglev machines via Equal Cost Multipath (ECMP)" (Abstract)
- In production since 2008. "Maglev has been serving Google’s traffic since 2008." (Abstract)
- Hardware load balancers only give 1+1 redundancy and don't scale out. "Though often deployed in pairs to avoid single points of failure, they only provide 1+1 redundancy." (1 Introduction)
- A hardware balancer is capped by one unit's capacity. "their scalability is generally constrained by the maximum capacity of a single unit" (1 Introduction)
- A software balancer on many machines scales out and gives N+1 redundancy. "Availability and reliability are enhanced as the system provides N+1 redundancy." (1 Introduction)
- Packets of one connection must reach the same endpoint. "packets belonging to the same connection should always be directed to the same service endpoint." (1 Introduction)
- Each service has VIPs announced over BGP; Maglev encapsulates with GRE to the endpoint. "encapsulates the packet using Generic Routing Encapsulation (GRE) with the outer IP header destined to the endpoint." (2.1)
- Replies go directly to the router (Direct Server Return), so Maglev only handles incoming packets. "We use Direct Server Return (DSR) to send responses directly to the router" (2.1)
- Backend pools have health checks; only healthy backends get packets. "packets will only be forwarded to the healthy backends." (2.2)
- Two-part backend selection: consistent hashing, then record the choice in a local connection tracking table keyed by the 5-tuple hash. "First, we select a backend using a new form of consistent hashing which distributes traffic very evenly. Then we record the selection in a local connection tracking table." (3.3)
- Connection tracking alone fails when the set of Maglevs changes, because ECMP reshuffles connections to Maglevs that have no table entry. "All of these operations make standard ECMP implementations shuffle traffic on a large scale, leading to connections switching to different Maglevs in mid-stream." (3.3)
- The tracking table can also fill up under load or SYN floods. "The table may fill up under heavy load or SYN flood attacks." (3.3)
- Consistent hashing wants two properties: even load and minimal disruption. "minimal disruption: when the set of backends changes, a connection will likely be sent to the same backend as it was before." (3.4)
- Maglev favours even load over minimal disruption. "Both [28] and [38] prioritize minimal disruption over load balancing, as they were designed to optimize web caching on a small number of servers. However, Maglev takes the opposite approach" (3.4)
- Uneven load means over-provisioning every backend. "Otherwise the backends must be aggressively overprovisioned in order to accommodate the peak traffic." (3.4)
- Maglev hashing: each backend has a preference list of table slots; backends take turns filling their most preferred empty slot. "Then all the backends take turns filling their most-preferred table positions that are still empty, until the lookup table is completely filled in." (3.4)
- Table size M is prime and much larger than the backend count; M > 100 x N keeps shares within 1%. "In practice, we choose M to be larger than 100 × N to ensure at most a 1% difference in hash space assigned to backends." (3.4)
- Default table size 65537. "In practice we use 65537 as the default table size" (5.3)

## Visuals worth redrawing

- Figure 2 (packet flow: router, ECMP to Maglevs, GRE to endpoint,
  DSR reply).
- Table 1 (a 7-slot lookup table before and after removing a backend).

## My notes

- The "layer 4" wording isn't in the paper; it calls itself a network
  load balancer for TCP and UDP endpoints.
