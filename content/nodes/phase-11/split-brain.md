---
id: split-brain
title: Split brain
depth: short
phase: 11
note: >-
  Two nodes that both think they are the leader, and how quorums and
  fencing stop it.
needs: [failover, network-partitions]
leads_to: [leader-election]
compare_with: [fencing-tokens, quorums]
---

# Split brain

Split brain is when a cluster breaks into groups that can't talk to each
other, and more than one group carries on as if it were in charge: two
leaders taking writes, or the same service running in two places. The
two sides drift apart, and when the network heals, someone's writes get
thrown away. It's the main thing [[failover]] has to get right.

## How you end up with two leaders

Take a database with a leader, some followers and a watcher that
promotes a follower when the leader stops answering. Then a
[[network-partitions|network partition]] cuts the leader off from
everyone else. The leader is still running, and some clients are on its
side.

From the far side, a leader that's cut off looks exactly like a leader
that crashed: silence. If the cluster simply assumes silent nodes are
dead, it promotes a follower, and now two nodes both believe they lead.
Clients near the old one keep writing to it; everyone else writes to
the new one.

What it costs depends on what's running twice. One IP address brought up
on two hosts makes packets go randomly to either, so the address is
useless. A database is worse: each side takes writes the other never
sees, and the copies diverge or get corrupted. In Redis Sentinel, when
the partition heals the old primary is turned into a replica of the new
one and discards its data, so everything its clients wrote in the
meantime is gone for good.

It isn't rare. A study of 136 partition failures in 25 distributed
systems found leader election involved in 40% of them, and two leaders
at once was the most common election bug.

## Two defenses, and you need both

![Two panels. Left, "Only a majority may elect": five nodes split by a partition into a side with N2, N3 and N4, which has a majority and elects N2, and a side with N1, the old leader, and N5, which has no majority and can't elect anyone. But N1 still thinks it leads. Right, "Fence the old leader": N1 with token 33 and N2 with token 34 both write to storage, which has seen token 34. N2's write is accepted, N1's is rejected. A note says you can also cut N1's power, network or disk access (STONITH).](img/split-brain-majority-and-fencing.svg)

*A majority stops a second election. Fencing stops the leader that was
already there.*

**Only a majority may decide.** Require a majority of a fixed group of
voters, a quorum, before anyone is promoted. Two sides of a partition
can't both hold one, so at most one can run a
[[leader-election|leader election]]. Redis Sentinel won't fail over on
the minority side. The Pacemaker cluster manager, by default, only lets
a side with quorum fence other nodes. See [[quorums]].

This is also why two voters is a trap. After a split each side has
exactly half, which is no majority. If you let either side promote
anyway, clients write to both sides with no end, and when the partition
heals there's no way to tell which configuration is right. The Sentinel
docs refuse to even show a setup with two Sentinels.

A majority rule does nothing about the old leader, which doesn't know
it's been replaced and keeps accepting writes.

**Fence the old leader.** Fencing means making a node unable to act even
when it won't answer the cluster. Its other name is STONITH, "shoot the
other node in the head", because the most common way is to cut its
power. The other way is to cut its access to something it needs, like
the network or a shared disk. A fence has rules of its own:

- It can't depend on the cluster's own network, or the partition that
  caused the trouble also blocks the fence.
- At least one fence can't share power with the node. From outside, a
  node that lost power looks the same as one that lost its network, so
  an on-board controller powered by the same host can't be the only
  fence.
- It can't rely on the target cooperating. Logging in over ssh to shut
  it down is fine for testing, never for production.

A softer kind of fencing moves the check into the thing being written
to. Each new leader or lock holder gets a number that only goes up,
and the storage remembers the highest number it has seen and rejects
anything older.
The old leader can go on running; its writes just bounce. That's
[[fencing-tokens]], and it only works if the storage checks the number
itself.

## Where it gets tricky

**A smart-looking election can pick the wrong side.** The same study
found elections that chose the node with the longest log, the newest
timestamp or the lowest ID. Those rules can crown a node from the
minority side, which then erases the majority's writes.

**Stepping down only bounds the damage.** Sentinel's
`min-replicas-to-write` makes a primary stop taking writes once it can't
reach its replicas. With a 10-second maximum lag, the cut-off primary
stops after 10 seconds. The writes in those 10 seconds are still lost.

**It isn't only the network.** A long [[process-pauses|process pause]]
looks the same as a partition from outside. The paused leader is
replaced, wakes up and writes as if nothing happened. The same two
defenses apply.

**Agreement doesn't save asynchronous writes.** A majority vote, or
full [[consensus]], picks one winner. It doesn't bring back acknowledged
writes that never reached the promoted replica.

## What this means when you build

- Decide in advance what each side of a partition does.
- Use an odd number of voters, three or five, and require a majority
  to promote.
- Fence: power or access control that doesn't depend on the cluster
  network, or tokens that your storage checks on every write.
- Make an isolated leader stop taking writes once it loses contact.
- Test it with real partitions ([[fault-injection]]), not just crashes.

## Further reading

- [Pacemaker Explained, 8. Fencing](https://clusterlabs.org/projects/pacemaker/doc/3.0/Pacemaker_Explained/html/fencing.html), ClusterLabs, Pacemaker 3.0. Split brain and STONITH from the people who build a cluster manager, with the rules a fence device must follow.
- [High availability with Redis Sentinel](https://redis.io/docs/latest/operate/oss_and_stack/management/sentinel/), Redis docs. Majority-only failover, why two Sentinels are never enough, and the writes a cut-off primary loses.
- [An Analysis of Network-Partitioning Failures in Cloud Systems](https://www.usenix.org/system/files/osdi18-alquraan.pdf), Ahmed Alquraan and others, OSDI 2018. How often partitions produce two leaders, and the election rules that make it worse.
- [How to do distributed locking](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html), Martin Kleppmann, 2016. Fencing tokens checked by the storage, the softer kind of fencing.
