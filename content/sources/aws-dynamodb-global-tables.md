---
id: aws-dynamodb-global-tables
title: "How DynamoDB global tables work"
author: Amazon Web Services
url: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/V2globaltables_HowItWorks.html
kind: docs
primary: true
---

## Summary

The DynamoDB developer guide page for the current version of global
tables: one replica table per AWS Region, every replica takes writes.
The default mode (MREC) replicates asynchronously and resolves
concurrent writes by last writer wins; the newer mode (MRSC) replicates
synchronously across exactly three Regions and rejects conflicting
writes instead.

## Key claims

- One replica per Region. "Each global table can have only one replica per AWS Region." (Concepts)
- A write in any Region goes to all the others. "When an application writes data to a replica in one Region, DynamoDB automatically replicates the write to all other replicas in the global table." (Concepts)
- MREC is the default. "If you do not specify a consistency mode when creating a global table, the global table defaults to multi-Region eventual consistency (MREC)." (Consistency modes)
- MREC replicates asynchronously, usually fast. "Item changes in an MREC global table replica are asynchronously replicated to all other replicas, typically within a second or less." (MREC)
- Concurrent writes to one item: latest internal timestamp wins, per item. "DynamoDB will resolve the conflict by using the modification with the latest internal timestamp on a per-item basis" (MREC)
- A strongly consistent read is only strong for writes made in that Region. "may return stale data if the item was last updated in a different Region." (MREC)
- Conditional writes only see the local copy. "Conditional writes evaluate the condition expression against the version of the item in the Region." (MREC)
- Transactions are atomic only in their own Region. "are only atomic within the Region where the operation was invoked." (Transactions)
- MREC can lose the last few seconds on a Region failure. "MREC global tables have a Recovery Point Objective (RPO) equal to the replication delay between replicas, usually a few seconds depending on the replica Regions." (Choosing a consistency mode)
- MRSC waits for another Region before acknowledging. "Item changes in an MRSC global table replica are synchronously replicated to at least one other Region before the write operation returns a successful response." (MRSC)
- MRSC needs exactly three Regions. "A MRSC global table must be deployed in exactly three Regions." (MRSC)
- MRSC rejects concurrent writes instead of merging them. "A write operation fails with a ReplicatedWriteConflictException when it attempts to modify an item that is already being modified in another Region." (MRSC)
- Other Regions can see part of a transaction. "you might observe partially completed transactions in the US West (Oregon) Region as changes are replicated." (Transactions)
- A rejected MRSC write can be retried. "Writes that fail with the ReplicatedWriteConflictException can be retried and will succeed if the item is no longer being modified in another Region." (MRSC)
- MRSC writes pay for cross-Region communication. "For MRSC global tables, write and strongly consistent read latencies depend on the Regions you choose because these operations require cross-Region communication." (MRSC)
- Under last writer wins, every replica converges to the same version. "An item will eventually converge in all replicas to the version created by the last write." (MREC)
- Unreplicated writes in an impaired Region are sent on once it recovers. "In the unlikely event a replica in a MREC global table becomes isolated or impaired, any data not yet replicated to other Regions will be replicated when the replica becomes healthy." (MREC)
- MRSC can use a witness in place of a third replica. "You can configure a MRSC global table with three replicas, or with two replicas and one witness." (MRSC)

## Visuals worth redrawing

None.

## My notes

- Global tables have two versions; this page covers the current one. The
  version names are dates, so they're left out of articles.
