---
id: mongodb-data-modeling
title: "Best Practices for Data Modeling in MongoDB"
author: MongoDB, Inc.
url: https://www.mongodb.com/docs/manual/data-modeling/best-practices/
kind: docs
primary: true
---

## Summary

MongoDB's own guide to document data modeling (Database Manual, read at
8.3, the current version when opened). When to embed related data in
one document and when to reference another collection, what duplicated
data costs, and why single-document writes are the unit of atomicity.

## Key claims

- Relationships are modeled by embedding or referencing. "To link related data, you can either:" (Link Related Data)
- Embed when there's a "has-a" or "contains" relationship. "You have a \"has-a\" or \"contains\" relationship between entities." (Link Related Data table)
- Reference when the child side is large. "The child side of the relationship has high cardinality." (Link Related Data table)
- Reference when embedded data grows without bound. "Your embedded data grows without bounds." (Link Related Data table)
- Embedding duplicates data, which removes joins but costs updates. "Duplicating data can remove the need to perform joins across multiple collections, which can improve application performance." (Duplicate Data)
- Frequently updated duplicates hurt. "However, frequently updating duplicate data can cause heavy workloads and performance issues." (Duplicate Data)
- A write is atomic per document. "In MongoDB, a write operation is atomic on the level of a single document." (Atomicity)
- Multi-document transactions exist but cost more and don't replace schema design. "In most cases, a distributed transaction incurs a greater performance cost over single document writes, and the availability of distributed transactions should not be a replacement for effective schema design." (Atomicity, Important)
- Embed when queried together, updated together or archived together. "Your application queries pieces of information together." / "You have data that's often updated together." / "You have data that should be archived at the same time." (Link Related Data table, all "Embedding")
- Reference when written at different times or when the child stands alone. "Your data is written at different times in a write-heavy workload." / "For the child side of the relationship, your data can exist by itself without a parent." (Link Related Data table, both "Referencing")
- Page read at manual version 8.3 (marked Current).

## Visuals worth redrawing

None.

## My notes

- The URL embedding-vs-references redirects here (#link-related-data).
- The overview page (data-modeling/) was opened too but isn't cited; its
  "data that's accessed together should be stored together" line is the
  same idea as the DynamoDB guide's "keep related data together".
