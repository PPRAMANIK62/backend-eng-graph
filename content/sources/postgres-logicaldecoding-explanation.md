---
id: postgres-logicaldecoding-explanation
title: "Logical Decoding Concepts, PostgreSQL documentation section 47.2"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/logicaldecoding-explanation.html
kind: docs
primary: true
---

## Summary

The PostgreSQL 18 docs on what logical decoding is (the WAL turned into
row changes), what a replication slot is and promises, how slots are
synchronised to a standby for failover, output plugins, and the
snapshot a new slot exports.

## Key claims

- Logical decoding turns the WAL, which describes changes at the storage level, into an application-level form. "In PostgreSQL, logical decoding is implemented by decoding the contents of the write-ahead log, which describe changes on a storage level, into an application-specific form such as a stream of tuples or SQL statements." (47.2.1)
- A slot is a stream of changes replayed in the order they happened, from one database. "a slot represents a stream of changes that can be replayed to a client in the order they were made on the origin server. Each slot streams a sequence of changes from a single database." (47.2.2)
- Slots are crash-safe and outlive the connection. "Slots persist independently of the connection using them and are crash-safe." (47.2.2)
- A slot's position is saved only at checkpoints, so after a crash changes can be sent again; the client must cope. "The current position of each slot is persisted only at checkpoint, so in the case of a crash the slot might return to an earlier LSN, which will then cause recent changes to be sent again when the server restarts." (47.2.2)
- Clients handle duplicates, for example by remembering the last LSN. "Logical decoding clients are responsible for avoiding ill effects from handling the same message more than once." (47.2.2)
- One slot per consumer, each with its own position. "For most applications, a separate slot will be required for each consumer." (47.2.2)
- Only one receiver at a time per slot. "Only one receiver may consume changes from a slot at any given time." (47.2.2)
- An unused slot still holds back WAL and catalog cleanup, and in the worst case can force a shutdown against transaction ID wraparound. "They will prevent removal of required resources even when there is no connection using them." (47.2.2, Caution)
- "In extreme cases this could cause the database to shut down to prevent transaction ID wraparound" (47.2.2, Caution)
- Drop slots you don't need. "So if a slot is no longer required it should be dropped." (47.2.2, Caution)
- Logical slots can be synchronised to a hot standby (failover parameter plus sync_replication_slots) so replication can continue after promotion. "The logical replication slots on the primary can be synchronized to the hot standby by using the failover parameter of pg_create_logical_replication_slot" (47.2.3)
- Output plugins turn the WAL's internal representation into the consumer's format. "Output plugins transform the data from the write-ahead log's internal representation into the format the consumer of a replication slot desires." (47.2.4)
- Creating a slot exports a snapshot that matches exactly where the change stream begins, so you can copy the data then apply changes without losing any. "This transaction can then be used to dump the database's state at that point in time, which afterwards can be updated using the slot's contents without losing any changes." (47.2.5)

## Visuals worth redrawing

None.

## My notes

- Read as the PostgreSQL 18 docs ("current" when this was written).
