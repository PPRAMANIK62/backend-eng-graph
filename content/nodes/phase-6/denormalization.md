---
id: denormalization
title: Denormalization
depth: short
phase: 6
note: >-
  Copying data on purpose to make reads faster, and paying for it on
  writes.
needs: [normalization]
leads_to: [feed-fan-out, cqrs]
compare_with: [normalization, caching]
---

# Denormalization

Denormalization is storing a copy of data you could compute from other
tables, so that a read doesn't have to compute it. It makes a hot read
path cheaper and moves the work to writes, which now have to keep every
copy correct. It's the deliberate opposite of [[normalization]], and it
only pays off when you know which read you're speeding up and what
keeps the copy right.

## What it looks like

A normalized shop stores each fact once. The order list page wants,
for each order, the customer's name and the number of items. Normalized,
that's a join to `customers` and a count over `order_items` on every
page load. Three common ways to copy data instead:

- **Copy a column.** Store `customer_name` on each `orders` row. The
  list page reads one table.
- **Store a derived value.** Keep `item_count` on `orders`, updated
  whenever an item is added or removed. No count at read time.
- **Store a whole query's result.** A summary table, such as daily sales
  per seller, rebuilt on a schedule. Postgres has this built in as a
  materialized view.

The document database version is nesting: store each customer as one
JSON document with their orders inside it, so one fetch returns the lot
(see [[data-models]]).

## The bill comes on writes

Every copy is a second place a fact lives, and it can drift from the
first. When a customer renames themselves, every `orders.customer_name`
copy needs updating, in the same [[transaction]] if you want them to
agree. Each insert into `order_items` now also has to update `orders`,
so every write does more work.

There are three broad ways to keep a copy up to date, each with its own
cost:

- **In application code**, in the same transaction as the write. Easy to
  forget in one code path.
- **In the database**, with [[triggers]] that update the copy on every
  change. Consistent, but every write pays for it.
- **On a schedule**, like a materialized view you refresh nightly. Cheap
  writes, but reads see stale data between refreshes.

The materialized view case shows the trade plainly. Reading a stored
result is often much faster than running the query over the base
tables, but the data is only as fresh as the last refresh, and the view
can't be updated directly. For a dashboard of yesterday's sales that's
fine. For a bank balance it isn't.

## Where it gets tricky

**It's not always faster.** The case against pre-joined, nested data
goes back to the 1970s and has three parts. If the relationship isn't
one-to-many, nesting duplicates data. A pre-joined copy isn't
necessarily faster than a join with the right index. And you lose data
independence: the stored shape is tuned for one read, and a different
question (all orders for a product, across customers) gets harder.

**The N+1 argument cuts both ways.** Document databases often sell
nesting as the cure for the ORM [[n-plus-one]] problem, one query per
related object. A single join fixes that in a relational database
without copying anything.

**It's a cache with a different name.** A denormalized column is a
cache kept inside the database, and it has the same questions as any
cache ([[caching]]): who updates it, when, and what readers see in
between.

## What this means when you build

- Normalize first. Denormalize a specific read path after you've seen it
  be slow and tried indexes and a better query.
- For every copy, write down what keeps it correct: a transaction, a
  trigger, or a refresh schedule, and how stale it's allowed to be.
- Prefer copies that are cheap to rebuild from the source of truth, so a
  drift can be fixed by recomputing.
- Social feeds are a large-scale version of the same trade: do more
  work when a post is written so that reading a feed is cheap
  ([[feed-fan-out]]).

## Further reading

- [Materialized Views](https://www.postgresql.org/docs/current/rules-materializedviews.html), PostgreSQL 18 documentation. Storing a query's result in a table, reading it fast, and living with data that isn't always current.
- [What Goes Around Comes Around... And Around...](https://db.cs.cmu.edu/papers/2024/whatgoesaround-sigmodrec2024.pdf), Michael Stonebraker and Andrew Pavlo, 2024. Section 2.3: why document databases denormalize, and the three old problems with pre-joining.
