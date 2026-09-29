---
id: data-models
title: Data models
depth: deep
phase: 6
note: >-
  Document, key-value, wide-column and graph databases: what each is
  good at.
needs: [relational-model]
leads_to: [jsonb]
compare_with: [relational-model, column-storage]
---

# Data models beyond tables

A data model is the shape a database gives your data, and the
operations it lets you run on that shape. Besides the relational model
there are four you'll meet: key-value, document, wide-column and graph.
Each one makes some questions cheap and others expensive or
impossible, so picking one is really picking which questions your
system will be good at.

## One customer, five shapes

Take a shop with a customer, Alice, who has placed two orders, each
with some items. In the [[relational-model]] she's spread across
tables: a row in `customers`, two rows in `orders` that hold her id in
`customer_id`, and rows in an `order_items` table. Showing Alice's
orders means a [[joins|join]] on `customer_id`. Any other question
("all orders over 100 last week", "who bought lamps") is another query
over the same tables.

The other models store the same facts differently.

![The same customer with two orders in five models. Relational: a customers table and an orders table linked by customer_id; reading her orders is a join. Document: one JSON document with the orders nested inside; one read. Key-value: the key customer:42 maps to opaque bytes that only the application can decode. Wide-column: one row keyed 42 with columns info:name, orders:123 and orders:456; one row read. Graph: a Customer node Alice with PLACED relationships to two Order nodes, one of which has a CONTAINS relationship to a Product node.](img/data-models-one-customer.svg)

*One customer, five data models. Examples adapted from Michael Stonebraker and Andrew Pavlo, "What Goes Around Comes Around... And Around..." (2024) and the Bigtable paper's Webtable (2006).*

## Key-value: a key and an opaque value

A key-value store is the simplest model there is: a map from a key to a
value. The value is usually a blob of bytes the database doesn't look
inside, so the application owns the format. Most stores offer only
get, set and delete on one key.

Amazon's Dynamo paper (SOSP 2007) explains why anyone would want so
little. Many Amazon services, like shopping carts, session management,
customer preferences and best-seller lists, only ever read and write
one item by its primary key. For them a relational database was
functionality they paid for and didn't use, and the replication of the
time favoured consistency over staying available. Dynamo stored small
objects (usually under 1 MB) by key, with no operations spanning items
and no schema. In return a key-value store can give higher and more
predictable performance.

The cost shows up the moment a record has several fields you want to
query. The store has no secondary indexes, so "find carts containing
product X" means scanning everything or keeping your own index. Joins
happen in application code. Many key-value stores responded by letting
the value be a structured document, which moves them toward the next
model.

Designing for a key-value store is backwards from relational design.
With tables, you normalize first ([[normalization]]) and write queries
later. With a store like DynamoDB, you don't design anything until you
know the questions it must answer. Then you store data in the shape
it'll be read, keep related items together under one key, choose keys
so related items sort next to each other, and spread keys so traffic
doesn't pile onto one [[partitioning|partition]] ([[hot-spots]]).
Queries you planned for are fast. Queries you didn't plan for are slow and expensive.

## Document: nested records

A document database stores records as trees of fields. A field's value
can be a scalar, an array, or another document, so Alice's orders can
live inside Alice. The database doesn't make you declare the shape
first; that's the "schema later" approach.

The central decision is **embed or reference**. MongoDB's own guidance
is to embed when the relationship is "has-a" or "contains", when the
data is read together, updated together, or archived together. It says
to reference another collection when the child side is large, when an
embedded list would grow without bound, when the pieces are written at
different times, or when the child can exist on its own. Embedding
gives you one read instead of a join. Its fans add that it avoids the
[[n-plus-one]] pattern of one query per related object.

