---
id: multi-tenancy
title: Multi-tenancy
depth: deep
phase: 15
note: >-
  Keeping customers' data apart: shared tables, schema per tenant,
  database per tenant.
needs: [authorization-models]
leads_to: [row-level-security, noisy-neighbor]
compare_with: [cell-based-architecture, bola]
---


# Multi-tenancy

A multi-tenant system serves many customers, called tenants, from
shared infrastructure. Sharing is what makes it cheap to run. It's
also what makes it dangerous: one missing filter shows one customer
another's data, and one heavy customer slows everyone else down. How
much you share, and where, is one of the first big decisions in a
software-as-a-service product, and one of the most expensive to change
later.

## What a tenant is

For a business product, a tenant is usually one customer
organization, with many users inside it. Acme is a tenant; Acme's 200
employees are its users. For a consumer product it's less clear: a
tenant could be one person, or a family sharing a plan.

That gives authorization two layers. Before asking "may Bob edit this
invoice?", you ask "does this invoice belong to Bob's tenant?". Both
tenant and user identity go into every decision. Plain roles handle
this badly, since "admin" means nothing without "admin of which
company" (see [[authorization-models]]).

## Three ways to lay out the data

AWS's guidance for Postgres names three models: silo, bridge and
pool.

![Three layouts side by side. Silo: each tenant gets its own database instance. Bridge: one shared database instance, with a separate database or schema per tenant inside it. Pool: one shared instance and one set of tables, where every row carries a tenant_id column and every query filters on it. An arrow underneath runs from "more isolation, more cost per tenant" on the silo side to "more sharing, less cost per tenant" on the pool side.](img/multi-tenancy-silo-bridge-pool.svg)

*Silo, bridge and pool. Adapted from AWS Prescriptive Guidance, "Multi-tenant SaaS partitioning models for PostgreSQL".*

**Silo: an instance per tenant.** Each tenant has its own database
server. One tenant's load can't slow another's database, a tenant's
outage stays in its silo, and you can tune tenants one at a
time. What usually pushes teams here is compliance: a customer who
insists their data sits alone, often for a higher price. The costs are
money (every instance is sized for its own peak), onboarding (a new
tenant means new infrastructure), no single view across tenants, and a
lookup table your app needs to find each tenant's database.

**Bridge: a database or schema per tenant on a shared server.** The server is shared, so it's cheaper, but each tenant still has its own
tables. It keeps some of silo's separation of data but not its separation
of load, and you still create objects for every new tenant.

**Pool: shared tables.** Every table has a `tenant_id` column and
every row belongs to one tenant. This is the cheapest per tenant by
far, onboarding is inserting a row, and there's one database to
monitor, back up and migrate. The risk moves into code: every query
has to filter on `tenant_id`, and one that doesn't leaks data. Relying
on developers to remember that WHERE clause in every statement is the
weak spot. Postgres [[row-level-security]] lets the database add the
filter itself.

Azure's sharded design goes a step further: the tenant ID is the
first column of the [[primary-keys|primary key]] of every sharded
table. That lets its tools find one tenant's rows quickly and move
them, which is what later lets you split tenants across several
databases.

## Isolation is more than data

Keeping rows apart is half the job. The other half is performance.

A [[noisy-neighbor]] is a tenant whose usage slows other tenants down.
It isn't always one giant customer: many small tenants peaking at the
same moment do it too. With shared resources you can't remove the
problem, only contain it: measure usage per tenant, limit it per tenant
with quotas and [[rate-limiting|rate limits]], and move heavy tenants
elsewhere.

Failures spread the same way. With one shared set of infrastructure,
one broken component is an outage for every tenant, and one bad
deploy reaches everyone at once. Separate deployments let you roll
changes out tenant by tenant.

## Operations change with the model

Some everyday jobs look very different depending on the layout:

- **Restoring one tenant.** A customer deletes their data by mistake.
  With a database per tenant, you restore that one database. In a
  pool, a point-in-time restore of one tenant's rows is a hard,
  custom job (see [[backups]]).
