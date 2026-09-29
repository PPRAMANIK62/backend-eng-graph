---
id: jsonb
title: JSONB
depth: short
phase: 6
note: >-
  JSON columns in Postgres, and when a document column is the right
  call.
needs: [data-models, index-types]
leads_to: []
compare_with: [table-statistics]
---

# JSONB

`jsonb` is a Postgres column type that stores a JSON document in a
parsed, binary form you can query and index. It lets one table hold
both fixed columns and a document-shaped part, which is the Postgres
answer to the document databases in [[data-models]]. The hard part is
knowing which fields belong in the document and which deserve their
own columns.

## json or jsonb

Postgres has two JSON types, and both reject input that isn't valid
JSON.

- **`json`** keeps an exact copy of the text: whitespace, key order,
  duplicate keys. Every function that reads it has to parse it again.
- **`jsonb`** parses the input once and stores a decomposed binary
  form. Writes are slightly slower, reads are much faster since nothing
  is reparsed, and it can be indexed. It drops whitespace, doesn't keep
  key order, and keeps only the last value of a duplicated key.

Use `jsonb` unless you really need the original text. It arrived in
PostgreSQL 9.4.

Two type details catch people. JSON numbers become Postgres `numeric`,
which is more precise than the double-precision floats many other
systems use, so values can lose precision when you send them on. And
JSON's `null` is not SQL's `NULL`.

## Querying and indexing a document

Say an `events` table has fixed columns (`id`, `user_id`, `created_at`)
and a `props jsonb` column for whatever each event type carries. Two
operators do most of the work:

- **Containment, `@>`**: `props @> '{"plan": "pro"}'` is true when the
  document contains that structure, at any depth you spell out. Array
  order and duplicates don't matter.
- **Existence, `?`**: `props ? 'coupon'` is true when `coupon` is a key
  (or array element) at the top level. It doesn't look deeper.

A GIN index makes these fast across many rows
([[index-types]]): `CREATE INDEX ON events USING GIN (props)`. It comes
in two flavours:

![A document {"foo": {"bar": "baz"}} indexed two ways. The default jsonb_ops class makes three entries, foo, bar and baz, and answers the key-exists operator as well as @>, @? and @@. The jsonb_path_ops class makes one entry, a hash of foo, bar and baz together, answers only @>, @? and @@, is smaller and more specific, but can't tell whether foo exists as a key.](img/jsonb-gin-entries.svg)

*What each GIN operator class stores for one document. Adapted from the PostgreSQL documentation, section 8.14.4 (version 18).*

- **`jsonb_ops`**, the default, indexes every key and every value
  separately. It supports `?`, `?|`, `?&`, `@>` and the jsonpath
  operators `@?` and `@@`.
- **`jsonb_path_ops`** indexes each value hashed together with the
  keys that lead to it. It's usually much smaller and its searches are
  more specific, but it only supports `@>`, `@?` and `@@`.

An index on the whole column is only used when the operator is applied
to that column. `props -> 'tags' ? 'sale'` can't use it, because `?`
is applied to `props -> 'tags'`. Either rewrite it as containment
(`props @> '{"tags": ["sale"]}'`) or build an expression index on
`(props -> 'tags')`, which is also smaller and faster when that's the
only key you search.

## When a document column is the right call

A document column is a good fit when:

- There are many optional attributes and most rows have only a few of
  them. Customer-defined properties, per-integration settings, event
  payloads.
- Requirements are still moving and you don't want a migration for
  every new field.
- Each document is one thing that's read and written as a whole, and
  stays a manageable size.

It's a poor fit for fields that nearly every row has, fields you join
on, filter on in analytical queries, or need rules for. Those should
be columns.

## Where it gets tricky

**The planner can't see inside.** Postgres keeps [[table-statistics]]
on columns, not on fields inside a `jsonb` value, so the
[[query-planner]] has to guess how many rows a condition like
`props ->> 'plan' = 'pro'` matches. In Heap's 2016 test, on the
Postgres of that time, the fixed guess was 0.1% of rows. The real share
was far larger, the planner picked a nested loop join, and the query
took 584 seconds on the author's laptop against about 300 ms for the
same data in plain columns. Heap had to turn nested loops off for the
whole database. PostgreSQL 14 (2021) added extended statistics on
expressions, not just columns, which is a possible way to tell the
planner about one field of a document; whether it fixes this case
hasn't been tested here.

**Key names are stored in every row.** Nothing deduplicates repeated
keys. In the same test, the table took 79 MB with columns and 164 MB as
`jsonb`; at Heap, moving 45 common fields out of `jsonb` into columns
saved about 30% of disk.

**The database doesn't enforce the shape.** A document's structure is
mostly unchecked, so the [[constraints]] you'd put on a column (NOT
NULL, a foreign key, a type) don't apply to a field inside it directly.
A CHECK on an expression can enforce some rules; beyond that, every
reader has to cope with missing or odd fields.

**Updates lock the whole row.** Changing one field of a document takes
a [[explicit-locking|row lock]] on the whole row. Big documents that
many writers touch will contend. Keep documents small, and split out parts that
change independently.

## What this means when you build

- Use `jsonb`, not `json`.
- Put fields that most rows have, and anything you join or filter on
  heavily, in real columns. Put the long tail of optional attributes in
  `jsonb`.
- Index with GIN, `jsonb_path_ops` if you only need containment, or an
  expression index on the one key you search.
- Watch query plans for row estimates that are far off on `jsonb`
  conditions ([[explain]]).

## Further reading

- [PostgreSQL documentation, 8.14 JSON Types](https://www.postgresql.org/docs/current/datatype-json.html), PostgreSQL Global Development Group, version 18. json vs jsonb, containment, GIN operator classes, and advice on document design.
- [When To Avoid JSONB In A PostgreSQL Schema](https://www.heap.io/blog/when-to-avoid-jsonb-in-a-postgresql-schema), Dan Robinson (Heap), 2016. The statistics and storage costs of putting everything in jsonb, with a worked example.
- [PostgreSQL 14 release notes](https://www.postgresql.org/docs/release/14.0/), PostgreSQL Global Development Group, 2021. Extended statistics on expressions.
