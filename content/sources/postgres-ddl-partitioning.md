---
id: postgres-ddl-partitioning
title: Table Partitioning (PostgreSQL docs, 5.12)
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/ddl-partitioning.html
kind: docs
primary: true
---

## Summary

PostgreSQL 18's chapter on declarative table partitioning: one big
table split into smaller tables on the same server, by range, list or
hash. The same word as distributed partitioning, for a single-machine
feature.

## Key claims

- The definition. "Partitioning refers to splitting what is logically one large table into smaller physical pieces." (5.12.1 Overview)
- Dropping or detaching a partition beats a bulk delete. "Dropping an individual partition using DROP TABLE, or doing ALTER TABLE DETACH PARTITION, is far faster than a bulk operation." (5.12.1)
- It pays off for big tables; the rule of thumb is bigger than memory. "a rule of thumb is that the size of the table should exceed the physical memory of the database server." (5.12.1)
- Hash partitioning uses a modulus and remainder. "Each partition will hold the rows for which the hash value of the partition key divided by the specified modulus will produce the specified remainder." (5.12.1, Hash Partitioning)
- Built-in forms are range, list and hash. "Declarative partitioning only supports range, list and hash partitioning" (5.12.3)
- The parent has no storage; rows are routed to partitions. "The partitioned table itself is a “virtual” table having no storage of its own." (5.12.2)
- Where it helps most. "Query performance can be improved dramatically in certain situations, particularly when most of the heavily accessed rows of the table are in a single partition or a small number of partitions." (5.12.1)
- Why: it replaces the top of the index. "Partitioning effectively substitutes for the upper tree levels of indexes, making it more likely that the heavily-used parts of the indexes fit in memory." (5.12.1)
- Dropping a partition also skips vacuum work. "These commands also entirely avoid the VACUUM overhead caused by a bulk DELETE." (5.12.1)
- Pruning. "When the planner can prove this, it excludes (prunes) the partition from the query plan." (5.12.4)
- An index declared on the parent is created on every partition. "This automatically creates a matching index on each partition, and any partitions you create or attach later will also have such an index." (5.12.2)
- CONCURRENTLY doesn't work on the parent. "one limitation when creating new indexes on partitioned tables is that it is not possible to use the CONCURRENTLY qualifier" (5.12.2.2)
- Unique keys must include the partition key. "the constraint's columns must include all of the partition key columns." (5.12.2.3 Limitations)
- Pick the key from the WHERE clauses. "Often the best choice will be to partition by the column or set of columns which most commonly appear in WHERE clauses of queries being executed on the partitioned table." (5.12.6)
- Too many partitions cost planning time and memory. "Too many partitions can mean longer query planning times and higher memory consumption during both query planning and execution" (5.12.6)
- A few thousand is manageable if queries prune. "The query planner is generally able to handle partition hierarchies with up to a few thousand partitions fairly well, provided that typical queries allow the query planner to prune all but a small number of partitions." (5.12.6)

## Visuals worth redrawing

None.

## My notes

- Phase 6 nodes (`table-statistics`, `partial-indexes`) link
  `partitioning` in this single-server sense.
