---
id: awslabs-route53-infima
title: Amazon Route 53 Infima (README)
author: Amazon Web Services (awslabs)
url: https://github.com/awslabs/route53-infima
kind: code
primary: true
---

## Summary

The README of Route 53's open-source Java library for fault isolation.
Explains shuffle sharding with endpoints A to N and two users, gives the
impact formula, and describes two shuffle sharders: one that hashes an
identifier to a shard, and one that stores every shard and enforces a
limit on overlap. Shards can also be spread across availability zones.

## Key claims

- Plain sharding limits a problem to one shard. "the impact is constrained to the set of users sharing that shard, or 1/N of our total number of endpoints." (ShuffleShard)
- It needs clients that can use more than one endpoint. "If the client has some built in resilience, such as support for multiple endpoints with short timeouts, and/or uses Route 53 DNS failover to handle endpoint failures, then Shuffle Sharding may exponentially increase the degree of isolation." (ShuffleShard)
- The example: Alice gets C, F and L, Bob gets B, F and M; they share only F. "this has little if any impact on "Alice" as she shares only one endpoint with "Bob"." (ShuffleShard)
- The impact formula. "The overall service-level impact is dramatically reduced to 1/(N choose K) , where K is the number of endpoints we assign each shuffle shard." (ShuffleShard)
- With enough endpoints, everyone can have a unique shard. "For some services with a large enough number of endpoints, it is even possible to assign each user their own unique ShuffleShard." (ShuffleShard)
- Shards can be zone-aware. "when provided with an availability-zone aware Lattice, the Infima Shuffle Sharders will compute ShuffleShards containing endpoints in each availability-zone." (ShuffleShard)
- The stateless sharder hashes the identifier. "This ShuffleSharding implementation uses simple probabilistic hashing to assign each identifier, represented by a byte array, a shuffle shard." (ShuffleShard, SimpleSignatureShuffleSharder)
- The stateful sharder stores shards to cap overlap. "This implementation can then use this datastore to enforce guarantees about overlap between shuffle shards." (ShuffleShard, StatefulSearchingShuffleSharder)
- Overlap limit example. "For example you may specify that no two assigned shuffle shards may overlap by more than two endpoints." (ShuffleShard, StatefulSearchingShuffleSharder)

## Visuals worth redrawing

- The A to N endpoint row with Alice's and Bob's endpoints starred. Good
  base for a figure of two overlapping shards.

## My notes

- The README's "1/(N choose K)" is the chance that a random other shard
  is exactly the same; a customer who shares some but not all endpoints
  is degraded, not down, if its client fails over.
