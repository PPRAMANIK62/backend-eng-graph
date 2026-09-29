---
id: mongodb-hashed-sharding
title: Hashed Sharding (MongoDB manual)
author: MongoDB, Inc.
url: https://www.mongodb.com/docs/manual/core/hashed-sharding/
kind: docs
primary: true
---

## Summary

MongoDB manual 8.3 page on hashed shard keys, with a direct comparison
to ranged sharding on a monotonically increasing key.

## Key claims

- Hashing spreads data more evenly but turns range queries into broadcasts. "Hashed sharding provides a more even data distribution across the sharded cluster at the cost of reducing Targeted Operations vs. Broadcast Operations ." (Hashed Sharding)
- Neighbouring keys end up apart. "Post-hash, documents with "close" shard key values are unlikely to be on the same chunk or shard" (Hashed Sharding)
- Equality queries are still targeted. "mongos can target queries with equality matches to a single shard." (Hashed Sharding)
- A compound hashed key keeps a ranged prefix and hashes one field. "Compound hashed index compute the hash value of a single field in the compound index; this value is used along with the other fields in the index as your shard key." (Sharding on a Compound Hashed Index)
- Hashed keys suit monotonic fields. "Hashed keys are ideal for shard keys with fields that change monotonically like ObjectId values or timestamps." (Hashed Sharding Shard Key)
- With ranged sharding on an increasing key, the top chunk takes the inserts. "Since the value of X is always increasing, the chunk with an upper bound of MaxKey receives the majority incoming writes." (Hashed vs Ranged Sharding)
- That puts inserts on one shard. "This restricts insert operations to the single shard containing this chunk, which reduces or removes the advantage of distributed writes in a sharded cluster." (Hashed vs Ranged Sharding)
- Floats are truncated before hashing, so the docs' example values 2.2, 2.3 and 2.9 all hash the same. "MongoDB hashed indexes truncate floating point numbers to 64-bit integers before hashing." (Warning)
- A hashed key needs many distinct values. "The field you choose as your hashed shard key should have a good cardinality , or large number of different values." (Hashed Sharding Shard Key)
- Ranged queries tend to go to every shard. "the mongos is more likely to perform Broadcast Operations to fulfill a given ranged query." (Hashed Sharding)

## Visuals worth redrawing

- The two insert-distribution diagrams (ranged vs hashed on an
  increasing X).

## My notes

- The companion Ranged Sharding page says ranged is the default method
  and that close keys are likely in the same chunk.
