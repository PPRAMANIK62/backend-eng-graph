---
id: leader-election
title: Leader election
depth: short
phase: 12
note: >-
  Picking one node to be in charge, usually with a lease in etcd or
  ZooKeeper, and fencing so an old leader can't act.
needs: [coordination-services, fencing-tokens, split-brain]
leads_to: []
compare_with: [raft-elections, distributed-locks, job-scheduling, idempotency, control-loops]
---

# Leader election

Leader election picks one process out of several to do a job that only
one should do at a time: run the scheduler, own a shard, write to the
database, hand out work. You rarely build it from scratch. The usual
way is a [[leases|lease]] held in a [[coordination-services|coordination
service]], renewed while the leader is healthy and taken over when it
isn't. The hard part is the old leader, which may not know it has been
replaced, and that's where [[fencing-tokens]] come in.

## Why have a leader at all

One leader puts all the concurrency of a job in one place. It can
decide and tell others instead of agreeing with them on every step, and
its code doesn't have to worry about someone else touching the same
state.

The costs: the leader is a single point of failure, of scaling, and of
trust. Amazon's answer is often to shard, so each piece of data has
one leader but the system has many. And its engineers look for ways to
avoid a leader first, with [[idempotency|idempotent]] APIs and
[[optimistic-concurrency|optimistic locking]].

## A lease in a shared store

The most common recipe is simple. A consistent store holds one record:
who the leader is. The leader renews its claim on a schedule. If the
renewals stop for long enough, another candidate takes the record over.

Kubernetes controllers do exactly this with client-go's
`leaderelection` package, storing the record in a Kubernetes API
object. Its defaults show the moving parts:

- **LeaseDuration, 15 seconds.** A candidate must see the record go
  unchanged for this long before it tries to take over.
- **RenewDeadline, 10 seconds.** How long the current leader keeps
  retrying its renewal before it gives up leadership.
- **RetryPeriod, 2 seconds.** How long everyone waits between attempts.

The package trusts only each process's own clock, and only watches
whether the record changes. That makes it immune to clocks set to
different times, but not to clocks running at different speeds. The
ratio of LeaseDuration to RenewDeadline is how much speed difference it
tolerates: 60 and 30 seconds would survive one clock running twice as
fast as another ([[clock-skew]]).

## The ZooKeeper recipe

ZooKeeper builds election out of its two special kinds of node. Each
candidate creates a node under `/election` that is both *sequential*
(ZooKeeper appends a number bigger than any before it) and *ephemeral*
(deleted when the candidate's session dies). The candidate with the
smallest number is the leader.

![Four candidate nodes under /election, numbered 0001 to 0004. Node 0001 belongs to the leader. Node 0002 watches 0001, 0003 watches 0002, and 0004 watches 0003. When the leader's session dies, 0001 disappears and only the candidate holding 0002 is notified; it checks that it now has the smallest number and becomes leader.](img/leader-election-znode-chain.svg)

*Each candidate watches only the node just before it, so a leader's death wakes one process, not all of them. Adapted from the Apache ZooKeeper docs, "ZooKeeper Recipes and Solutions".*

If the leader dies, its node vanishes with its session. The naive
version has every candidate watch the leader's node, so one death wakes
everybody at once and they all hit ZooKeeper together, a herd. The
recipe avoids it by having each candidate watch only the node just
below its own.

One subtlety: having the smallest node doesn't mean the process
*knows* it's leader yet. If others need to know it has taken charge, it
has to say so, for example by writing another node.

## Zero leaders, or two

A leader can't be sure it's still the leader. It can be paused by
garbage collection ([[process-pauses]]) or cut off by a
[[network-partitions|partition]] while the others time it out and elect
someone new. For a while, two processes think they're in charge. During
failures there can be zero leaders, or two.

client-go says the same about itself: it does not guarantee that only
one client acts as leader, because it doesn't fence. Its
`ReleaseOnCancel` option makes it worse if misused: release the lease
before the guarded work has finished, and two processes can be in the
critical section together.

So a correct system plans for [[split-brain|two leaders]]:

- **Fence.** Pass a number that rises with each new leader to whatever
  the leader writes to, and have it reject older numbers
  ([[fencing-tokens]]).
- **Check before acting.** Look at the remaining lease time right
  before anything with side effects outside the leader. Slow networks,
  retries and pauses eat lease time faster than code expects.
- **Make work safe to redo.** A new leader can't know what the old one
  half-finished. If the work is idempotent, it can just do it again.

## Where it gets tricky

**Don't renew from a background thread.** The thread renewing the lease
proves only that it is alive. If the worker thread stalls or dies while
the renewer keeps going, the lease is held by a process doing nothing.
If the renewer dies and can't stop the worker, the worker carries on
after the lease is gone.

**Not the same as a Raft election.** [[raft-elections]] pick a leader
inside the consensus group itself, as part of the protocol. Here, your
service borrows consensus from a coordination service, and nothing
stops your old leader from acting unless you add fencing.

**Election is a long-held lock.** It's the same mechanism as a
[[distributed-locks|distributed lock]], and fails the same way.

## What this means when you build

- Use an existing, tested client rather than writing your own.
- Keep lease durations short enough that a dead leader is replaced
  quickly, and long enough that clock rate differences and API latency
  don't cause needless handovers.
- Assume there will sometimes be two leaders. Fence writes, check the
  lease before side effects, and make the leader's work idempotent.
- Log every change of leader.

## Further reading

- [Leader election in distributed systems](https://aws.amazon.com/builders-library/leader-election-in-distributed-systems/), Marc Brooker, Amazon Builders' Library. Why and when to use a leader, leases as Amazon's default, and the practical rules for surviving two leaders.
- [ZooKeeper Recipes and Solutions](https://zookeeper.apache.org/doc/current/recipes.html), Apache ZooKeeper 3.9 docs. The leader election and lock recipes built from sequential, ephemeral nodes.
- [Package leaderelection](https://pkg.go.dev/k8s.io/client-go/tools/leaderelection), Kubernetes authors, client-go v0.37.1. A real lease-based election, its defaults, and its honest note that it doesn't fence.
