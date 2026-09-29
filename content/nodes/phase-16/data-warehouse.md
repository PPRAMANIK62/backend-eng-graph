---
id: data-warehouse
title: Data warehouses
depth: short
phase: 16
note: >-
  A separate database for analytics, loaded from the databases that run
  the product.
needs: [oltp-vs-olap]
leads_to: [etl-vs-elt, star-schema]
compare_with: [open-table-formats]
---

# Data warehouses

A data warehouse is a separate database that exists for analysis. It's
loaded, on a schedule or continuously, from the databases that run the
product, it keeps history across all of them, and it's built for big
scans rather than quick updates. If you build the product, the
warehouse is where your data ends up, and what it needs should shape
what you send it.

## Why a separate copy

In the early 1990s, companies started gathering data from their
operational databases into one place for business analysis. A large
company might have 50 or so operational systems, each with users who
expect fast answers. Two things pushed analysis off those systems:

- Analysts' complex, ad-hoc queries could slow the operational
  systems down, so administrators didn't want them there.
- Analysts wanted what no single operational system had: long
  history, and data from several systems joined together.

So companies built a warehouse and copied data into it periodically.
The rhythm is the same today: load new data in bulk, then run queries
against it until the next load. The difference in workload behind all
this is [[oltp-vs-olap]].

## The star schema

Warehouses are usually modelled as [[star-schema|star schemas]]. Dimensional modelling
splits the world into measurements and context:

- A **fact table** has one row per event you measure, such as each
  item scanned at a checkout. It holds the numbers (quantity, amount)
  and a foreign key to each dimension.
- **Dimension tables** hold the context you filter and group by:
  which product, which store, which day, which customer.

![A star schema. In the middle, a sales fact table with foreign keys date_key, store_key, product_key and customer_key, plus quantity and amount. Around it, four dimension tables, each with a primary key: date with day, month and year; store with city and region; product with name and category; customer with name and segment.](img/data-warehouse-star-schema.svg)

*A fact table surrounded by its dimensions. Adapted from Michael Stonebraker and Uğur Çetintemel, "One Size Fits All", figure 1 (2005), and Ralph Kimball, "Fact Tables and Dimension Tables" (2003).*

A typical query [[joins]] the fact table to a few dimensions, filters on
dimension columns ("stores in the EU, last quarter") and sums the
facts. Star schemas are everywhere in warehouses and almost never
appear in product databases.

The design rules behind it, why dimensions stay flat, why the warehouse
makes its own keys, and how to record changes to dimensions, are in
[[star-schema]].

## Built for reading

A warehouse engine trades write speed for read speed almost
everywhere. It stores data by column ([[column-storage]]), and it
leans on bitmap [[indexes]] and materialized views, which product
databases rarely use.

Snowflake, a cloud warehouse, drops indexes altogether. It stores
tables as large immutable files and keeps the minimum and maximum of
each column for every file. A query's filter is checked against those
ranges, and files that can't match are never read. That metadata is
orders of magnitude smaller than the data, and nobody has to design or
maintain it.

Snowflake also split storage from compute. Classic warehouses were
shared-nothing: each machine owned its own disks and its own slice of
the rows, so compute and storage grew together. Snowflake keeps table
data in S3 ([[object-storage]]) and runs separate compute clusters
over it, because loading wants lots of I/O and little compute while
complex queries want the opposite.

## Where it gets tricky

**Freshness costs effort.** A warehouse loaded nightly is up to a day
behind. [[change-data-capture]] narrows the gap by streaming changes
instead of copying tables.

**Classic ETL pipelines didn't fit new data.** Traditional warehouses
assumed predictable data from inside the company, pushed through deep
ETL pipelines and tuned by hand. Logs, app events and other
semi-structured data broke those assumptions. How data is reshaped on
its way in is [[etl-vs-elt]].

**The table doesn't have to live inside the warehouse.** Tables can
also be kept as open files on object storage, readable by many
engines. That's [[open-table-formats]].

## What this means when you build

- Don't run analysis on the production database. Plan the copy from
  the start.
- Send data the warehouse can use: stable ids, timestamps, and a
  stream of changes rather than only the current state.
- Expect the warehouse to be behind, and know by how much.

## Further reading

- ["One Size Fits All": An Idea Whose Time Has Come and Gone](https://cs.brown.edu/~ugur/fits_all.pdf), Michael Stonebraker and Uğur Çetintemel, 2005. Why warehouses were split off from operational databases, the star schema, and how warehouse engines differ.
- [Fact Tables and Dimension Tables](https://www.kimballgroup.com/2003/01/fact-tables-and-dimension-tables/), Ralph Kimball, 2003. Facts, dimensions, surrogate keys, and why dimension tables stay flat.
- [The Snowflake Elastic Data Warehouse](https://www.cs.cmu.edu/~15721-f24/papers/Snowflake.pdf), Benoit Dageville et al., 2016. A cloud warehouse: storage on S3, separate compute, and min-max pruning instead of indexes.
