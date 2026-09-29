---
id: anti-entropy
title: Read repair and anti-entropy
depth: deep
phase: 11
note: >-
  How leaderless copies catch up: read repair when a read spots a stale
  copy, Merkle trees in the background.
needs: [leaderless-replication]
leads_to: []
compare_with: [gossip-protocols]
---

# Read repair and anti-entropy

In [[leaderless-replication]], a replica that was down or slow misses
writes, and nothing replays a log to it later. Two mechanisms bring it
back in line. Read repair fixes a stale copy when a read happens to
notice it. Anti-entropy runs in the background, compares whole replicas
cheaply with hash trees, and copies over what differs.

## Read repair: fix it when you see it

A read in a Dynamo-style store asks several replicas. If their answers
differ, the coordinator now knows which replicas are behind, so it
writes the newest version back to them. Dynamo named this read repair:
it fixes replicas at a convenient moment and saves the background
process some work.

Cassandra (5.0) does it like this, for a read at `QUORUM` or `TWO`:

1. The coordinator sends a full read to the replica it expects to be
   fastest and a digest read to the others. A digest read returns only a hash of
   the data, to save bandwidth.
2. If the hashes match, it returns the data.
3. If they don't, it fetches full data from those replicas, compares
   them, and picks the most recent by timestamp.
4. It writes that version to the stale replicas that took part in the
   read, waits until enough of them confirm, then answers the client.

At `ONE` there's nothing to compare, so no read repair.

The wait in step 4 matters. Say a write reached only one replica and
then failed, so the client got an error. A quorum read that includes
that replica returns the new value. Without the repair, the next quorum
read might ask two replicas that don't have it, and the value would
seem to vanish. Blocking read repair writes it to a quorum first, so
two quorum reads in a row never go backwards. Cassandra calls this
monotonic quorum reads.

Read repair only fixes keys someone reads, on the replicas the read
touched.

## Where anti-entropy comes from

The name comes from a 1987 Xerox PARC paper about keeping the replicas
of a name service in sync. It compared three ways to spread an update:

- **Direct mail.** The site that takes the update mails it to every
  other site. Timely and cheap, but not reliable: a site doesn't always
  know every other site, and mail gets lost.
- **Anti-entropy.** Every site regularly picks another site at random,
  compares database contents with it, and resolves every difference.
  Extremely reliable, but it means examining the whole database, so it
  can't run very often.
- **Rumor mongering.** A site with a new update keeps telling random
  sites about it, and stops once it keeps hearing from sites that
  already know. It's cheap enough to run often, with a small chance
  that some site never hears.

The paper's conclusion is the pattern systems still use: spread updates
with something fast and unreliable, and run anti-entropy in the
background as the safety net that guarantees every replica eventually
converges.

Both methods are epidemics, and they spread like one. Starting from one
site, a simple epidemic reaches the whole population in expected time
proportional to the logarithm of the number of sites. The direction of
each exchange matters, though. With push, a site with news sends it;
with pull, a site asks for news. When only a few sites are left without
the update, push has to find them by chance, while each of them pulling
finds an informed site almost every time. So pull, or push and pull
together, finishes much faster than push alone. [[gossip-protocols]]
build on the same results.

## Comparing replicas cheaply

Comparing two replicas key by key would mean shipping every key across
the network. Dynamo, and Cassandra's repair after it, use a
[[merkle-trees|Merkle tree]] per key range instead: a tree of hashes
where equal hashes at any level mean equal data below it.

![Two Merkle trees, one per replica, for the same key range. Each leaf is the hash of one key's value, and each parent is the hash of its children. The roots differ. The left children match, so that half is skipped. The right children differ, and below them the leaves for k3 match while the leaves for k4 differ, so only k4 is copied.](img/anti-entropy-merkle-compare.svg)

*Comparing two replicas' Merkle trees. Only the branches whose hashes differ are walked.*

Two replicas exchange their root hashes. If the roots match, they're
done. If not, they descend only into branches whose hashes differ, until
they reach the keys that are out of sync, and copy just those. That
keeps both network traffic and disk reads down, which is what makes it
affordable to run.

In Cassandra this is `nodetool repair`, and it doesn't run by itself,
because it still costs a lot of disk and network I/O. You schedule it.
A full repair hashes all the data in a range. An incremental repair, the
default, only covers data written since the last one. The Cassandra
docs suggest starting with an incremental repair every one to three
days and a full one every one to three weeks.

## Deletes depend on it

You can't delete a key by just removing it from one replica: the next
anti-entropy round would find it on the others and copy it back. So a
delete is written as a marker, a [[tombstones|tombstone]], that spreads
like any other write. Markers can't be kept forever, so they're purged
after a grace period, 10 days by default in Cassandra. If a replica
that missed the delete isn't repaired before its tombstone is purged,
the deleted row comes back. The rule of thumb is to repair every node
within the grace period: at least once every 7 days with the default of
10.

## Where it gets tricky

**Hints and read repair aren't enough.** Hints are best effort and can
miss writes, and read repair is no substitute for a full repair.

**Read repair can break write atomicity.** Cassandra repairs only the
data a query read. If you wrote several rows of a partition in one
batch and read one row back, only that row gets repaired, and other
readers can see part of the batch. Cassandra 4.0 added a per-table
`read_repair` option: `BLOCKING` (the default) keeps monotonic quorum
reads, `NONE` keeps batch atomicity and gives those up.

**Background read repair is gone.** Older Cassandra also had a
background read repair, set with `read_repair_chance`. Cassandra 4.0
removed it.

**Incremental repair trusts its own marks.** Data marked repaired is
never checked again, so it won't catch disk corruption or bugs. Run a
full repair now and then.

**Anti-entropy never makes replicas fully consistent while writes keep
coming.** The 1987 paper is explicit: sites can only become fully
consistent once all updating stops. In a busy system, anti-entropy keeps
the gap small; it doesn't close it.

## What this means when you build

- Use a fast path to spread writes (writing to several replicas, hints,
  rumor-style gossip) and anti-entropy as the background net under it.
- Schedule anti-entropy repair, and alert when it hasn't finished
  within your tombstone grace period.
- If you build gossip-style anti-entropy yourself, use pull or
  push-pull, not push alone.
- Don't rely on read repair for data nobody reads.

## Further reading

- [Epidemic Algorithms for Replicated Database Maintenance](https://bitsavers.org/pdf/xerox/parc/techReports/CSL-89-1_Epidemic_Algorithms_for_Replicated_Database_Maintenance.pdf), Demers et al., Xerox PARC, PODC 1987. Where anti-entropy and death certificates come from.
- [Dynamo: Amazon's Highly Available Key-value Store](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf), DeCandia et al., SOSP 2007. Read repair and Merkle-tree anti-entropy as first described for this kind of store.
- [Read repair](https://cassandra.apache.org/doc/latest/cassandra/managing/operating/read_repair.html), Apache Cassandra docs, version 5.0. Digest reads, blocking repair, monotonic quorum reads and the 4.0 changes.
- [Repair](https://cassandra.apache.org/doc/latest/cassandra/managing/operating/repair.html), Apache Cassandra docs, version 5.0. Full and incremental repair, scheduling, and the gc grace period.
