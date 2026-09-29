---
id: relational-model
title: The relational model
depth: deep
phase: 6
note: >-
  Data as tables of rows linked by keys, and why it has lasted since
  1970.
needs: []
leads_to: [sql, normalization, primary-keys, constraints, data-models, sqlite]
compare_with: [data-models]
---

# The relational model

The relational model says: keep all your data in tables, link tables
by the values in their key columns, and ask for data by describing
what you want, not by walking to it. E. F. Codd proposed it in a paper
written at IBM and published in 1970, and nearly every database you'll
use as a backend engineer is built on it. Knowing what it promises, and where real databases bend
it, explains a lot of how Postgres behaves.

## The problem it solved

Take a shop with customers, orders and products. Before the relational
model, a database stored this as a tree or a network of records joined
by pointers. You might store each customer with their orders nested
underneath, and each order with its items under that. A program that
wanted "every order for product X" had to know that layout and walk it:
start at a customer, follow the pointer to the first order, follow the
next pointer, and so on.

That works until someone changes the layout. Codd's paper uses parts
and projects as the example: the same data can be stored as at least
five different trees, and a program written for one of them fails on
at least three of the others. So every change to how data was stored
meant rewriting the programs that read it. He named three ways programs
depended on storage:

- **Ordering.** Programs assumed records came back in the order they
  were stored.
- **Indexing.** Programs referred to specific [[indexes]] by name, and broke
  when an index was dropped.
- **Access paths.** Programs followed the stored tree or network, and
  broke when it was reshaped.

Later accounts put the motive plainly: programmers on IBM's IMS, a hierarchical
database, were spending a large part
of their time fixing applications whenever the storage changed.

## Tables, rows and keys

Codd's fix was to show users only one kind of structure: the
**relation**. The word comes from maths, where a relation is a set of
tuples. It doesn't mean "a relationship between things". In practice a
relation is a table:

- Each **row** is one fact, such as "order 17 was placed by customer 3".
- Each **column** has a name and a type (the set of values allowed in
  it).
- **Row order doesn't matter.** A table is a set, so there's no "first"
  row. The database can store rows however it likes.
- **Rows are distinct.** In the pure model no two rows are identical.

Tables link to each other by values, not pointers:

- A **primary key** is a column, or a group of columns, whose value
  identifies exactly one row. `customer_id` in `customers`, say.
- A **foreign key** is a column whose values are primary key values of
  another table (or the same one). `orders.customer_id` holds a
  `customers.customer_id`.

![Three small tables with sample rows: customers (customer_id, name), orders (order_id, customer_id) and order_items (order_id, product, qty). Primary key columns are highlighted. Arrows run from orders.customer_id to customers.customer_id and from order_items.order_id to orders.order_id, each labelled foreign key to primary key. A note says links are values that match a key, not pointers, and rows have no order.](img/relational-model-keys.svg)

*A shop as three relations. Every link is a value in a column that matches a key in another table.*

There's no stored path from a customer to their orders. To find them
you ask for the rows of `orders` whose `customer_id` equals 3. The same
question works from either side: orders for a customer, or the
customer for an order. Codd called this symmetric use of a relation,
and it's the thing tree-shaped databases couldn't give you.

Codd's paper also covers what happens when a value is itself a
list, like an employee's job history. He removes those nested values by
moving them into their own table, with the parent's key copied in. He
called that **normalization**, and it grew into a whole theory of table
design ([[normalization]]).

Two more pieces round out the model:

- **Constraints**: rules every state of the data must satisfy, such as
  "this column is unique" or "this foreign key must match a real row".
  Unique and foreign key constraints are the most common
  ([[constraints]]).
- **NULL**: a special value meaning the attribute is missing or
  undefined for that row. It causes more trouble than its size suggests
  (see [[sql]]).

## Ask for what, not how

The second half of the idea is the language. With pointers gone, a
query can't say "follow this link". It says which rows it wants, as a
condition over tables, and the database works out how to get them.

Underneath that is **relational algebra**: a small set of operators
that each take one or more tables and return a table. Select (filter
rows), project (pick columns), union, difference, product and join. Since
every operator returns a table, you can chain them into a tree, and the
output of one is the input of the next.

That closure is what makes optimization possible. "Join orders to
customers, then keep customer 3" and "keep customer 3, then join" give
the same answer. If `orders` has a billion rows, the second is far
cheaper. Because you described the result rather than the steps, the
database is free to pick the cheaper order. That choice is the job of
the [[query-planner]].

