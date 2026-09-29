---
id: network-partitions
title: Network partitions
depth: short
phase: 11
note: >-
  Some machines can't reach others, and neither side knows why.
needs: [distributed-system]
leads_to: [fault-injection, cap-theorem, split-brain]
compare_with: [failure-detection]
---

# Network partitions

A network partition is when some nodes in a
[[distributed-system|distributed system]] can't reach some others, while
each keeps running. From inside, a partition looks like the other side
crashed, and the other side thinks the same about you. Most of the damage
comes from what the two sides do next, without being able to talk.

## Forty-three seconds, one day of trouble

In 2018, maintenance on optical equipment cut the link between GitHub's
East Coast network hub and its main East Coast data center. It was back in
43 seconds.

That was long enough. GitHub's MySQL clusters were managed by Orchestrator,
a failover tool that decides by quorum using Raft. The Orchestrator nodes on
the West Coast and in the cloud could still reach each other, formed a
majority, and promoted West Coast databases to primary. When the link came
back, the application tier started writing to them.

Meanwhile the old East Coast primaries held a few seconds of writes that
had never been copied west. When the link came back, each side had writes
the other didn't have. There was no safe way to fail back, and East Coast
applications couldn't live with a cross-country round trip on every query.
The site ran degraded for 24 hours and 11 minutes while GitHub restored and
reconciled. One of the busiest clusters alone had 954 writes stranded on the
East Coast side.

Nothing in that chain was a bug in the usual sense. The failover tool did
what it was configured to do. A short partition met an automatic
[[failover]], and both sides acted on what they could see.

## Three shapes of partition

A partition isn't always a clean cut down the middle.

![Three diagrams. Complete: nodes 1 and 2 on one side of a dashed red line, nodes 3, 4 and 5 on the other, with no links across. Partial: nodes A and B joined by a cut link, both still connected to node C. Simplex: node A's heartbeats reach node B, but everything going into A is dropped.](img/network-partitions-types.svg)

*The three kinds. Adapted from Alquraan et al., "An Analysis of Network-Partitioning Failures in Cloud Systems", figure 1 (OSDI 2018).*

- **Complete.** The nodes split into two groups with no traffic between
  them. It happens when a core, aggregation or top-of-rack switch fails,
  when a link between data centers goes, or when a single machine's network
  card dies.
- **Partial.** Two groups can't reach each other, but a third group reaches
  both. The nodes now disagree about who is up, because each one's answer
  depends on where it stands. This can happen when two data centers lose
  their link but both still reach a third.
- **Simplex.** Traffic flows one way only. In one real case a server's
  network card dropped everything coming in but still sent heartbeats out.
  The standby kept receiving heartbeats, decided the primary was fine, and
  never took over, while the primary couldn't serve anyone.

## What partitions do to real systems

A study of 136 partition-caused failures in 25 widely used systems,
including MongoDB, Elasticsearch, Redis, Kafka and HDFS, found them far
worse, and far easier to trigger, than you'd hope:

- **Mostly catastrophic, mostly silent.** 80% broke the system's promises
  or crashed it, with data loss the most common result (27%). 90% returned
  no error or warning to the client.
- **Damage that outlives the partition.** 21% left the system broken even
  after the network healed.
- **Leader election is the weak spot.** It was involved in 40% of the
  failures. The most common flaw was [[split-brain|two leaders at once]]: the majority side
  elects a new one while the old one, cut off, still believes it's in
  charge and may keep serving stale reads.
- **One node is enough.** 88% needed nothing more than isolating a single
  node, which one bad cable or network card can do.
- **Partial partitions matter.** 29% of the failures needed only a partial
  partition.
- **Keeping clients on one side doesn't save you.** 64% needed no client
  activity at all, or clients on just one side.

## Where it gets tricky

**You can't tell a partition from a crash.** Both look like silence. A node
that stops hearing from another has to guess, which is why
[[failure-detection]] uses timeouts and can be wrong. A long
[[process-pauses|process pause]] looks the same from outside too.

**Majorities help, but aren't the whole answer.** Requiring a majority
stops the minority side from electing a leader. It doesn't stop the old
leader from acting until it notices, and it doesn't help if the rule for
picking the new leader is too simple. The study found elections that
picked the node with the longest log or the newest timestamp, and lost the
majority's writes that way.

**You must choose.** While a partition lasts, each side either keeps
answering, and risks disagreeing with the other side, or stops answering
until it can check. That choice is what the [[cap-theorem]] is about.

## What this means when you build

- Decide ahead of time what each side of a partition should do: keep
  serving, serve reads only, or stop.
- Be careful with automatic failover across regions. A short partition can
  trigger a promotion that takes a day to undo.
- Make an isolated leader step down, and make storage reject writes from a
  leader that's been replaced ([[fencing-tokens]]).
- Test with partitions, including partial and one-way ones, not just
  crashes. Three nodes are enough to reproduce most of these bugs.
  That's [[fault-injection]].

## Further reading

- [An Analysis of Network-Partitioning Failures in Cloud Systems](https://www.usenix.org/system/files/osdi18-alquraan.pdf), Ahmed Alquraan and others, OSDI 2018. 136 real failures: the three partition types, what breaks, and how easy it is to trigger.
- [Post-incident analysis of GitHub's 2018 MySQL failover](https://github.blog/news-insights/company-news/oct21-post-incident-analysis/), Jason Warner, GitHub, 2018. How 43 seconds of lost connectivity became a day of degraded service.
