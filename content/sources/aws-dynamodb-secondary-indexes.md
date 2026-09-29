---
id: aws-dynamodb-secondary-indexes
title: Improving data access with secondary indexes in DynamoDB
author: Amazon Web Services
url: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/SecondaryIndexes.html
kind: docs
primary: true
---

## Summary

The DynamoDB Developer Guide's overview of its two kinds of secondary
index, with a comparison table: a global secondary index is its own
partitioned table keyed by the indexed attribute; a local secondary
index lives inside each base-table partition.

## Key claims

- Global: its own keys, spans all partitions. "A global secondary index is considered "global" because queries on the index can span all of the data in the base table, across all partitions." (intro)
- Global indexes are stored and scaled apart from the table. "A global secondary index is stored in its own partition space away from the base table and scales separately from the base table." (intro)
- Local: same partition key, scoped to one partition. "A local secondary index is "local" in the sense that every partition of a local secondary index is scoped to a base table partition that has the same partition key value." (intro)
- Queries: whole table vs one partition. "A local secondary index lets you query over a single partition, as specified by the partition key value in the query." (comparison table, Queries and Partitions)
- Consistency: global indexes are eventually consistent only. "Queries on global secondary indexes support eventual consistency only." (comparison table, Read Consistency)
- Local indexes can be read strongly consistent. "When you query a local secondary index, you can choose either eventual consistency or strong consistency." (comparison table, Read Consistency)
- Local indexes cap each partition key value at 10 GB. "For each partition key value, the total size of all indexed items must be 10 GB or less." (comparison table, Size Restrictions)
- Local indexes only at table creation. "You cannot add a local secondary index to an existing table, nor can you delete any local secondary indexes that currently exist." (comparison table, Online Index Operations)
- Global index queries can only return projected attributes; local ones can fetch the rest from the table. "DynamoDB does not fetch any attributes from the table." (comparison table, Projected Attributes)
- A local index shares the partition key and changes the sort key. "Local secondary index — An index that has the same partition key as the base table, but a different sort key." (intro)
- A global index has its own capacity. "Every global secondary index has its own provisioned throughput settings for read and write activity." (comparison table, Provisioned Throughput Consumption)

## Visuals worth redrawing

None.

## My notes

- Global = "term-partitioned" in the textbook sense, local =
  "document-partitioned". DynamoDB doesn't use those words.
