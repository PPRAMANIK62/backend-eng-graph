---
id: envoy-load-balancers
title: Supported load balancers (Envoy architecture overview)
author: Envoy Project Authors
url: https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/load_balancers
kind: docs
primary: true
---

## Summary

Envoy's list of load balancing policies, read from the docs for Envoy
1.40.0-dev: weighted round robin, client-side weighted round robin fed
by backend load reports, least request (power of two choices), ring
hash, Maglev and random.

## Key claims

- Without active health checking, every host counts as healthy. "Note that if no active health checking policy is configured for a cluster, all upstream cluster members are considered healthy" (Supported load balancers)
- Weighted round robin: hosts with higher weight come up more often in the rotation. "higher weighted endpoints will appear more often in the rotation to achieve the effective weighting." (Weighted round robin)
- Client-side weighted round robin takes weights from ORCA load reports: queries per second, errors per second, utilization. "endpoint weights are derived from load reports sent by upstreams via ORCA (Open Request Cost Aggregation)" (Client-side weighted round robin)
- The weight formula is qps / (utilization + eps/qps * error_utilization_penalty). (Client-side weighted round robin)
- Least request with equal weights picks N random hosts (2 by default) and takes the one with fewest active requests. "An O(1) algorithm which selects N random available hosts as specified in the configuration (2 by default) and picks the host which has the fewest active requests" (Weighted least request)
- It cites Mitzenmacher: nearly as good as a full scan. "(Mitzenmacher et al. has shown that this approach is nearly as good as an O(N) full scan)" (Weighted least request)
- P2C resists herding. "P2C selection is particularly useful for load balancer implementations due to its resistance to herding behavior." (Weighted least request)
- With unequal weights: effective weight = weight / (active_requests + 1)^bias, bias 1.0 by default; a host with weight 2 and 4 active requests gets 0.4. (Weighted least request)
- In that mode a busy host never fully drains. "unlike P2C, a host will never truly drain, though it will receive fewer requests over time." (Weighted least request)
- Ring hash is consistent hashing; only useful when routing supplies a value to hash. "it is only effective when protocol routing is used that specifies a value to hash on." (Ring hash)
- Each host is hashed onto a ring; a request goes to the nearest host clockwise from its own hash. "each request is then routed to a host by hashing some property of the request, and finding the nearest corresponding host clockwise around the ring." (Ring hash)
- Adding or removing one host of N moves 1/N of requests. "the addition or removal of one host from a set of N hosts will affect only 1/N requests." (Ring hash)
- Maglev uses a fixed table of 65537 entries. "with a fixed table size of 65537" (Maglev)
- Maglev builds and looks up faster than ring hash, but moves more keys when hosts change, about double. "More keys will move position when hosts are removed (simulations show approximately double the keys will move)." (Maglev)
- Random beats round robin when there are no health checks. "The random load balancer generally performs better than round robin if no health checking policy is configured." (Random)
- Why: round robin sends a failed host's share to the next host in the list. "Random selection avoids bias towards the host in the set that comes after a failed host." (Random)

## Visuals worth redrawing

None.

## My notes

- Docs track "latest"; pin to 1.40.0-dev when citing numbers.
