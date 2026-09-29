---
id: shuffle-sharding
title: Shuffle sharding
depth: short
phase: 13
note: >-
  Giving each customer its own random small set of workers, so one bad
  customer can't take down the rest.
needs: [cell-based-architecture, failure-domains, retries-with-backoff]
leads_to: []
compare_with: [bulkheads]
---

# Shuffle sharding

Shuffle sharding gives each customer its own small set of workers,
picked from a shared fleet like a hand dealt from a deck of cards, so
that almost no two customers hold the same hand. When one customer's
traffic breaks its workers, everyone else still has at least one healthy
worker, as long as their clients try another. You get isolation close to
dedicated servers per customer, on the same hardware.

## From shards to shuffled shards

Start with a fleet of workers (servers, queues, databases) that every
customer shares. Some failures are caused by one customer: a request
that crashes whatever handles it, or a flood of traffic aimed at one
domain. With no sharding, the first worker falls over, its load moves to
the others, and they fall one by one. Everyone is down.

Plain sharding splits the fleet into fixed groups and puts each customer
in one. A bad customer now takes down only its own group, and everyone
unlucky enough to share it. With eight workers in four pairs, that's a
quarter of your customers. The price is spare capacity: a small group
has less room to absorb a failed worker. [[cell-based-architecture|Cells]]
are this same idea applied to a whole service.

Shuffle sharding keeps the fleet whole and gives every customer its own
combination of workers instead. The groups overlap, on purpose. Say
there are fourteen workers, A to N, and each customer gets three. Alice
is hashed to C, F and L. Bob gets B, F and M.

![Three rows of fourteen workers, A to N. First row: Alice's shard, C, F and L, hashed from her customer ID. Second row: Bob's shard, B, F and M; his poison request breaks all three. Third row: during the incident B, F and M are down, F is crossed out, and Alice still has C and L working, because her client retries on them.](img/shuffle-sharding-overlap.svg)

*Alice shares one worker with Bob, so Bob's trouble costs her one of
three. Adapted from the Route 53 Infima README.*

Bob sends something that breaks every worker he touches. B, F and M go
down. Alice loses F, but her client retries on C or L and she barely
notices. Everyone else who shares one or two workers with Bob is in the
same position.

## Why the numbers get better with size

The number of possible shards is the number of ways to pick K workers
out of N. For eight workers in pairs, that's 28. If customers are spread
over all 28, a problem that takes out one shard completely hits about
1 in 28 of them, against 1 in 4 for plain pairs: seven times better, on
the same eight machines. The fleet still loses a quarter of its workers
during the incident. What changes is who that hurts.

The count grows very fast. Amazon Route 53 has 2,048 virtual name
servers and gives each domain four of them, which allows about 730
billion shards. That's more than there are domains, so each one gets a
unique set, and Route 53 also makes sure no two domains share more than
two servers. When a domain is attacked, its four servers get busy and
no other customer notices. The team can then move that domain to
dedicated capacity built to absorb attacks.

Most scaling problems get harder as a fleet grows. This one gets easier:
more workers, more combinations, and eventually more shards than
customers.

## Two ways to deal the hands

Route 53's open-source library, Infima, has two shuffle sharders:

- **Hash it.** Hash the customer ID to pick K workers. No storage, and
  any router can compute a customer's shard on its own. Overlap between
  two customers is only kept low by chance.
- **Store it.** Record every shard in a datastore and search for a new
  one that meets a rule, like "no two shards share more than two
  workers". The guarantee is exact, at the cost of a database and a
  search.

Both can be zone-aware: pick each customer's workers from different
availability zones, so one zone outage never takes a whole shard (see
[[failure-domains]]).

## Where it gets tricky

**Clients have to move on.** The whole trick depends on a client that
tries another worker when one fails, with short [[timeouts]] and
[[retries-with-backoff|retries]], or DNS failover. A client that keeps
hammering its first worker is down with it.

**1 in 28 is about exact matches.** The formula counts customers who
share all their workers with the bad one. Customers who share some are
not down, but they're running on fewer workers until the incident ends.

**Virtual workers need real separation.** Route 53's name servers are
virtual and don't map one-to-one to physical machines. If several
virtual workers sit on one machine, that machine can break several at
once, so check how your workers map to hardware.

**State makes it harder.** Shuffle sharding is trickier for stateful
components than for stateless workers.

**Not cells, not bulkheads.** Cells share nothing across their
boundary; shuffle shards overlap by design. Shuffle shard inside a
cell, never across cells. [[bulkheads]] split a
service's own resources by dependency, so one slow dependency can't take
all the threads. Shuffle sharding splits workers by customer.

You can also stack it. Recursive shuffle sharding applies it at several
layers, so a customer's own customers are isolated from each other too.

## What this means when you build

- Reach for it when failures come from specific customers: poison
  requests, floods, noisy neighbours.
- Make sure clients can fail over between endpoints before relying on it.
- Hash customer IDs to K of N workers, with K of at least two, spread
  across zones.
- Watch health per shard, so you can spot the customer causing trouble
  and move it somewhere dedicated.

## Further reading

- [Workload isolation using shuffle-sharding](https://aws.amazon.com/builders-library/workload-isolation-using-shuffle-sharding/), Colm MacCárthaigh, Amazon Builders' Library. How Route 53 invented it to survive DDoS attacks, with the eight-worker example and real numbers.
- [Amazon Route 53 Infima](https://github.com/awslabs/route53-infima), AWS. The open-source library: the Alice and Bob example, the impact formula, and hashed versus stored shards.
- [Reducing the Scope of Impact with Cell-Based Architecture](https://docs.aws.amazon.com/wellarchitected/latest/reducing-scope-of-impact-with-cell-based-architecture/reducing-scope-of-impact-with-cell-based-architecture.html), AWS Well-Architected. How shuffle sharding relates to cells, in the FAQ.