It's also what gives you **data independence**, the goal Codd started
from:

- **Physical data independence.** You can add an index, drop one,
  change the storage layout or move to new hardware, and every query
  still returns the same rows. Codd described an index as a redundant
  structure kept only for speed; it should be able to come and go
  without breaking a single program.
- **Logical data independence.** You can add tables and columns, or
  put a view in front of an old table shape, without touching programs
  that don't use them.

## Why it has lasted since 1970

The model didn't win on day one. Through the 1970s the network-database
camp argued that ordinary programmers couldn't learn relational
languages and that nobody could implement them efficiently. Two
research systems, IBM's System R and INGRES, answered the
second point, and showed that a query optimizer could build plans as
good as all but the best hand-written code. SQL, from System R, turned
out to be friendlier than Codd's own mathematical languages. When IBM
announced DB/2 in 1984, the debate was over, and SQL became the
standard relational language.

Since then, rivals have come in waves: object databases, XML databases,
then key-value, document, wide-column and graph stores. A 2024 review
of the last twenty years by two database builders finds the same
pattern each time. Systems that dropped the model either stayed in a
niche or drifted back towards it:

- With a plain key-value store, your application has to do joins
  itself, and there are no secondary indexes to find records by
  anything but the key.
- A relational database can emulate a key-value store with one table.
  Turning a key-value store into something that handles complex data is
  much harder.
- By the end of the 2010s almost every NoSQL database had added a SQL
  interface. MongoDB, the last holdout, added one for its Atlas service
  in 2021.
- Meanwhile SQL absorbed the good ideas, such as a JSON type in the SQL
  standard in 2016 ([[data-models]] and [[jsonb]] cover when a document
  column is the right call).

The lasting part is the pair of ideas: one simple structure, and a
declarative language on top that leaves the "how" to the database.

## Where it gets tricky

**SQL tables aren't quite relations.** The model says a relation is a
set, so rows are distinct. SQL tables are bags: they allow duplicate
rows unless you add a key. When people say "relational database" they
mean SQL's version.

**"Relational" doesn't mean "has relationships".** The name comes from
the maths term for a table. A single table with no foreign keys is
still a relation.

**Row order is never promised.** Since a table has no order, a query
without `ORDER BY` returns rows in whatever order is fastest for the
database to produce, and nothing promises that order stays the same.
Code that relies on insertion order is relying on an accident.

**Atomic values have loosened.** Codd's normal form assumed every value
was simple, not a list or a nested record. Modern relational databases
let a column hold arrays or JSON documents. That's useful, but a column full of
nested documents brings back some of the flat-file problems the model
was meant to remove.

**The model says nothing about speed.** It promises the same answer
however data is stored. How fast you get it depends on indexes, the
planner and the [[storage-engine]], which is most of the rest of this
phase and the next.

## What this means when you build

- Model your data as tables linked by keys first. Reach for a document
  or key-value store when you have a reason, not by default.
- Give every table a primary key ([[primary-keys]]), and declare
  foreign keys so the database enforces the links.
- Never depend on row order without `ORDER BY`.
- Let the database choose how to run a query. Your job is a clear
  question and the right indexes, not a hand-coded access path.

## Further reading

- [A Relational Model of Data for Large Shared Data Banks](https://www.seas.upenn.edu/~zives/03f/cis550/codd.pdf), E. F. Codd, 1970. The original paper: the three kinds of data dependence, relations, primary and foreign keys, normalization and redundancy.
- [What Goes Around Comes Around](https://people.cs.umass.edu/~yanlei/courses/CS691LL-f06/papers/SH05.pdf), Michael Stonebraker and Joseph M. Hellerstein, 2005. How the relational model beat hierarchical and network databases, told by someone who was there, with a lesson from each era.
- [What Goes Around Comes Around... And Around...](https://db.cs.cmu.edu/papers/2024/whatgoesaround-sigmodrec2024.pdf), Michael Stonebraker and Andrew Pavlo, 2024. Twenty more years of challengers (NoSQL, key-value, document, graph, vector) and why they converged back to SQL.
- [SELECT](https://www.postgresql.org/docs/current/sql-select.html), PostgreSQL documentation. What a query without `ORDER BY` promises about row order (nothing).
- [Lecture #01: Relational Model & Algebra](https://15445.courses.cs.cmu.edu/fall2024/notes/01-relationalmodel.pdf), Andy Pavlo, CMU 15-445, 2024. A compact walk from flat files to relations, keys, constraints and relational algebra.
