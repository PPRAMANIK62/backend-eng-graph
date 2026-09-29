---
id: oltp-vs-olap
title: OLTP vs OLAP
depth: deep
phase: 16
note: >-
  Many small transactions vs a few huge scans, and why one database
  rarely does both well.
needs: [transaction]
leads_to: [column-storage, data-warehouse]
compare_with: []
---

# OLTP vs OLAP

OLTP (online transaction processing) is the work a product does all
day: many small reads and writes, each touching a few rows, each
answered in milliseconds. OLAP (online analytical processing) is the
work behind reports and dashboards: a few big queries that scan and
aggregate millions or billions of rows. The two want opposite things
from a database, which is why most companies run two kinds, and why
you should know which kind a query is before you run it.

## Two queries against one shop

Take an online shop with an `orders` table. The checkout code runs
queries like "fetch order 1042" or "insert this order and take one off
the stock count", each inside a [[transaction]]. Each one touches a
few rows, reads every column of them, and has to be quick because a
customer is waiting. Thousands of them run at the same time.

Now someone asks for revenue by region, per month, over the last
three years. That query reads every order ever placed, but only two or
three columns of each: region, date, amount. It changes nothing. A few
seconds is fine. And only a handful of queries like it run at once.

![Two copies of the same orders table with columns id, cust, item, region and amount. On the left, the query SELECT * FROM orders WHERE id = 1042 highlights one whole row. On the right, a query summing amount grouped by region highlights the region and amount columns across every row.](img/oltp-vs-olap-access-patterns.svg)

*The same table, read two ways. OLTP reads across a row; OLAP reads down a few columns.*

Same table, same [[sql|SQL]], opposite shapes. OLTP and OLAP name
kinds of work, and one product can see both. The "online" in both
names just means interactive, as opposed to overnight
[[batch-processing|batch jobs]]. E.F. Codd coined the term OLAP in 1993 to set analytical work
apart from the transactional work the databases of the time were
built for.

## What each side wants from storage

**OLTP wants each row kept together.** A row store like Postgres or
[[sqlite|SQLite]] keeps all the columns of a row next to each other.
Fetching order 1042 means finding it through a
[[b-plus-tree|B-tree index]] and reading one page. Saving a new order
is one write of one row. That's why the classic design is called
write-optimized: a single disk write stores a whole record.

**OLAP wants each column kept together.** A disk reads whole blocks,
never a few bytes. So a row store answering the revenue question
pulls every column of every order into memory, including the ones the
query never looks at. Analytical tables can be wide, with a hundred or
more columns, so most of those bytes are wasted. A column store
keeps each column on its own, and the query reads only region, date
and amount. That's [[column-storage]], and it's the biggest single
difference between the two kinds of engine.

The rest follows from there:

| | OLTP | OLAP |
|---|---|---|
| Typical query | one order, one customer | revenue by region over years |
| Rows per query | a few | millions to billions |
| Columns per query | the whole row | a few out of many |
| Writes | single rows, all day | bulk loads, mostly appends |
| Queries at once | thousands of small ones | tens to hundreds of big ones |
| Storage | rows, with B-tree indexes | columns, compressed |
| Schema | [[normalization\|normalized]] | star schema or wide [[denormalization\|denormalized]] tables |

The difference goes past the disk into the query engine. Analytical
engines work through a batch of column values per step instead of one
row at a time, which is [[vectorized-execution]].

## Why one database rarely does both well

Almost every choice that helps one workload hurts the other.

- **Layout.** A row store reads too much for a scan. A column store
  has to visit every column's storage to read or change one whole row,
  so point lookups and single-row writes get slower.
- **Indexes.** OLTP runs on B-trees. Warehouse engines lean on bitmap
  [[indexes]] and materialized views, neither of which works well for
  OLTP.
- **Encoding.** Squeezing a US state into six bits, instead of a
  two-letter string, is worth it when you scan billions of them. In
  OLTP it isn't worth the trouble.
- **Updates.** Column stores compress their data and often keep it
  sorted, so changing one value means decompressing, editing and
  recompressing. They cope by taking writes in batches.
