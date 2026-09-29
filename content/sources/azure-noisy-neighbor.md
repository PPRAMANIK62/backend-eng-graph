---
id: azure-noisy-neighbor
title: "Noisy Neighbor antipattern (Azure Architecture Center)"
author: Microsoft
url: https://learn.microsoft.com/en-us/azure/architecture/antipatterns/noisy-neighbor/noisy-neighbor
kind: docs
primary: true
---

## Summary

What the noisy neighbor problem is in a shared system, why you can't
remove it entirely, and what clients and providers can do: per-tenant
monitoring, quotas and throttling, rebalancing tenants, limiting
expensive operations.

## Key claims

- Definition. "The noisy neighbor problem occurs when one tenant's performance is degraded because of the activities of another tenant." (Context and problem)
- It can come from many small tenants peaking together, not only one big one. "The noisy neighbor problem also occurs when each individual tenant consumes only a small portion of the system's capacity." (Context and problem)
- You can't remove it completely when sharing. "Sharing a single resource inherently carries the risk of noisy neighbor problems that you can't completely avoid." (Solution)
- Monitor per tenant, not just overall. "Monitor both the overall resource usage and the resources that each tenant uses." (Actions that service providers can take)
- Apply quotas, throttling and rate limits per tenant. (Actions that service providers can take)
- Limit expensive operations, e.g. a maximum record count or query time limit. (Actions that service providers can take)
- Treat it as resource governance. "it's important to treat these problems as resource governance problems and to apply usage quotas, throttling, and governance controls to mitigate the problem." (Considerations)
- Rebalance tenants across instances or stamps. "If you host multiple instances of your solution, consider rebalancing tenants across the instances or stamps." (Actions that service providers can take)
- What clients see. "From a client's perspective, the noisy neighbor problem typically manifests as failed requests to the service or as requests that take a long time to complete." (How to detect the problem)
- The tell: failures that look random. "if the same request succeeds at other times and appears to fail randomly, there might be a noisy neighbor problem." (How to detect the problem)
- Look for failures in tenants that aren't using much. "Look for failures that occur when a tenant isn't consuming a large share of the system's resources." (How to detect the problem)
- Tag usage with the tenant. "include the tenant's identifier in the telemetry so that you can aggregate" (How to detect the problem)
- Tell clients about limits. "Be transparent with clients about any throttling mechanisms or usage quotas that you enforce." (Considerations)
- Resource governance. "Consider applying policies that prevent a single tenant from overwhelming the system and reducing the capacity available to other tenants." (Actions that service providers can take)

## Visuals worth redrawing

None.

## My notes

- Pairs with bulkheads and rate limiting nodes.
