---
id: postgres-identity-columns
title: "PostgreSQL documentation, 5.3 Identity Columns"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/ddl-identity-columns.html
kind: docs
primary: true
---

## Summary

How Postgres (read at version 18.6) generates numeric keys: an identity
column is filled from an implicit sequence. ALWAYS vs BY DEFAULT, and
the fact that an identity column alone doesn't guarantee uniqueness.

## Key claims

- An identity column is filled from an implicit sequence. "An identity column is a special column that is generated automatically from an implicit sequence. It can be used to generate key values." (5.3)
- Syntax is GENERATED ... AS IDENTITY. "To create an identity column, use the GENERATED ... AS IDENTITY clause in CREATE TABLE" (5.3)
- ALWAYS refuses user values unless you say OVERRIDING SYSTEM VALUE. "In an INSERT command, if ALWAYS is selected, a user-specified value is only accepted if the INSERT statement specifies OVERRIDING SYSTEM VALUE." (5.3)
- BY DEFAULT lets a user value win. "If BY DEFAULT is selected, then the user-specified value takes precedence." (5.3)
- ALWAYS protects against accidental explicit values. "whereas ALWAYS provides some more protection against accidentally inserting an explicit value." (5.3)
- Identity is NOT NULL but not unique on its own. "An identity column is automatically marked as NOT NULL. An identity column, however, does not guarantee uniqueness." (5.3)
- Add a primary key or unique constraint for that. "Uniqueness would need to be enforced using a PRIMARY KEY or UNIQUE constraint." (5.3)
- Why: the sequence can be reset or bypassed. "A sequence normally returns unique values, but a sequence could be reset, or values could be inserted manually into the identity column, as discussed above." (5.3)

## Visuals worth redrawing

None.

## My notes

- The Postgres wiki "Don't Do This" page (opened, not cited) says to use
  identity columns instead of `serial` for new applications.
