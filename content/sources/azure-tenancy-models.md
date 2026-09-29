---
id: azure-tenancy-models
title: "Tenancy models for a multitenant solution (Azure Architecture Center)"
author: John Downs and others (Microsoft)
url: https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/tenancy-models
kind: docs
primary: true
---

## Summary

Microsoft's guide to choosing a tenancy model: defining what a tenant
is (B2B vs B2C), separating logical tenants from deployments (stamps),
isolation as a spectrum, and four common models from single-tenant
deployments to fully shared, with benefits and risks of each.

## Key claims

- Sharing nothing gets expensive. "Intuitively, you might want to avoid sharing any resources, but that approach quickly becomes expensive as your business scales and you onboard more tenants." (intro)
- In B2B, a tenant is usually a customer organization with many users. "A single tenant typically has multiple users." (Define a tenant)
- The tenancy model is also a business decision. "Selecting a tenancy model isn't only a technical decision. It's also a commercial decision." (Decide which model to use)
- In a shared deployment, isolation rests on app code and a tenant ID. "When multiple tenants share a single deployment (a set of infrastructure), you typically rely on your application code and a tenant identifier that's in a database to keep each tenant's data separate." (Tenants and deployments)
- A mapping layer routes each tenant to its deployment; deployments are also called supertenants or stamps. (Tenants and deployments)
- Isolation is a spectrum, and each tier can sit at a different point. "Instead of viewing isolation as a discrete property, consider it a spectrum." (Tenant isolation)
- Authorization must consider tenant and user. "You need a strong foundation for your identity strategy, and you need to consider both tenant and user identity in your authorization process." (Tenant isolation, Security)
- Shared infrastructure means shared outages. "If you use a single set of shared infrastructure, a problem with one component can result in an outage for all of your tenants." (Tenant isolation, Reliability)
- Single-tenant deployments: data isolated, no noisy neighbors, progressive rollouts; but cost scales with tenants. "If a single tenant requires a specific infrastructure cost, 100 tenants probably require 100 times that cost." (Automated single-tenant deployments, Risks)
- Fully shared: cheapest, but a big tenant's heavy query can hurt others and one change touches everyone. "if a large tenant tries to perform a heavy query or operation, it might affect other tenants." (Fully multitenant deployments, Risks)
- Vertically partitioned: most tenants shared, some on dedicated deployments (e.g. for performance or isolation), which may be charged more. (Vertically partitioned deployments)
- Horizontally partitioned: shared app tier, a database per tenant, to contain noisy neighbors in the component that takes the load. (Horizontally partitioned deployments)
- Test isolation. "be sure to test your solution to verify that one tenant's data isn't accidentally leaked to another and that any noisy neighbor outcomes are acceptable." (Test your isolation model)
- In B2C a tenant may be one consumer, or a family or group. "In some scenarios, each consumer might be a separate tenant. However, consider whether your solution might be used by families, groups of friends, clubs, associations, or other groups" (Define a tenant, B2C)

## Visuals worth redrawing

- The isolation continuum diagram: fully isolated to fully shared, with separate/shared compute, databases, networking, domain names.

## My notes

- Complements the AWS silo/bridge/pool naming; Azure talks about
  deployments and isolation per tier instead.
