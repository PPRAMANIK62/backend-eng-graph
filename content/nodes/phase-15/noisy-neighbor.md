---
id: noisy-neighbor
title: Noisy neighbors
depth: short
phase: 15
note: >-
  One tenant using so much of a shared resource that the others slow
  down, and the limits that stop it.
needs: [multi-tenancy]
leads_to: []
compare_with: [bulkheads]
---

# Noisy neighbors

In a [[multi-tenancy|multi-tenant]] system, tenants share machines,
databases and queues. A noisy neighbor is a tenant whose usage slows
the others down: one customer's bulk export makes everyone's requests
time out. It isn't always one giant customer. Many small tenants
peaking at the same moment do it too. Wherever tenants share a
resource, the risk can't be removed, only contained.

## How it shows up

From a tenant's side, the symptoms are failed requests or requests that
take much longer than usual. The tell is randomness: the same request
succeeds at other times and seems to fail for no reason, and it fails
even though this tenant isn't using much of anything. From the
service's side, you often can't see the cause at all, because a shared
database has no idea which tenant its CPU is working for.

## Containing it

**Measure per tenant.** Watch overall resource usage and each tenant's
share of it. That means putting the tenant ID in your own metrics and
logs, down to the cost of each request, so you can add usage up by
tenant and alert on spikes.

**Govern resources per tenant.** Treat it as a resource governance
problem:

- quotas on how much each tenant may store or run;
- [[rate-limiting|rate limits]] and throttling per tenant, not only
  globally;
- limits on expensive operations, such as a maximum number of records
  per query or a time limit.

This is the same idea as [[bulkheads]]: one tenant's load shouldn't be
able to reach everyone's capacity.

**Move tenants.** If you run several instances or deployment stamps,
rebalance heavy tenants across them, or give the heaviest their own. A
[[cell-based-architecture]] makes that a normal operation, and
[[shuffle-sharding]] makes it unlikely that a bad tenant shares all its
workers with any other tenant.

**Scale where you can.** Automation that scales out when usage spikes
buys headroom, though a single tenant can still exhaust whatever it
shares with others.

## Where it gets tricky

**Limits surprise people.** A quota or throttle turns a slowdown for
everyone into an error for one tenant. Be open about the limits you
enforce, so clients retry sensibly and aren't caught off guard.

**The noisiest isn't always to blame.** Many modest tenants at once can
cause the same symptoms as one large one. Per-tenant limits help less
when no single tenant is over its limit.

**Isolation by deployment has limits too.** Giving a tenant its own
database removes the shared-database neighbor, but any other shared
piece, a queue, a cache, a network link, can still carry the problem.

## What this means when you build

- Put the tenant ID on every metric, log line and trace from the start.
- Enforce per-tenant quotas and rate limits, and cap expensive queries.
- Keep a way to move a tenant to other capacity without downtime.
- Document the limits, and return clear errors when a tenant hits them.

## Further reading

- [Noisy Neighbor antipattern](https://learn.microsoft.com/en-us/azure/architecture/antipatterns/noisy-neighbor/noisy-neighbor), Microsoft Azure Architecture Center. How the problem shows up, how to detect it per tenant, and the governance, monitoring and rebalancing that contain it.
