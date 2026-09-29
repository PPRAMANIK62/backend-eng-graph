---
id: cell-based-architecture
title: Cell-based architecture
depth: short
phase: 13
note: >-
  Splitting a service into independent copies to shrink the blast
  radius; shuffle sharding is a related trick.
needs: [partitioning, failure-domains]
leads_to: [shuffle-sharding]
compare_with: [multi-tenancy, multi-region, bulkheads]
---

# Cell-based architecture

A cell-based architecture runs a service as many small, complete,
independent copies, called cells, and sends each customer to one of
them. When something goes wrong in a cell, a bad deploy, a poison
request, an overload, only that cell's customers notice. You'd reach for
it when an outage for everyone at once is the thing you can least
afford.

## One service, many copies

Start with an ordinary service: app servers and a database that every
customer shares. A bad deploy can take down 100% of customers.

Now split it. Each cell is a full copy of the stack, app servers and
database included, that shares no state with any other cell. A thin
**cell router** in front looks at a partition key in each request, say
the customer ID, and forwards it to that customer's cell. A **control
plane** off to the side creates cells, retires them and moves customers
between them. This is [[partitioning]] applied to the whole service,
not just the data.

With 10 cells, a failure in one cell leaves 90% of requests untouched.
Cells don't have to mean more hardware: 30 hosts can stay 30 hosts,
grouped into cells.

## What you get

- **A smaller blast radius.** Cells are a [[failure-domains|failure
  domain]] you draw yourself, inside a zone or region. They contain
  failures that are otherwise hard to contain, like a bad code push or
  a request that crashes whatever handles it.
- **Deploys in waves.** Roll out to one cell first, as a canary, then
  the next, and roll back if anything looks wrong. See
  [[deployment-strategies]].
- **A size you can test.** Each cell has a fixed maximum size, and you
  grow by adding cells rather than growing cells. A capped cell can be
  load tested past its breaking point, so you know its safe limits.
  You can't test the whole fleet at full scale, but you can test one
  cell.

The trade-off fits in one question: is it better for 100% of customers
to see a 5% failure rate, or for 5% of customers to see a 100% failure
rate? Cells choose the second.

## Shuffle sharding

Cells split customers into disjoint groups. [[shuffle-sharding|Shuffle sharding]] is a
related trick that often travels with them, and it's easiest to see on
a small fleet.

![Three rows of eight workers. No sharding: one bad customer takes out all eight workers, 100% impact. Plain sharding into four shards of two: the bad customer's shard of two workers goes down, and every customer on that shard with it, 25% impact. Shuffle sharding: each customer gets its own random pair of workers; the bad customer's pair goes down, but a customer that shares one of those workers still has its other worker, so no other customer loses both.](img/cell-based-architecture-shuffle-sharding.svg)

*Plain sharding against shuffle sharding with eight workers. Adapted from Colm MacCárthaigh, "Workload isolation using shuffle-sharding" (Amazon Builders' Library).*

Take eight workers. With no sharding, one customer's flood or poison
request can knock over the workers one by one as its load moves to the
survivors. Everyone is down.

Plain sharding splits the eight into four shards of two. A bad customer
takes down its own shard, and everyone who shares that shard, a quarter
of the service. That's the cell idea in miniature.

Shuffle sharding gives every customer its own random pair of workers
instead. Eight workers make 28 different pairs, so the bad customer's
pair is almost never someone else's pair. A customer that shares one
worker with it still has its other worker. If clients retry on the
other worker, only the bad customer is down: an impact of about 1 in
28, seven times better than plain sharding, on the same hardware.

The numbers grow fast. Amazon Route 53 gives every domain four of its
2,048 virtual name servers: about 730 billion combinations. On top of
that, Route 53 makes sure no two domains share more than two of them.

Two things to keep straight. Shuffle sharding only works if clients try
another worker when one fails. And it isn't the same as cells: cells
share nothing across the boundary, while shuffle shards overlap on
purpose. Use shuffle sharding inside a cell, not
across cells.

## Where it gets tricky

**The router is shared.** It's the one piece that knows about every
cell, so it can't be split the way cells are, and it's a single point of
failure. It has to stay as thin as possible: map a key to a cell, and carry
no business logic.

**Some customers outgrow a cell.** With customer ID as the key, one
huge customer may not fit in one cell. You need a second dimension in
the key, or a way to split a customer, and a way to move customers
between cells from day one.

**Not everything fits the grain.** Requests that touch many customers,
like a scatter-gather query, have to go through the router to
several cells. That should be rare, or the cells aren't really
independent.

**It costs.** More copies, more infrastructure, tooling for many cells,
and a router to build. Many workloads don't need it.

Don't confuse cells with [[multi-tenancy]], which is about customers
sharing one system safely, or with [[multi-region]], which copies a
service across regions; cells limit how many customers share any one
copy.

## What this means when you build

- Pick a partition key that matches how the work naturally divides and
  is present in almost every request, like customer or account ID.
- Treat your current deployment as cell zero, put a router in front,
  and add a second cell early, so the hard parts (routing, migration,
  deploys) show up while stakes are low.
- Cap and load test the cell size, and grow by adding cells.
- Deploy cell by cell, with the first as a canary.
- Keep the router boring.

## Further reading

- [Reducing the Scope of Impact with Cell-Based Architecture](https://docs.aws.amazon.com/wellarchitected/latest/reducing-scope-of-impact-with-cell-based-architecture/reducing-scope-of-impact-with-cell-based-architecture.html), AWS Well-Architected, 2023. What a cell is, how to partition, route, size and deploy them, and when not to bother.
- [Workload isolation using shuffle-sharding](https://aws.amazon.com/builders-library/workload-isolation-using-shuffle-sharding/), Colm MacCárthaigh, Amazon Builders' Library. How Route 53 invented shuffle sharding, with the eight-worker example and real numbers.
