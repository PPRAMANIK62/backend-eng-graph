---
id: mongodb-write-concern
title: Write Concern (MongoDB manual)
author: MongoDB, Inc.
url: https://www.mongodb.com/docs/manual/reference/write-concern/
kind: docs
primary: true
---

## Summary

The MongoDB manual page (8.3 when read) for write concern: how many
replica set members must confirm a write before the client hears
back. The implicit default today is a majority, and `w: 1` means only
the primary, with the risk of rollback.

## Key claims

- The default now waits for a majority. "The implicit default write concern is w: majority" (Implicit Default Write Concern)
- What majority means in a three-member set. "For this replica set, the calculated majority is 2, and the write must propagate to the oplogs of the primary and one secondary to acknowledge the write concern to the client." (Calculating Majority for Write Concern)
- `w: 1` only waits for the primary, and those writes can be lost. "Data can be rolled back if the primary steps down before the write operations replicate to any of the secondaries." (w: 1)
- Arbiters are an edge case for the majority default. "However, there is an edge case for replica set deployments containing arbiters" (Implicit Default Write Concern)

## Visuals worth redrawing

None.

## My notes

- The page doesn't say in which version the default changed in the
  text read; the article says only "today" and pins it to the 8.3
  manual.
