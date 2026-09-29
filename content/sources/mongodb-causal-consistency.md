---
id: mongodb-causal-consistency
title: "Causal Consistency and Read and Write Concerns (MongoDB Database Manual)"
author: MongoDB, Inc.
url: https://www.mongodb.com/docs/manual/core/causal-consistency-read-write-concerns/
kind: docs
primary: true
---

## Summary

How MongoDB's causally consistent client sessions give read your own
writes, monotonic reads, monotonic writes and writes follow reads
(current manual, MongoDB 8.0 era), and which read and write concern
combinations actually keep those guarantees, including during the
moment when two nodes both think they're primary.

## Key claims

- A session feature. "With MongoDB's causally consistent client sessions, different combinations of read and write concerns provide different causal consistency guarantees." (intro)
- Only majority reads plus majority writes keep all four guarantees with durability. "only read operations with "majority" read concern and write operations with "majority" write concern can guarantee all four causal consistency guarantees." (intro)
- They hold even with two transient primaries. "The read concern "majority" and write concern "majority" ensure that the four causal consistency guarantees hold even in circumstances (such as with a network partition) where two members in a replica set transiently believe that they are the primary." (intro)
- w:1 writes to the old primary roll back. "Any writes made to P _(old) and/or replicated to S ₁ during the partition are rolled back." (Read Concern "majority" and Write Concern "majority")
- Local reads with w:1 writes give no causal guarantee. "The use of read concern "local" and write concern { w: 1 } in a causally consistent session cannot guarantee causal consistency." (Read Concern "local" and Write Concern {w: 1})
- The table: majority/majority gets read own writes, monotonic reads, monotonic writes and writes follow reads; local/w:1 gets none. (table at the top of the page)

## Visuals worth redrawing

- The table of read and write concern combinations vs the four
  guarantees. Could be redrawn as a small grid.

## My notes

- "P _(old)" and "S ₁" are how the page's subscripts came through the
  text conversion.
