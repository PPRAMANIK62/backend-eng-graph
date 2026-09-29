---
id: bailis-when-is-acid-acid-2013
title: "When is \"ACID\" ACID? Rarely."
author: Peter Bailis
url: http://www.bailis.org/blog/when-is-acid-acid-rarely/
kind: blog
primary: false
---

## Summary

A 2013 survey of the default and strongest isolation levels in 18
databases, from their documentation. Most don't give serializability by
default, and half don't offer it at all.

## Key claims

- The textbook meaning of the I in ACID is serializability. "The textbook definition of ACID Isolation is serializability" (second paragraph)
- Only 3 of the 18 databases surveyed default to serializable, and 9 offer it at all. "Only three of 18 databases provide serializability by default, and only nine provide serializability as an option at all" (third paragraph)
- In the table, Postgres 9.2.2 defaults to read committed with serializable available; MySQL 5.6 defaults to repeatable read; Oracle 11g's strongest level is snapshot isolation. (table)
- Serializability is what makes the C in ACID hold for arbitrary transactions. "A database with serializability (“I” in ACID), provides arbitrary read/write transactions and guarantees consistency (“C” in ACID), or correctness, of the database." (second paragraph)
- Many databases market themselves as ACID. "Many databases today differentiate themselves from their NoSQL counterparts by claiming to support “100% ACID” transactions" (first paragraph)

## Visuals worth redrawing

None.

## My notes

- The versions in the table are old (Postgres 9.2, MySQL 5.6, Oracle
  11g). Use it for the pattern, and check current defaults in the
  vendors' docs.
