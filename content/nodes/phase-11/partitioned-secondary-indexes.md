---
id: partitioned-secondary-indexes
title: Secondary indexes on partitioned data
depth: short
phase: 11
note: >-
  Local vs global secondary indexes when data is split.
needs: [partitioning, indexes]
leads_to: [distributed-transactions]
compare_with: []
---

# Secondary indexes on partitioned data

When data is [[partitioning|partitioned]] by one key, a query by any
other field doesn't know which partition to ask. A secondary index
fixes that, and there are two ways to split it up: a local index, where
each partition indexes only its own rows, and a global index, which is
partitioned by the indexed value itself. Local indexes make writes cheap
and reads expensive. Global indexes do the opposite, and add a
consistency problem.

## One query, two layouts

Take a users table partitioned by user ID: users 1 to 3 in P1, 4 to 6
in P2, 7 to 9 in P3. Now you want every user in Oslo. On a single
database you'd add an [[indexes|index]] on city. Here there are two
choices.

![Two panels. Left, local index: a query for city = Oslo fans out to all three partitions, P1 with users 1 to 3, P2 with users 4 to 6, P3 with users 7 to 9, each holding its own index entry for Oslo. Notes say a read asks every partition and a write touches one. Right, global index: the index is split by city into index A to M holding Lima: 3, 5 and index N to Z holding Oslo: 1, 4, 8. The query goes only to index N to Z. A write of user 4 sends the row to P2 and the index entry to index N to Z. Notes say a read asks one index partition and a write touches the row and the index.](img/partitioned-secondary-indexes-local-global.svg)

*The same index, split two ways.*

**Local index.** Each partition keeps an index of its own rows. P1
knows which of users 1 to 3 live in Oslo, P2 knows about 4 to 6, and so
on. A write stays inside one partition: the row and its index entry
change together. But the query for Oslo has to go to every partition
and merge the answers, because any of them might hold an Oslo user.

**Global index.** The index is a separate table, partitioned by city.
All the Oslo entries sit in one index partition, so the query asks one
place and gets the list of user IDs. The cost moves
to writes: adding user 4 writes the row to P2 and an entry to the
index partition that holds Oslo, which is usually on another machine.

## How real systems do it

**DynamoDB offers both.** A local secondary index uses the table's
partition key with a different sort key, so it only helps queries that
already name one partition key value. In return it can be read with
strong consistency. It must be created with the table and never added
later, and it limits each partition key value to 10 GB of items. A
global secondary index has its own partition key, lives in its own
partitions, scales separately with its own capacity, and can query across
the whole table. Reads of it are eventually consistent only.

**Vitess (sharded MySQL) routes instead of storing.** Each MySQL shard
keeps ordinary local indexes. Without more help, a query on a column
that isn't the sharding key is sent to every shard. A "lookup Vindex"
adds a global index: a table mapping each value to the shard that holds
the row. The lookup table can itself be sharded or not, and its row is usually
not on the same shard as the row it points to. Vitess only uses it to
decide which shard to ask.

## Keeping a global index in step

A global index entry and its row live on different machines, so one
write has become two. There are two ways to handle that.

- **Update the index in the background.** DynamoDB updates global
  indexes asynchronously. Normally the change shows up within a fraction
  of a second, and in rare failures later. A query on the index right
  after a write can miss it, and your code has to cope.
- **Commit both together.** Keeping a lookup Vindex exact is a
  [[distributed-transactions|distributed transaction]], which would
  normally need [[two-phase-commit]]. Vitess's consistent lookup
  Vindexes avoid it with careful locking and a fixed commit order
  across sessions: for an insert, the lookup row commits first.

## Where it gets tricky

**A small index can throttle a big table.** In DynamoDB a table write
succeeds only if every global index it touches has write capacity for
it. An index with too little capacity slows writes to the whole table.

**Local indexes can't be added later.** DynamoDB's local indexes must
exist when the table is created. Choosing wrong means a new table.

**The words vary.** DynamoDB says local and global. Vitess says lookup
or cross-shard indexes. What matters is the same question each time:
is the index split the same way as the data, or by the indexed value?

## What this means when you build

- If most queries also name the partition key, a local index is enough
  and stays consistent.
- For a frequent query on another field, a global index turns an
  every-partition read into one lookup, at the cost of a second write.
- Assume a global index can lag behind the table unless the system
  says otherwise.
- Budget index capacity as part of write capacity.

## Further reading

- [Improving data access with secondary indexes](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/SecondaryIndexes.html), DynamoDB Developer Guide. Local vs global indexes side by side: keys, size limits, consistency, capacity.
- [Using Global Secondary Indexes in DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html), DynamoDB Developer Guide. How global indexes are kept in step and how they throttle table writes.
- [Vindexes](https://vitess.io/docs/reference/features/vindexes/), Vitess docs (24.0). Scatter queries, lookup tables as cross-shard indexes, and consistent lookups without two-phase commit.
