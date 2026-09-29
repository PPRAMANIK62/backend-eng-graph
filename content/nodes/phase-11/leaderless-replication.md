---
id: leaderless-replication
title: Leaderless replication
depth: deep
phase: 11
note: >-
  Dynamo-style: write to several nodes, read from several, fix up
  differences.
needs: [replication]
leads_to: [quorums, anti-entropy, conflict-resolution, tombstones]
compare_with: [leader-follower-replication]
---

# Leaderless replication

In leaderless replication there's no leader to send writes to. A write
goes to several replicas at once and counts as done when enough of them
confirm it; a read asks several replicas and takes the newest answer.
It's one of the main shapes of [[replication]], the design of Amazon's
Dynamo, and of Cassandra and Riak after it. It keeps taking writes when nodes fail, and it hands you the job of
dealing with replicas that disagree.

## A write with no leader

Take one key, `cart:alice`, in a cluster of a few dozen nodes with a
replication factor N of 3. The key is hashed onto a ring, and the first
three distinct nodes clockwise from its position hold its copies
(that's [[consistent-hashing]], and splitting keys across nodes is
[[partitioning]]). Dynamo calls those nodes the key's preference list.
Any node can take the request and act as its coordinator.

Say one of the three, C, is down when Alice adds an item.

![A client write of cart:alice goes to a coordinator, which sends it to replicas A, B and C. C is down. A and B acknowledge, which meets W = 2, so the client gets OK. Later a read with R = 2 gets a new version from A and an old version from C, which is back; the coordinator returns the new version and writes it to C (read repair).](img/leaderless-replication-write-read.svg)

*One write with N = 3 and W = 2, then a read with R = 2 that finds a stale copy. The write half is adapted from Bailis et al., "Probabilistically Bounded Staleness", figure 1.*

1. The coordinator sends the write to all three replicas. In Cassandra
   a write always goes to every replica, whatever level you asked for.
2. It waits for W of them to confirm. With W = 2, A and B are enough,
   and Alice gets "OK" even though C never saw the write.
3. Later a read comes in. The coordinator asks the replicas and waits
   for R answers. With R = 2 it might hear from A (new cart) and C
   (back up, old cart). It returns the newer one.
4. Since it now knows C is stale, it writes the new version to C. That
   is read repair, one of the ways copies catch up
   ([[anti-entropy]]).

Compare this with [[leader-follower-replication]]. There, one node
decides the order of every write, and a follower that's behind simply
replays the log. Here no node decides the order. Each replica just has
whatever writes reached it, and the system has to reconcile them.

## N, W and R are settings

The three numbers are yours to pick, per system and often per request:

- **N**, how many copies. Dynamo's users typically ran with 3.
- **W**, how many replicas must confirm a write.
- **R**, how many must answer a read.

A request is only as fast as the slowest of the W or R replicas it
waits for, so smaller numbers are faster. Dynamo's most common setting
was (N, R, W) = (3, 2, 2). Read-heavy services used R = 1 and W = N:
reads from any one copy, writes to all. And a service that must never
refuse a write can set W = 1, so a write succeeds if any single node
stores it.

If R + W > N, every read set overlaps every write set in at least one
replica. With N = 3 and both at 2, a read always reaches at least one
node that took the last successful write. That rule, and how much less
it promises than it seems, is [[quorums]].

Cassandra hides the numbers behind consistency levels: `ONE`, `QUORUM`
(a majority of the replicas), `ALL`, `LOCAL_QUORUM` (a majority in the
local datacenter), and others. They're the same idea. Riak uses N, R and
W directly, and defaults to N = 3 with R and W set to a majority.

## When a replica is down

Dynamo was built to be "always writeable". If one of a key's first N
nodes is unreachable, the write goes to the next healthy node on the
ring instead, with a note, a hint, saying which node it was meant for.
When the intended node comes back, the stand-in hands the write over
and deletes its copy. Dynamo calls counting stand-ins toward W a sloppy
quorum, and the handover hinted handoff. Riak does the same by default
with fallback nodes, and lets you require real owners with PR and PW.

Cassandra keeps the hints on the coordinator instead. It stores a hint
on its own disk for the replica that missed the write,
for up to 3 hours of that replica's downtime by default, and replays it
when the replica returns. Hints are best effort. A replica that's gone
longer stays out of sync until repair reaches it.

