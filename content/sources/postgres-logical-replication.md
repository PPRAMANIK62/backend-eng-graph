---
id: postgres-logical-replication
title: "Logical Replication, PostgreSQL documentation chapter 29"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/logical-replication.html
kind: docs
primary: true
---

## Summary

The opening page of the PostgreSQL 18 chapter on built-in logical
replication: rows replicated by their replica identity, a
publish/subscribe model, an initial copy followed by a stream of
changes applied in the same order, and the use cases.

## Key claims

- Logical replication copies changes by replica identity (usually the primary key), unlike physical replication's block addresses. "We use the term logical in contrast to physical replication, which uses exact block addresses and byte-by-byte replication." (chapter intro)
- Replication identity is usually a primary key. "based upon their replication identity (usually a primary key)" (chapter intro)
- Publish and subscribe: subscribers pull from publications. "Logical replication uses a publish and subscribe model with one or more subscribers subscribing to one or more publications on a publisher node." (chapter intro)
- It starts with a snapshot copy, then streams changes applied in the same order. "The subscriber applies the data in the same order as the publisher so that transactional consistency is guaranteed for publications within a single subscription." (chapter intro)
- Use cases include replicating between major versions and platforms, and sending changes to other systems as they occur. "Replicating between different major versions of PostgreSQL." (chapter intro)
- A subscriber is an ordinary Postgres instance and can publish in turn; other writes to the same tables can conflict. "The subscriber database behaves in the same way as any other PostgreSQL instance and can be used as a publisher for other databases by defining its own publications." (chapter intro)

## Visuals worth redrawing

None.

## My notes

- Sibling pages: 29.1 (publication, replica identity), 29.8
  (restrictions: DDL and sequences not replicated).