- **Schema changes.** In a pool, one migration covers everyone. With
  a database per tenant, every migration runs once per tenant: one
  database with 20 indexes becomes 20,000 indexes across 1,000
  databases.
- **Custom schemas.** With a database per tenant, one tenant can have
  an extra column or index without touching the others. In a pool,
  every tenant shares one schema.
- **Cross-tenant reporting.** In a pool, all the rows are in one
  place. With a database per tenant, reporting means querying across
  many databases.

## Mixing the models

Real systems rarely pick one model for everything. Two common mixes:

- **By tier.** Free-trial tenants share a pool, paying tenants get a
  smaller pool, premium tenants get their own database. If every
  database has the same schema with a `tenant_id` column, moving a
  tenant between them is a data copy, not a rewrite.
- **By layer.** A shared application tier in front of a database per
  tenant. The database often takes the heaviest load, so that's where
  separation pays off most.

Once tenants live in more than one place, you need a catalog that maps
each tenant to where its data is, and a request router that reads it.
That's [[partitioning]] with the tenant as the key, and moving tenants
between shards is [[rebalancing]]. Groups of full copies of the stack,
each serving a set of tenants, are called deployment stamps; compare
them with [[cell-based-architecture|cells]].

## Where it gets tricky

**Isolation is a spectrum, per layer.** Asking "are we silo or pool?"
is too coarse. The web tier, queues, caches and databases can each
sit at a different point, and usually should.

**Row-level security isn't enough for some customers.** Some
customers accept only physical separation, whatever the database
guarantees. That's a sales and compliance question as much as a
technical one.

**Silo removes the noisy database neighbor, not every neighbor.** If
the application tier, queues or network are shared, one tenant can
still hurt others there.

**The model is hard to change later.** Switching tenancy models after
launch is costly. Keeping `tenant_id` in the schema even in
single-tenant databases, as the hybrid layout above does, keeps the
door open.

**Test the isolation.** Write tests that log in as tenant A and try to
read, update and list tenant B's data through every endpoint. A missed
tenant check is the multi-tenant form of [[bola]].

## What this means when you build

- Put `tenant_id` on every tenant-owned table from day one, and
  consider making it the first column of the primary key.
- Derive the tenant from the authenticated session, never from a
  request parameter the client controls.
- Enforce the tenant filter in one place: a data-access layer or
  row-level security, not in each query by hand.
- Tag [[metrics]], logs and [[distributed-tracing|traces]] with the tenant ID, and set per-tenant
  limits before you need them.
- Start pooled unless a customer or regulator demands otherwise, and
  keep the schema ready to move a tenant out.

## Further reading

- [Multi-tenant SaaS partitioning models for PostgreSQL](https://docs.aws.amazon.com/prescriptive-guidance/latest/saas-multitenant-managed-postgresql/partitioning-models.html), AWS Prescriptive Guidance. Silo, bridge and pool, with the trade-off table and a page per model.
- [Tenancy models for a multitenant solution](https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/tenancy-models), Microsoft Azure Architecture Center. Defining a tenant, tenants vs deployments, isolation as a spectrum, and the four common models.
- [Multitenant SaaS database tenancy patterns](https://learn.microsoft.com/en-us/azure/azure-sql/database/saas-tenancy-app-design-patterns), Microsoft Azure SQL documentation. The operational side: per-tenant restore, schema at scale, sharding by tenant, hybrid layouts.
- [Noisy Neighbor antipattern](https://learn.microsoft.com/en-us/azure/architecture/antipatterns/noisy-neighbor/noisy-neighbor), Microsoft Azure Architecture Center. What a noisy neighbor is and how to contain one.
- [Multi-tenant data isolation with PostgreSQL Row Level Security](https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/), Michael Beardsley, AWS, 2020. Why the WHERE clause is the weak spot in a pool, and moving it into the database.
- [Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html), OWASP Cheat Sheet Series. Why plain RBAC fits multi-tenant access badly.