## Two writes at once

With no leader, two clients can write the same key at the same moment
through different coordinators, and different replicas may see the two
writes in different orders. Nothing picks a single order. So every
value needs a version the system can compare.

Dynamo treated every write as a new version with a vector clock
attached. If one version's clock shows it came after the other, the
older one is dropped. If neither came after the other, the read returns
both and the application merges them, as the shopping cart did.
Cassandra went the other way: every write carries a timestamp and the
largest one wins, column by column. Both are
[[conflict-resolution]], and the choice matters more than almost any
other in a leaderless store.

## How stale is it, really

"Eventually consistent" says replicas agree once writes stop. It gives
no bound on how old a read can be ([[eventual-consistency]]). A 2012
study by Bailis and others put numbers on it for Dynamo-style stores
that don't require overlap, using latency data from LinkedIn and
Yammer. Reads were usually consistent within tens of milliseconds.
On LinkedIn's spinning disks, a read right after a write saw it only
43.9% of the time, and the wait for a 99.9% chance of a fresh read was
45.5 ms against 1.85 ms on SSDs. On Yammer's data, dropping from a
strict to a partial quorum cut combined read and write latency at the
99.9th percentile from 230 ms to 43.3 ms, in exchange for a window of
202 ms in which a read might be stale.

These are modeled from real latency distributions, not measured
staleness, but they explain why so many clusters run with small R and
W.

## Where it gets tricky

**A failed write may have succeeded.** When a write can't reach W
replicas, the client gets an error, but some replicas may have stored
it anyway. Riak's docs say so directly: a failure reported because not
enough primaries answered doesn't mean the write failed completely, and
it will spread to the others by repair. Retrying such a write is safe
only if the write is [[idempotency|idempotent]].

**Defaults can be weaker than you think.** When the 2012 study was
written, Cassandra defaulted to N = 3 with R = W = 1, and most users wrote
with W = 1. Riak's `notfound_ok`, true by default, lets a read return
"not found" as soon as the first replica to answer lacks the key, which
behaves like R = 1 for missing keys.

**Low W is a durability risk as well.** A write confirmed by one or two
nodes is only on one or two nodes until it spreads. Dynamo's authors
describe that as a window where a confirmed write is vulnerable.

**Leaderless doesn't mean "no coordination at all".** Membership, the
ring, and [[failure-detection]] still need agreement of a kind, usually by
[[gossip-protocols]]. What's missing is a single node ordering writes
to each key.

## What this means when you build

- Pick N, R and W on purpose, per kind of data, and write the reason
  down. The defaults were chosen for speed.
- Use R + W > N when a read must see the last confirmed write, and
  still read [[quorums]] for what that doesn't cover.
- Decide how concurrent writes to one key are resolved before storing
  anything you can't afford to lose.
- Run anti-entropy repair on a schedule. Read repair only fixes keys
  someone reads.
- Treat write [[timeouts]] as "unknown", not "failed".

## Further reading

- [Dynamo: Amazon's Highly Available Key-value Store](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf), DeCandia et al., SOSP 2007. The original design: preference lists, N/R/W, sloppy quorums, hinted handoff, vector clocks, and how Amazon's services set them.
- [Dynamo (Cassandra architecture)](https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html), Apache Cassandra docs, version 5.0. What Cassandra kept and changed: consistency levels, writes to all replicas, last write wins.
- [Hints](https://cassandra.apache.org/doc/latest/cassandra/managing/operating/hints.html), Apache Cassandra docs, version 5.0. Hinted handoff step by step, the 3-hour window, and why hints are best effort.
- [Replication Properties](https://docs.riak.com/riak/kv/latest/developing/app-guide/replication-properties/index.html), Riak KV docs, version 2.2.3. N, R, W, PR, PW, DW and `notfound_ok`, and sloppy vs strict quorums.
- [Probabilistically Bounded Staleness for Practical Partial Quorums](http://www.bailis.org/papers/pbs-vldb2012.pdf), Bailis, Venkataraman, Franklin, Hellerstein, Stoica, VLDB 2012. How stale Dynamo-style reads get, with numbers from production latency data.
