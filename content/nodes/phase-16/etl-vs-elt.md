---
id: etl-vs-elt
title: ETL vs ELT
depth: short
phase: 16
note: >-
  Transform the data before loading it into the warehouse, or after.
needs: [data-warehouse]
leads_to: []
compare_with: [backfills]
---

# ETL vs ELT

Getting data from the product's databases into a [[data-warehouse]]
takes three steps: extract it from the sources, transform it into the
shape analysts need, and load it. ETL and ELT are the two orders to do
them in. ETL transforms on the way in; ELT loads the raw data first and
transforms it inside the warehouse. The order decides what you can
still fix later.

## The three steps

- **Extract** reads data from the sources: the application's
  databases, tools like the CRM and billing system, APIs, event logs.
- **Transform** cleans and reshapes it: cast types, put timestamps in
  one time zone, rename fields, [[joins|join]] tables, apply
  business rules, and test the result (are the keys unique?).
- **Load** writes it into the warehouse.

![Two pipelines. ETL: sources (app database, CRM and billing, event logs) are extracted into a separate transform server that cleans, casts, renames, joins and applies rules, and only then loaded into the warehouse as modeled tables. ELT: the same sources are loaded as is into the warehouse as raw tables, and a transform step inside the warehouse turns them into modeled tables.](img/etl-vs-elt-pipelines.svg)

*Same three steps, different order. In ELT the raw data stays in the warehouse.*

## ETL: transform first

In ETL, data passes through a separate processing server that turns it
into a target schema designed in advance, and only the result is
loaded. That means deciding the types, structures and relationships
before any data moves.

The cost shows when something changes. A new field or a changed
definition means changing the pipeline, and in a large company that
can take coordination across several departments and months of work.
Worse, because records were transformed as they arrived, a changed
definition applied only to records processed after the change. Older
rows kept the old meaning.

## ELT: load first

ELT loads the raw data as it is and transforms it later, inside the
warehouse, with SQL. Snowflake, for example, can load raw JSON into a
column without anyone declaring a schema first, an approach called
"schema later".

Three things follow:

- **The transform runs on the warehouse's own engine,** with parallel
  joins, sorts and aggregates that classic ETL tools handled poorly.
- **The raw data stays.** Change a field's definition and you can
  rebuild the modeled tables over all of history, not only new rows.
  That rebuild is a [[backfills|backfill]].
- **Transforms become rerunnable.** With the same raw data and the same
  transform code you get the same tables every time, so a transform is
  [[idempotency|idempotent]] and can be treated like code: kept in
  version control and tested before it runs. Tools like dbt exist to
  manage these SQL transforms.

## When ETL still makes sense

- **Data that must not land raw.** If personal data has to be masked
  or removed before anyone can query it, that happens before loading.
  Heavily regulated fields like finance and healthcare often need data
  cleaned and validated before it enters the warehouse.
- **Floods of device data.** Sensor streams are often filtered,
  averaged and deduplicated near the source, and only the reduced data
  is loaded.
- **Both at once.** Many organizations use ETL for some sources and
  ELT for the rest.

## Where it gets tricky

**The letters hide the real problem.** Much of the pain blamed on ETL
came from long chains of stored procedures that nobody could trace or
test, not from the order of the steps. ELT with untested SQL can be
just as hard to follow.

**ELT puts the load on the warehouse.** The transforms run on the
warehouse's compute, next to the analysts' queries.

## What this means when you build

- Keep the raw copy, and make every transform rerunnable from it.
- Decide what must never reach the warehouse, such as personal data,
  and strip it before loading.
- Treat transforms as code: version them, test them, and be able to
  rebuild everything from raw.

## Further reading

- [The Snowflake Elastic Data Warehouse](https://www.cs.cmu.edu/~15721-f24/papers/Snowflake.pdf), Benoit Dageville et al., 2016. Section 4.3 explains why schema-later loading enables ELT, and what classic ETL pipelines cost to change.
- [Understanding ELT: Extract, Load, Transform](https://docs.getdbt.com/terms/elt), dbt Labs. What ELT looks like day to day, from the makers of a transform tool, including when ETL is still the better fit.
- [What's the Difference Between ETL and ELT?](https://aws.amazon.com/compare/the-difference-between-etl-and-elt/), AWS. Plain definitions, and the cases where ETL still wins: personal data and high-frequency device data.