Embedding has two costs. If the same data is embedded in several
places (a product's name inside every order), you've made a copy on
purpose ([[denormalization]]) and must update every copy when it
changes. And atomicity follows the document: in MongoDB a
single-document write is atomic, and anything spanning documents needs a
multi-document transaction, which MongoDB says costs more and shouldn't
replace good schema design.

## Wide-column: a sorted, sparse map

The wide-column (or column-family) model comes from Google's Bigtable
(OSDI 2006). A Bigtable table is a sparse, distributed, persistent,
sorted map from `(row key, column key, timestamp)` to a string of
bytes. Columns are grouped into families (`info:`, `orders:`) that you
declare up front, but within a family any column name can appear in any
row, so each row can have different columns.

Two properties shape everything:

- **Rows are sorted by key**, and the key range is split into chunks
  (tablets) spread over machines. Reading a short range of keys touches
  few machines, so you choose keys for locality. Bigtable's example
  stored web pages under reversed host names
  (`com.google.maps/index.html`) so pages from one domain sit next to
  each other.
- **One row is the unit of atomicity.** Any read or write within one
  row is atomic, however many columns it touches. There are no general
  transactions across rows.

Cassandra and HBase copied this model, and with it the lack of joins
and secondary indexes. Don't confuse it with columnar storage
([[column-storage]]): "column-family" is about how you address data,
not about storing each column separately on disk. It's closer to a
document model with only one level of nesting.

## Graph: nodes and relationships

A property graph has **nodes**, which carry labels (`Customer`,
`Order`) and key-value properties, and **relationships**, which always
have a start node, an end node, a direction and exactly one type
(`PLACED`, `CONTAINS`), and can carry properties too.

The pitch is traversal. When the question is about connections ("how
is A related to B", "everything reachable within four hops"), a native
graph database like Neo4j follows stored pointers from node to node.
A relational database answers the same question with one join per
hop. The longer the chain, the more the pointer-chasing design has
going for it.

The counterpoint is that any graph fits in two tables, `node(id, data)`
and `edge(from_id, to_id, data)`. Plain SQL is clumsy at walking them
hop by hop, which is the gap SQL:2023 closed by adding property graph
queries (SQL/PGQ) to the standard. One study cited in the 2024 survey
below found SQL/PGQ in DuckDB up to 10 times faster than a leading
graph database; that's one benchmark, not a general rule. Recursive
[[ctes]] are the older way to walk a graph stored in tables.

## Where it gets tricky

**Do these models converge?** One side, argued in a 2024 survey of the
field, says they do: by the end of the 2010s almost every NoSQL
database had added a SQL interface (Cassandra's CQL, DynamoDB's PartiQL
and others), many added [[acid|ACID]] transactions, and the SQL
standard gained a JSON type in 2016. The prediction is that
document and relational systems will become hard to tell apart, and
that relational systems can match most key-value workloads. The
vendors of those systems see it differently. The DynamoDB guide
describes relational queries as flexible but relatively expensive and
poor at scaling under heavy traffic, and argues for designing around
access patterns instead. Both sides agree on the trade itself: a
relational schema keeps every question possible, and a
query-shaped schema makes the planned questions cheap. They disagree
about how often you need the second.

**"Schema-less" moves the schema.** A key-value store doesn't know
the shape of your values, so the application keeps the schema and
parses every value itself. Document stores let you skip declaring a
shape up front. That's convenient while the shape keeps changing; the
cost is that every reader has to agree on the shape without the
database's help.

**Pre-joining has old problems.** Nesting related data (pre-joining
it) was argued over in the 1970s. If the relationship isn't
one-to-many, the nested copies duplicate data. A pre-join isn't
automatically faster than a join. And the storage layout now encodes
one access path, so a different question has to work against it.

**The relational side absorbed the ideas.** Once SQL had a JSON type,
relational databases could hold documents in a column; in Postgres
that's [[jsonb]]. For many systems the real choice isn't "relational or
document" but "which parts of this data need a flexible shape".

## What this means when you build

- Start from the questions. If you can list every access pattern and
  it's mostly "get this item by key" at very high volume, a key-value
  or wide-column store fits. If you can't list them yet, keep a
  relational schema.
- In a document store, embed what's read and written together and
  stays bounded; reference what grows or lives on its own.
- In a wide-column store, the row key is the design. Choose it for
  locality and even spread.
- Reach for a graph database when the queries are long traversals over
  connections, and check first whether node and edge tables in SQL are
  enough.
- A document column inside Postgres ([[jsonb]]) often gives you the
  flexible part without giving up joins and constraints.

## Further reading

- [What Goes Around Comes Around... And Around...](https://db.cs.cmu.edu/papers/2024/whatgoesaround-sigmodrec2024.pdf), Michael Stonebraker and Andrew Pavlo, SIGMOD Record, 2024. A survey of twenty years of non-relational models, and the argument that they converge back to SQL.
- [Dynamo: Amazon's Highly Available Key-value Store](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf), Giuseppe DeCandia et al., SOSP, 2007. Why Amazon wanted a primary-key-only store.
- [Bigtable: A Distributed Storage System for Structured Data](https://static.googleusercontent.com/media/research.google.com/en//archive/bigtable-osdi06.pdf), Fay Chang et al., OSDI, 2006. The wide-column model, row keys and column families, from the people who built it.
- [NoSQL design for DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-general-nosql-design.html), Amazon Web Services. Access-pattern-first design, from the vendor.
- [Best Practices for Data Modeling in MongoDB](https://www.mongodb.com/docs/manual/data-modeling/best-practices/), MongoDB, manual version 8.3. When to embed and when to reference, and document-level atomicity.
- [What is a graph database](https://neo4j.com/docs/getting-started/graph-database/), Neo4j. The property graph model and the case for native traversal.
