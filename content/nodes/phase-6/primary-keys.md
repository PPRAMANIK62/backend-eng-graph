---
id: primary-keys
title: Primary keys
depth: short
phase: 6
note: >-
  Natural vs surrogate keys, sequences vs UUIDv4 vs UUIDv7, and why key
  order affects the index.
needs: [relational-model]
leads_to: [id-generation]
compare_with: [heap-files]
---

# Primary keys

A primary key is the column, or set of columns, that names exactly one
row in a table. Every foreign key that points at the table points at
it, so the choice sticks: it decides whether a key can change under
you, whether you can make keys outside the database, and where each new
row lands in the key's index.

## What Postgres does with a primary key

Declaring `PRIMARY KEY` asks for two things at once: every value is
unique, and none is NULL. Postgres enforces that by building a unique
B-tree index on the key column(s) and marking them `NOT NULL`. A table
gets at most one primary key, though it can have any number of other
unique [[constraints]]. Foreign keys that name the table without naming
columns point at the primary key by default.

Relational theory, the [[relational-model]], says every table must
have a primary key. Postgres doesn't enforce that, but the rule is
worth following.

## Natural or surrogate

Take a `customers` table. You could key it by something the customer
already has: an email address, a tax number, a postal code plus house
number. That's a **natural key**. Or you could add an `id` column whose
only job is to be the key. That's a **surrogate key**.

Natural keys are tempting because the value is already there. The
trouble is that values assumed never to change often do. Postal codes, licence numbers and other ID numbers all
turn out to have edge cases where they must change. When a primary key changes, every
row that references it has to change too: with `ON UPDATE CASCADE` the
database copies the new value into each referencing row, and without it
the update fails while rows still point at the old value.

A surrogate key means nothing outside the database, so it never has a
reason to change. Pair it with a `UNIQUE` constraint on the natural
value, so "one customer per email" still holds.

## Three ways to make a surrogate key

**A sequence.** In Postgres, write
`id bigint GENERATED ALWAYS AS IDENTITY`. Each insert takes the next
number from a sequence behind the column. `ALWAYS` rejects a value the
application supplies unless the insert says `OVERRIDING SYSTEM VALUE`;
`BY DEFAULT` lets a supplied value win. An identity column is `NOT
NULL` but not unique on its own, since a sequence can be reset or
bypassed, so it still needs the `PRIMARY KEY` on top.

**A random UUID (version 4).** A UUID is 128 bits meant to be unique
without anyone coordinating. In version 4, 122 of those bits are random
and the other 6 mark the version and variant. Any machine can make one
without asking the database.

**A time-ordered UUID (version 7).** RFC 9562 (2024), which replaced
RFC 4122, added UUIDv7: the first 48 bits are a Unix timestamp in
milliseconds, and the rest is random (optionally with a counter for
ordering within a millisecond). Because the time comes first, v7 UUIDs
sort by creation time when compared as plain bytes. PostgreSQL 18
(2025) added a built-in `uuidv7()` function, and a `uuidv4()` name for
random ones.

![UUIDv7 starts with a 48-bit millisecond timestamp, then random bits; UUIDv4 is random except the version and variant. Below, six leaf pages of a primary-key B-tree: five ordered keys all land on the rightmost page, five random keys land on five different pages.](img/primary-keys-uuid-order.svg)

*Where the bits go, and what that does to inserts. Layouts adapted from K. Davis, B. Peabody, P. Leach, RFC 9562, sections 5.4 and 5.7 (2024).*

## Why key order matters to the index

The primary key's index is a B-tree ([[indexes]], [[b-plus-tree]]),
which keeps keys in sorted order. Where a new key goes depends only on
its value.

With a sequence or UUIDv7, each new key is larger than the last, so
every insert lands at the right-hand end of the index, near the entry
before it. With UUIDv4, each new key is a random number, so consecutive
inserts land at random places across the whole index. Poor index
locality was the first reason listed for writing RFC 9562, and its
authors describe the gap between the two as one order of magnitude or
more in practice. They publish no benchmark for it, and the lab hasn't
measured it, so treat it as a claim.

The same point holds for storage: keep UUIDs in a `uuid` column (16
bytes), not as text. The text form needs 288 bits to say what the
binary form says in 128.

## Where it gets tricky

**UUIDv7 leaks time.** Anyone who sees a v7 key can read when the row
was made, and can put rows in creation order. Where that matters for
security, use v4.

**UUIDs are not secrets.** Knowing an id must never grant access.
Check permissions on every request ([[bola]]).

**Who generates the key.** With one database, letting the database
generate UUIDs gives the best ordering, better than keys made by many
clients. For keys made across many machines, see [[id-generation]].

**Composite keys.** A primary key can span several columns, which is
normal for a join table like `order_items (order_id, product_id)`,
where the key is made of two foreign keys. Column order in that key
matters for which queries can use its index ([[composite-indexes]]).

## What this means when you build

- Use a surrogate primary key, and put a `UNIQUE` constraint on the
  natural value you'd otherwise have used.
- For one Postgres database, `bigint GENERATED ALWAYS AS IDENTITY` is
  the simple choice.
- If keys must be created outside the database, use UUIDv7, stored as
  `uuid`. Use v4 only when creation time must stay hidden, and accept
  scattered inserts.

## Further reading

- [RFC 9562: Universally Unique IDentifiers (UUIDs)](https://www.rfc-editor.org/rfc/rfc9562), K. Davis, B. Peabody, P. Leach, IETF, 2024. The UUIDv4 and v7 layouts, why random keys hurt B-trees, and section 6.13 on natural vs surrogate keys.
- [PostgreSQL documentation, 5.5 Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html), PostgreSQL Global Development Group, version 18. What a primary key enforces and the index it builds.
- [PostgreSQL documentation, 5.3 Identity Columns](https://www.postgresql.org/docs/current/ddl-identity-columns.html), PostgreSQL Global Development Group, version 18. Sequence-backed keys, ALWAYS vs BY DEFAULT.
- [PostgreSQL 18 release notes](https://www.postgresql.org/docs/release/18.0/), PostgreSQL Global Development Group, 2025. The new `uuidv7()` function.
