---
id: aws-saas-postgres-partitioning
title: "Multi-tenant SaaS partitioning models for PostgreSQL (AWS Prescriptive Guidance)"
author: Amazon Web Services
url: https://docs.aws.amazon.com/prescriptive-guidance/latest/saas-multitenant-managed-postgresql/partitioning-models.html
kind: docs
primary: true
---

## Summary

AWS's guide to the three ways to lay out tenant data in PostgreSQL:
silo (an instance per tenant), bridge (a database or schema per tenant
on a shared instance) and pool (shared tables, row-level security). The
overview page has a trade-off table; the claims below also come from
its three sub-pages (silo.html, bridge.html, pool.html in the same
guide), which were opened too.

## Key claims

- Three models. "There are three high-level models that you can use in PostgreSQL for SaaS partitioning: silo, bridge, and pool." (overview)
- Trade-off table: silo gets compliance alignment, no cross-tenant impact, tenant-level tuning and availability, but costs agility, central management and money; pool gets agility, cost, central management and simple deployment, but has cross-tenant impact, compliance challenges and all-or-nothing availability. (overview, table)
- Silo is an instance per tenant and removes noisy neighbors. "The silo model excels at tenant performance and security isolation, and completely eliminates the noisy neighbor phenomenon." (PostgreSQL silo model page)
- Noisy neighbor, defined. "The noisy neighbor phenomenon occurs when one tenant's usage of a system affects the performance of another tenant." (silo page)
- What usually drives silo is compliance. "However, what generally drives adoption of a silo model is strict security and regulatory constraints." (silo page)
- Silo downsides: cost, no central view, slower onboarding, and a tenant-to-instance map to maintain. "One last consideration is that an application or a data access layer will have to maintain a mapping of tenants to their associated PostgreSQL instances" (silo page)
- Pool is one instance with RLS. "The pool model is implemented by provisioning a single PostgreSQL instance (Amazon RDS or Aurora) and using row-level security (RLS) to maintain tenant data isolation." (PostgreSQL pool model page)
- Pool needs extra instrumentation for per-tenant monitoring. "This is because PostgreSQL by default isn't aware of which tenant is consuming resources." (pool page)
- Noisy neighbors can't be fully removed in pool. "The noisy neighbor phenomenon cannot be completely eliminated in a pool model." (pool page)
- Some customers won't accept RLS alone. "Lastly, some SaaS customers might not find the logical separation provided by RLS to be sufficient and might ask for additional isolation measures." (pool page)
- Bridge: separate Postgres databases or schemas per tenant on shared infrastructure; same noisy-neighbor issue as pool, plus per-tenant provisioning and a tenant mapping. "The bridge model suffers from the same noisy neighbor and tenant performance isolation concerns as the pool model." (PostgreSQL bridge model page)

## Visuals worth redrawing

- The silo / bridge / pool diagrams on the three sub-pages.

## My notes

- The bridge page's first lines say "Like the pooled model, you
  provision a single PostgreSQL instance for each tenant", which reads
  as a typo for "for all tenants"; its diagrams and the rest of the
  page show one shared instance. Don't quote that sentence.