- **Sharing a machine.** Even with the right engine, mixing the two on
  one server is risky. One ad-hoc scan can take the disk and CPU that
  checkout needs. That's why database administrators have long kept
  analysts off the operational databases.

Vendors that sold one database for everything often shipped two
engines behind one SQL parser: an OLTP engine with B-trees and a
standard optimizer, and a warehouse engine with bitmap indexes,
materialized views and star-schema tricks.

## Two systems and a pipe between them

So most setups split the work. The product runs on an OLTP database,
often Postgres. Its data is copied, in batches or continuously with
[[change-data-capture]], into an analytical store: a
[[data-warehouse]] such as Snowflake, BigQuery or Redshift, or an
engine like ClickHouse. Dashboards and analysts query the copy. Where
and when the data gets reshaped on the way is [[etl-vs-elt]].

The cost is a second system to run, and a copy that is always a little
behind the source.

## Where it gets tricky

**OLAP is a kind of query, not a kind of product.** A data warehouse
is one place to run OLAP queries. Embedded engines like DuckDB and
real-time engines like ClickHouse run them too. "OLAP" and "data
warehouse" aren't the same thing.

**"Wide-column" doesn't mean columnar.** Cassandra, HBase and Bigtable
are called wide-column stores, but they're row stores underneath. They
aren't columnar OLAP engines.

**OLAP used to mean cubes.** For its first two decades, OLAP mostly
meant pre-built cubes: summaries computed ahead of time along fixed
dimensions, so a query became a lookup. Column engines now aggregate
the raw data at query time fast enough that cubes are mostly a legacy
pattern. Materialized views play that role when you still want it.

**People keep trying to do both.** Some systems aim to handle both
workloads, often under the name HTAP. The idea is old: C-Store, an
early column store, paired a small write-optimized store with its big
read-optimized one and moved rows across in batches. DuckDB is built
for analytics but was designed not to give up OLTP completely, because
dashboards often have some threads updating data while others query
it. Postgres extensions such as Citus, Timescale and pg_duckdb add
some analytics to Postgres. All of these narrow the gap. None of them
make the trade-offs above go away.

**Embedded or server is a separate question.** SQLite is an embedded
OLTP database: a row-oriented engine over B-trees, and poor at
analytics. DuckDB was built to be the embedded OLAP database that was
missing. Whether a database runs in your process or as a server says
nothing about which workload it's good at.

## What this means when you build

- Ask which kind a query is before you write it. A report that scans a
  year of orders doesn't belong on the primary database that serves
  checkout.
- Keep the OLTP schema normalized and indexed for the lookups the
  product does. Don't bend it to make reports fast.
- Send analytics to a separate copy, fed by change data capture or
  batch loads, and expect that copy to lag.
- Load analytical stores in batches. Column engines take bulk appends
  well and single-row updates badly.

## Further reading

- ["One Size Fits All": An Idea Whose Time Has Come and Gone](https://cs.brown.edu/~ugur/fits_all.pdf), Michael Stonebraker and Uğur Çetintemel, 2005. Why warehouses split off from OLTP databases, and why vendors ended up shipping two engines behind one parser.
- [C-Store: A Column-oriented DBMS](https://www.vldb.org/archives/website/2005/program/paper/thu/p553-stonebraker.pdf), Mike Stonebraker et al., 2005. Write-optimized row stores vs read-optimized column stores, and a design that holds both.
- [The Design and Implementation of Modern Column-Oriented Database Systems](https://www.cs.umd.edu/~abadi/papers/abadi-column-stores.pdf), Daniel Abadi et al., 2013. When a row layout or a column layout wins, and why column stores struggle with updates.
- [What is OLAP?](https://clickhouse.com/docs/concepts/olap), ClickHouse. The OLTP vs OLAP comparison, the move from cubes to column engines, and the Postgres-plus-OLAP pattern, from a vendor of one.
- [What is ClickHouse?](https://clickhouse.com/docs/intro), ClickHouse. A short worked example of why a row store reads columns a query doesn't need.
- [DuckDB: an Embeddable Analytical Database](https://mytherin.github.io/papers/2019-duckdbdemo.pdf), Mark Raasveldt and Hannes Mühleisen, 2019. Embedded vs server as a separate axis from OLTP vs OLAP, and why SQLite is poor at analytics.
