---
id: vitess-vindexes
title: Vindexes (Vitess docs)
author: The Vitess Authors
url: https://vitess.io/docs/reference/features/vindexes/
kind: docs
primary: true
---

## Summary

Vitess (sharded MySQL) docs, version 24.0: how a Vindex maps a column
value to a keyspace ID and so to a shard. The primary Vindex is the
sharding key. Secondary Vindexes, often lookup tables stored on other
shards, let queries on other columns go to the right shard instead of
all of them.

## Key claims

- A Vindex maps a value to a keyspace ID, and each shard covers a range of keyspace IDs. "Since each shard in Vitess covers a range of Keyspace ID values, this mapping can be used to identify which shard contains a row." (A Vindex maps column values to keyspace IDs)
- The primary Vindex is the sharding key. "Conceptually, this is equivalent to a NoSQL Sharding Key, and we often informally refer to the Primary Vindex as the Sharding Key." (Primary Vindex)
- Its column can't change after insert, since that would move the row. "Changing it would require moving the row to a different shard, which Vitess does not support." (Primary Vindex)
- Without a secondary Vindex, a query on another column goes to every shard. "In the absence of a Secondary Vindex, VTGate would have to scatter the query to all shards." (Secondary Vindexes)
- Secondary Vindexes only route; each shard still needs its own MySQL index. "The underlying database shards will most likely need traditional indexes on those same columns, to allow efficient retrieval from the table on the underlying MySQL instances." (Secondary Vindexes)
- A lookup Vindex is a table from value to keyspace ID. "A Lookup Vindex is implemented as a MySQL lookup table that maps a column value to keyspace IDs." (Functional and Lookup Vindex)
- The lookup row usually lives on another shard. "Note that the lookup row is most likely not going to be in the same shard as the keyspace id it points to." (Lookup Vindex types)
- Keeping it in step is a distributed transaction. "These essentially result in distributed transactions, which traditionally require 2PC to guarantee atomicity." (Lookup Vindex types)
- Consistent lookup Vindexes avoid 2PC with locking and commit order. "Consistent lookup vindexes use an alternate approach that makes use of careful locking and transaction sequences to guarantee consistency without using 2PC." (Lookup Vindex types)
- Commits run in a fixed order across sessions; for an insert, the lookup row is written in the pre session, which commits first. "When a commit happens it happens on the pre session first and if it succeeds then the commit happens on the post session." (Consistent Lookup usage)
- The lookup table can be sharded or not. "The lookup table that implements a Lookup Vindex can be sharded or unsharded." (Lookup Vindex types)
- Lookup Vindexes are also called cross-shard indexes. "Lookup Vindexes are sometimes also informally referred to as cross-shard indexes." (Functional and Lookup Vindex)

## Visuals worth redrawing

None.

## My notes

- Vitess calls lookup Vindexes "cross-shard indexes"; that's a global
  secondary index by another name.
