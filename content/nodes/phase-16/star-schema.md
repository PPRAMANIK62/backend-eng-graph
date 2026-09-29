---
id: star-schema
title: Star schemas
depth: short
phase: 16
note: >-
  A fact table of events surrounded by dimension tables: the classic
  data warehouse layout.
needs: [data-warehouse]
leads_to: []
compare_with: [normalization]
---

# Star schemas

A star schema is the classic way to lay out a
[[data-warehouse|data warehouse]]: one big table of events in the
middle, surrounded by small tables that describe them. Draw it and it
looks like a star. It's built for the questions analysts ask all day,
"sales by region by month", and it breaks several rules you'd follow in
a product database, on purpose.

## Facts and dimensions

Dimensional modelling starts by splitting the world into measurements
and context.

- **Facts** are the measurements: numbers taken again and again, like
  the quantity and amount of each item scanned at a checkout. They go in
  a **fact table**, one row per measured event.
- **Dimensions** are the context you filter and group by: which product,
  which store, which day, which customer. Each is a **dimension table**.

A fact table in a pure star schema holds a foreign key to each dimension
and the facts themselves. A typical query [[joins]] the fact table to a
few dimensions, filters on dimension columns ("stores in the EU, last
quarter"), and sums the facts.

## First, declare the grain

Before choosing any dimension or fact, you decide the fact table's
**grain**: exactly what one row represents. "One row per item scanned at
a checkout" is a grain; "one row per store per day" is another. Every
dimension and fact must fit it, and different grains never share a fact
table.

Start at the **atomic** grain, the lowest level the business process
captures. Summaries can always be built from atomic rows, and they can't
answer a question nobody predicted. Rolled-up tables are for
performance, added later.

## Rules that look wrong but aren't

**Dimensions are flat.** A product's category is a column in the product
table, not a table of its own. That's [[denormalization]]. Splitting it
out (a "snowflake" schema) would add a join to every query, and flat
tables are much faster to query.

**Keys are the warehouse's own.** The foreign keys between facts and
dimensions should be plain integers the warehouse assigns in sequence,
[[primary-keys|surrogate keys]], not the ids from the source systems.
Don't build warehouse keys out of the sources' natural keys: as the
next section shows, the warehouse often needs several rows for what the
source calls one thing.

## Dimensions change slowly

A store moves to another region. A product changes category. Facts
recorded earlier should usually still add up under the old value, and
later ones under the new. This is the problem of **slowly changing
dimensions**, with named ways to handle it:

- **Type 1: overwrite.** Replace the old value in the dimension row. It's
  simple and adds no rows, but it destroys history: every past sale now
  appears under the new category, and any aggregate tables built on the
  old value have to be recomputed.
- **Type 2: add a new row.** Insert a new dimension row with the new
  value and a new surrogate key. Facts from then on use the new key; old
  facts keep pointing at the old row. The dimension gets at least three
  extra columns: when the row became effective, when it expired, and a
  flag marking the current row.

![Two tables. The product dimension has two rows for the same product, sku A-17 "Robot kit": key 101 with category Toys, marked not current, and key 245 with category Games, marked current. The sales facts table has four sales: sales 1 and 2 point to key 101, sales 3 and 4 to key 245.](img/star-schema-scd-type-2.svg)

*A type 2 change: one product, two dimension rows, so old and new facts keep their own category.*

Type 2 is why surrogate keys matter: one product now has two rows, so
the product's own id can't be the key.

## Where it gets tricky

**The grain is a contract.** Adding a fact at a different grain to an
existing table (a daily target next to per-sale amounts) quietly breaks
every sum. Put it in its own fact table.

**Type 2 dimensions grow.** Every change to a tracked attribute adds a
row, and queries that want "the current product" must filter on the
current-row flag.

## What this means when you build

- Write down the grain of each fact table in one sentence before
  designing it.
- Keep dimensions flat and wide; don't normalize them.
- Generate surrogate keys in the warehouse, and keep the source id as an
  ordinary column.
- Decide per attribute whether history matters (type 2) or not (type 1).

## Further reading

- [Fact Tables and Dimension Tables](https://www.kimballgroup.com/2003/01/fact-tables-and-dimension-tables/), Ralph Kimball, 2003. Facts and dimensions, flat dimensions, and surrogate keys.
- [Declare the Grain](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/grain/), Kimball Group. What a fact table row represents, and why to start atomic.
- [Type 1: Overwrite](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/type-1/), Kimball Group. Overwriting a dimension attribute, and what it destroys.
- [Type 2: Add New Row](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/type-2/), Kimball Group. Keeping history with new rows and new surrogate keys.
