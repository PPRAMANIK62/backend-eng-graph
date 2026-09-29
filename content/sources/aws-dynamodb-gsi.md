---
id: aws-dynamodb-gsi
title: Using Global Secondary Indexes in DynamoDB
author: Amazon Web Services
url: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html
kind: docs
primary: true
---

## Summary

The DynamoDB Developer Guide page on global secondary indexes: how
they're kept in step with the table (asynchronously), and how their
separate throughput can throttle writes to the table.

## Key claims

- Updated asynchronously. "When an application writes or deletes items in a table, any global secondary indexes on that table are updated asynchronously, using an eventually consistent model." (Data synchronization between tables and Global Secondary Indexes)
- Usually within a fraction of a second, sometimes longer. "Changes to the table data are propagated to the global secondary indexes within a fraction of a second, under normal conditions." (Data synchronization between tables and Global Secondary Indexes)
- So your code must expect stale index reads. "your applications need to anticipate and handle situations where a query on a global secondary index returns results that are not up to date." (Data synchronization between tables and Global Secondary Indexes)
- A table write needs capacity in every global index it touches. "For a table write to succeed, the provisioned throughput settings for the table and all of its global secondary indexes must have enough write capacity to accommodate the write." (Provisioned throughput considerations for Global Secondary Indexes, Write capacity units)
- An under-provisioned index throttles the table. "If you perform heavy write activity on the table, but a global secondary index on that table has insufficient write capacity, the write activity on the table will be throttled." (Provisioned throughput considerations for Global Secondary Indexes)
- Rare failures can delay it longer. "However, in some unlikely failure scenarios, longer propagation delays might occur." (Data synchronization between tables and Global Secondary Indexes)

## Visuals worth redrawing

None.

## My notes

- The index's own write capacity is separate from the table's, which
  is why a small index can throttle a big table.
