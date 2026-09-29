---
id: consumer-groups
title: Consumer groups
depth: short
phase: 10
note: >-
  Splitting a topic's partitions among consumers, and rebalancing when
  one joins or leaves.
needs: [kafka-architecture]
leads_to: [offsets-and-commits, share-groups]
compare_with: [rebalancing]
---

# Consumer groups

A consumer group is a set of processes that share the work of reading
a topic. Kafka gives each partition to exactly one member of the group,
and moves partitions around when a member joins, leaves or dies. It's
how you scale a consumer out, and the moving part (the rebalance) is
where pauses and duplicate messages come from.

## Four partitions, two groups

Say an `orders` topic has four partitions (see
[[kafka-architecture]]). Two services read it: billing and search.

Billing runs two processes, both started with `group.id=billing`.
Kafka splits the partitions between them, two each. Every order goes
to exactly one billing process. That's queue behaviour: the members of
a group compete for the work.

Search runs five processes with `group.id=search`. Search gets every
order too, because each group reads the topic on its own. A group acts
as one logical subscriber, however many processes it has, and adding
groups doesn't copy any data. One group per process would give you
[[pub-sub]] instead.

![A topic with four partitions, P0 to P3. On the left, group "billing" has two consumers; consumer 1 reads P0 and P1, consumer 2 reads P2 and P3. On the right, group "search" has five consumers; four of them read one partition each, and the fifth has no partition and sits idle.](img/consumer-groups-assignment.svg)

*Each group gets every partition; inside a group, each partition has one reader. A fifth consumer on four partitions has nothing to do.*

Search's fifth process gets nothing. With one reader per partition,
the partition count is the ceiling on how many members of a group can
do useful work. That same rule is what keeps order within a partition
(see [[message-ordering]]): only one process reads it at a time.

## Noticing that a member is gone

Each consumer sends heartbeats to a broker acting as the group
coordinator. Two timers decide when it's thrown out:

- **`session.timeout.ms`** (45 seconds by default in Kafka 4.3, classic
  protocol). No heartbeat for that long and the member is declared
  dead.
- **`max.poll.interval.ms`** (5 minutes by default). A consumer can
  keep heartbeating while stuck in your processing code. If it doesn't
  call `poll` within this interval, it leaves the group on purpose.

When a member is removed, its partitions go to others. If the old
member later tries to commit its position, the commit fails: only
current members may commit. That matters for the next node,
[[offsets-and-commits]]. As with any
[[failure-detection|failure detector]], slow and dead look the same.

## The rebalance, and why it used to stop everything

Handing out partitions again is a rebalance. It also happens when
partitions are added to a topic.

In the classic protocol, the coordinator doesn't compute the
assignment itself. It collects every member's subscription, picks one
member as the group leader, and the leader works out who gets what.
The members never talk to each other; everything goes through the
coordinator. The one rule is that no partition may belong to two
members at once.

The first way to keep that rule was **eager** rebalancing: every
member gives up all its partitions before rejoining. That's safe, and
it means no member of the group can do any work until the rebalance
ends, even members whose partitions end up right back where they
were. It also takes longer the more partitions there are.

**Cooperative** rebalancing (Kafka 2.4) keeps the barrier but moves it.
Members keep their partitions while the new assignment is worked out.
Only a partition that changes owner is given up, and a second rebalance
hands it to its new owner. For this to help, the assignor must be
sticky, returning partitions to their old owners; otherwise every
partition moves and you're back to eager with extra rounds. In Kafka
4.3 the default assignor is still range; the cooperative sticky one is
a rolling restart away.

## Where it gets tricky

**Deploys cause rebalances.** A restarting process leaves the group
and comes back, and each time the partitions get handed out again.
Setting `group.instance.id` makes a member static: only one instance
with that id can be in the group, and combined with a longer session
timeout, a quick restart doesn't trigger a rebalance at all.

**Slow processing looks like death.** A batch that takes longer than
`max.poll.interval.ms` gets the consumer kicked out, its partitions
moved, and its work redone by someone else. A long
[[process-pauses|pause]], like a [[garbage-collection|GC]] stop, does
the same.

**The protocol changed in Kafka 4.0.** KIP-848 replaced the classic
protocol with one where the coordinator computes a target assignment
on the broker and pushes it through heartbeats. Each member moves
toward its target on its own, and a member whose partitions don't
change isn't disturbed. The old design needed thick clients and a
group-wide barrier, so one bad member could disturb the whole group,
and even cooperative mode couldn't commit offsets mid-rebalance. It's
GA in 4.0, but a consumer uses it only with `group.protocol=consumer`;
the client default in 4.3 is still `classic`.

**Rebalances duplicate work.** The new protocol keeps the old
guarantee: at least once in the worst case, exactly once only when a
partition is handed over cleanly. Use a rebalance listener to commit
your position when partitions are taken away.

Moving partitions between consumers is not the same as moving data
partitions between database nodes; that's [[rebalancing]].

## What this means when you build

- Pick the partition count with the largest group you'll need in mind.
  Extra consumers beyond it sit idle.
- Keep each poll's work well under `max.poll.interval.ms`, or lower
  `max.poll.records`.
- Use static membership for services that restart often.
- Commit on revoke, and make your processing safe to repeat.

## Further reading

- [KafkaConsumer](https://kafka.apache.org/43/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html), Apache Kafka 4.3 Javadoc. The clearest official account of groups, failure detection and rebalance listeners.
- [Consumer Configs](https://kafka.apache.org/43/configuration/consumer-configs/), Apache Kafka 4.3 docs. Defaults for the timeouts, assignors, static membership and the group protocol switch.
- [From Eager to Smarter in Apache Kafka Consumer Rebalances](https://www.confluent.io/blog/cooperative-rebalancing-in-kafka-streams-consumer-ksqldb/), Sophie Blee-Goldman, Confluent, 2020. The classic protocol step by step, and why eager stops the world and cooperative doesn't.
- [KIP-848: The Next Generation of the Consumer Rebalance Protocol](https://cwiki.apache.org/confluence/display/KAFKA/KIP-848%3A+The+Next+Generation+of+the+Consumer+Rebalance+Protocol), David Jacot, Guozhang Wang, Jason Gustafson, Apache Kafka. What was wrong with the classic protocol and how the broker-driven one works.
