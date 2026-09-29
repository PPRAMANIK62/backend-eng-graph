---
id: azure-sql-saas-tenancy-patterns
title: "Multitenant SaaS database tenancy patterns (Azure SQL Database documentation)"
author: Microsoft
url: https://learn.microsoft.com/en-us/azure/azure-sql/database/saas-tenancy-app-design-patterns
kind: docs
primary: true
---

## Summary

Microsoft's comparison of database layouts for SaaS: a standalone app
per tenant, database per tenant, one multi-tenant database, sharded
multi-tenant databases, and a hybrid. Strong on the operational side:
restoring one tenant, schema customization, catalogs and moving tenants
between shards.

## Key claims

- The choice is expensive to change later. "Switching to a different model later is sometimes costly." (intro)
- A standalone single-tenant database has to be sized for its own peak. "But the isolation requires that sufficient resources be allocated to each database to handle its peak loads." (C, Application level isolation)
- Database-per-tenant allows per-tenant schema customization. "With database-per-tenant, customizing the schema for one or more individual tenants is straightforward to achieve." (D, Customize for a tenant)
- Restoring one tenant touches only that tenant's database. "The recovery only needs to restore the one single-tenant database that stores the tenant." (D, Automation)
- Many small databases multiply management work: 1 database with 20 indexes becomes 20,000 indexes across 1,000 databases. (D, Operations scale)
- A multi-tenant schema needs tenant identifier columns. "The schema of a multitenant database must have one or more tenant identifier columns so that the data from any given tenant can be selectively retrieved." (E)
- Shared databases give up isolation, and queries must never cross tenants. "During development, ensure that queries never expose data from more than one tenant." (E, Tenant isolation is sacrificed)
- The database can't see per-tenant resource use. "the Azure system has no built-in way to monitor or manage the use of these resources by an individual tenant." (E)
- Per-tenant restore is hard in a shared database. "One example is a point-in-time restore of the data for just one tenant." (F)
- Most SaaS requests touch one tenant, so shard by tenant. "Most SaaS applications access the data of only one tenant at a time." (G)
- Sharding needs a catalog mapping tenants to databases, plus tools to split, merge and move tenants. (G, Manage shards)
- The tenant ID leads the primary key of sharded tables. "The tenant identifier is the leading element in the primary key of all sharded tables." (G, Tenant identifier in the schema)
- Hybrid: every database has the tenant ID in its schema, so a tenant can move between a shared database and one of its own, e.g. free-trial tenants shared, premium tenants alone. (H)
- Reporting across standalone databases needs cross-database queries. "This cross-instance access can enable the vendor to centralize schema management and cross-database query for reporting or analytics purposes." (C)
- The tenant ID in the key is what lets the split/merge tool move a tenant. "The tenant identifier enables the split/merge application to quickly locate and move data associated with a specific tenant." (G, Tenant identifier in the schema)
- Tenants can be moved between shards to balance load. "Tenants might also be moved between shards to balance workloads." (G, Manage shards)
- Hybrid tiers: free trial in a shared database, basic tier in one with fewer tenants, premium alone. "When a free trial tenant subscribes to the basic service tier, the tenant can be moved to another multitenant database that might have fewer tenants." (H, Move tenants around)

## Visuals worth redrawing

- Section I comparison table (scale, isolation, cost, complexity).

## My notes

- The scale figures in section I ("1-100,000 s" etc.) are Azure SQL
  specific; don't generalize them.
