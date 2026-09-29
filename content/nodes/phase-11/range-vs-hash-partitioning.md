---
id: range-vs-hash-partitioning
title: Range vs hash partitioning
depth: short
phase: 11
note: >-
  Split by key ranges or by a hash of the key, and what each makes easy.
needs: [partitioning]
leads_to: []
compare_with: []
---

# Range vs hash partitioning

Once you've picked a partition key, you need a rule that turns each key
into a partition. There are two main rules: cut the sorted keys into
ranges, or hash each key and cut up the hash values. Ranges keep
neighbouring keys together, which makes range queries cheap and makes
keys that arrive in order pile onto one partition. Hashing spreads keys
evenly and scatters every range query.

## Same keys, two rules

Take an orders table [[partitioning|partitioned]] by order ID, where
each new order gets the next number.

With **range partitioning**, P1 holds orders 1 to 100, P2 holds 101 to
200, and P3 holds everything from 201 up. A query for orders 150 to 250
reads only P2 and P3. But every new order has the largest ID so far, so
every insert lands in P3, the partition whose range runs to the top.
One machine takes all the writes while the others sit idle.

With **hash partitioning**, the rule hashes the order ID first and cuts
up the hash values instead. Orders 301, 302 and 303 hash to unrelated
values and land on different partitions, so writes spread out. The
same query for orders 150 to 250 now has to ask every partition,
because those hundred orders are scattered over all of them.

![Two panels. Left, range partitions: P1 holds keys 1 to 100, P2 holds 101 to 200, P3 holds 201 to max. Arrows from new orders 301, 302 and 303 all point to P3. Notes say all new orders land in P3, and a scan of orders 150 to 250 reads P2 and P3. Right, hash partitions: P1, P2 and P3 each hold a range of hash values, and the same three orders go to three different partitions. Notes say new orders spread over all three, and a scan of orders 150 to 250 reads every partition.](img/range-vs-hash-partitioning-inserts.svg)

*The same three inserts under each rule.*

Real systems hit exactly this. With MongoDB range sharding on an
always-increasing field, the chunk whose upper
bound is the maximum key takes most inserts, and writes stop being
spread over the cluster. CockroachDB has the same problem with
sequential index keys: every write is appended to the end of one range,
and even its automatic load-based splitting can't find a point that
divides the traffic.

## What each rule makes easy

**Range:**

- Range scans and ordered reads touch few partitions.
- Sequential keys, like timestamps and auto-increment IDs, turn the
  last partition into a hot spot.

**Hash:**

- Keys spread evenly, even when they arrive in order. MongoDB
  recommends hashed shard keys for fields that grow steadily, like
  ObjectIds and timestamps.
- A lookup of one exact key still goes to one partition.
- A range query usually has to go to every partition and merge the
  results.
- The key needs many distinct values. Hashing a field with a handful of
  values still gives only a handful of places to put the data.

## Getting some of both

You don't have to hash the whole key. Hash one part and keep the rest
in order, and you get even spread across partitions plus cheap range
reads inside each one.

- MongoDB's compound hashed shard key hashes one field and uses it
  together with the other fields of the key, unhashed.
- CockroachDB's hash-sharded index adds a hidden shard column, a hash
  of the key, and places rows by that instead of by the sequential key,
  so consecutive rows land in different buckets.
  Its `shard_columns` option hashes only the leading columns, for
  queries that filter on those and then scan or sort by the later ones.

The price is paid on scans across the whole key: a CockroachDB scan
over a hash-sharded index reads every bucket and combines the results.
More buckets spread writes better but make those scans do more work,
and going past the number of nodes gives little extra.

## Where it gets tricky

**Hash partitioning isn't a hash index.** The names are close enough
to mix up. A hash index is a kind of index
inside one database ([[index-types]]). Hash partitioning decides which
machine a row lives on.

**Hashing can't split one busy key.** Every request for the same key
hashes to the same value, so a single popular key stays on one
partition whatever rule you choose. That's [[hot-spots]].

**The hash sees what the database sees.** MongoDB's hashed indexes
truncate floating-point values to 64-bit integers before hashing, so
2.2, 2.3 and 2.9 all hash the same. Hashing only spreads values that
actually differ.

## What this means when you build

- Use ranges when your main queries are ranges over the key and new
  keys don't arrive in order.
- Hash sequential keys, like timestamps and auto-increment IDs, unless
  you really need to scan them in order.
- Hash the part you look up by and keep the part you scan in order, if
  you need both.

## Further reading

- [Hashed Sharding](https://www.mongodb.com/docs/manual/core/hashed-sharding/), MongoDB manual 8.3. Hashed vs ranged shard keys on an increasing field, compound hashed keys, and the float truncation trap.
- [Hash-sharded indexes](https://www.cockroachlabs.com/docs/stable/hash-sharded-indexes), CockroachDB docs (v26.3). Why sequential keys defeat range splitting, and how a hashed bucket prefix trades scan cost for write spread.
