---
id: distributed-system
title: Distributed systems
depth: deep
phase: 11
note: >-
  Many machines acting as one, and the three new problems: partial
  failure, an unreliable network, no shared clock.
needs: [network-latency]
leads_to: [fallacies-of-distributed-computing, failure-models, network-partitions, process-pauses, replication, partitioning, clock-skew, failure-detection, monolith-vs-microservices]
compare_with: []
---

# Distributed systems

A distributed system is several computers working on one job, with nothing
between them but a network. You build one because a single machine can't
hold the data, can't serve users on the other side of the world quickly,
or can't stay up on its own. The price is three problems a single machine
never had: parts fail while the rest keep running, messages get lost or
delayed without anyone knowing, and there's no common notion of time.

## One function call, many outcomes

Start with a shop that charges a card. On one machine, `charge(card, 3.99)`
either returns or your process dies with it. Nothing in between.

Now put the payment code on another machine. The call becomes a request
message and a reply message, and a round trip always goes through the same
steps: the client puts the request on the network, the network delivers it,
the server checks it, the server changes its state, the server puts a reply
on the network, the network delivers it, the client checks it, the client
changes its own state. Each of those eight steps can fail on its own,
because the client, the network and the server no longer share a fate.

The worst case is silence. The client waits, hears nothing, and gives up
after a [[timeouts|timeout]]. What happened?

![Four small sequence diagrams between a client and a server, each ending in a client timeout. Request lost: the charge message never arrives. Server crashed: the message arrives and the server crashes before doing the work. Reply lost: the server charges the card and its "ok" reply is lost. Server paused: the server charges the card, pauses for garbage collection, and its reply arrives after the client has given up.](img/distributed-system-unknown-outcome.svg)

*Four different failures, one symptom. Only in the last two was the card charged.*

From where the client sits, all four look the same. The outcome is
unknown: the charge may or may not have happened. If the client retries, it
may charge twice. If it doesn't, it may never charge at all. The one case
the client can be sure of is a refused connection, because then the request
never reached the server.

This is why [[idempotency]] and [[retries-with-backoff|retries]] get so much attention in backend
work. They exist to make the unknown case safe.

## Problem one: partial failure

On a single computer, faults mostly share fate. If the CPU overheats or the
kernel panics, everything stops together, so there's nothing left to handle
the error and no point writing code for it.

In a distributed system, one node can crash while the others keep going.
That's a **partial failure**. It's the good news, since the rest can keep
serving users, and the bad news, since the rest now have to notice, decide
what to do, and do it without the node that's gone. Leslie Lamport put the
dark side in an email at DEC in 1987:

> A distributed system is one in which the failure of a computer you didn't
> even know existed can render your own computer unusable.

It helps to separate two words. A **fault** is one part not working: a
crashed node, a dropped link. A **failure** is the whole system not
working for its users. **Fault tolerance** means turning faults into
something short of failure, up to some limit. No design survives every node
crashing forever.

## Problem two: an unreliable network you can't see into

Every message takes time to cross the network, its
[[network-latency|latency]], and that time isn't fixed. The network can also
lose messages, delay them far past the usual, duplicate them and deliver
them out of order. Sometimes a set of nodes can't reach another set
at all for a while, which is a [[network-partitions|network partition]].
None of this is rare. A study of Microsoft's datacenters counted on average
5.2 network devices and 40.8 links failing per day, with a median repair
time of about five minutes, and found that redundant links improved median
traffic during failures by only 43%. The assumption that the network just
works is the first of the
[[fallacies-of-distributed-computing|fallacies of distributed computing]].

[[tcp|TCP]] hides some of this. It resends lost packets and drops
duplicates, so a stream looks reliable. But it can't make a dead peer
answer, and it gives up after a while. And the problem sits above TCP
anyway: the request and the reply are separate messages, and either can be
the one that doesn't make it.

The deeper issue is that one node can only learn about another through
messages. The classic thought experiment is the two generals: two armies
must attack together, and their messengers can be captured. Each
acknowledgment needs its own acknowledgment, and it has been proved that no
finite number of messages makes both sides certain. In practice, a node
that stops hearing from another can't tell whether the other crashed, is
slow, or whether the messages were lost either way. That's why
[[failure-detection|failure detection]] is a guess, based on a timeout,
and why a guess can be wrong.

## Problem three: no shared clock, and no bound on time

Every machine has its own quartz clock, and quartz drifts. Most computer
clocks are within about 50 parts per million, and 1 ppm is about 86 ms a
day, so two machines that agreed this morning won't agree tonight unless
something keeps correcting them. That's [[clock-skew]], and it's why you
can't order events on different machines by their timestamps.

Worse than wrong clocks is unbounded time. Algorithms lean on time all
over: timeouts, retry timers, failure detectors, cache expiry. They
work if messages arrive and code runs within some known bound. Real systems
break that bound now and then. Packets have sat in a single datacenter's
network for over a minute. A process can freeze for a long
[[garbage-collection|garbage collection]] pause, a burst of
[[page-faults]], or a busy scheduler, then carry on as if nothing
happened. Those are [[process-pauses]], and to the other nodes a paused
process looks exactly like a dead one, until it wakes up and acts on stale
beliefs.

## Writing down what can go wrong

Because you can't handle "anything", distributed algorithms state their
assumptions up front, as a system model. It has three parts:

- **The network:** do messages always arrive eventually, or can they be
  lost, or can an attacker change them?
- **The nodes:** do they crash and stay down, crash and come back with
  their disk intact, or misbehave in arbitrary ways?
- **Timing:** is there a known bound on delay and processing speed, a bound
  that holds most of the time, or none at all?

Those choices are the [[failure-models]]. They matter because an algorithm
is only correct under its model. A protocol that assumes bounded delay can
fail badly the first time a pause or a partition breaks that assumption,
even briefly. So most practical algorithms assume timing that is usually
well behaved but sometimes isn't, and that assumption is rarely safe to
drop.

## Where it gets tricky

**Distribution can make you more reliable or less.** Spread over three
nodes, a service can keep running while one reboots, which is how rolling
upgrades work. But every dependency is another way to fail, and Lamport's
line is about exactly that: your program stops because of a machine you
never chose to rely on.

**Bugs hide for a long time.** The failures come from rare combinations:
a timeout during one step, then a retry, then a slow node. Code with such a
bug can run in production for months before the combination happens. And
because distributed bugs travel over the network, they spread. In one
amazon.com outage, a single catalog server with a full disk started
returning empty replies very quickly. The load balancer saw a fast server
and sent it more and more traffic, and the site went down.

**Testing multiplies.** If every remote call can end five ways (success,
a failure to send, a retryable failure, a fatal failure, or unknown), every
scenario you'd test on one machine turns into several. In one worked example, ten single-machine
scenarios became two hundred. This is why [[fault-injection]] exists:
you can't reason your way through all the combinations, so you make the
faults happen and watch.

**"Distributed" covers very different problems.** A batch job spread over
a cluster gets most of the benefits and few of the headaches, because
nobody is waiting on each answer. A request/reply service, where a user is waiting
for the answer, is the hard kind. Most of this phase is about the hard kind.

**Some networks really are reliable, at a price.** Engineers at some
financial firms report almost never seeing partitions, after spending a lot
on their networks. Most teams, running on commodity hardware or someone
else's cloud, can't buy their way out.

## What this means when you build

- Treat every remote call as having three outcomes: success, failure, and
  unknown. Decide what your code does for unknown.
- Make operations safe to retry, with idempotency, because retrying is
  the only way to get through unknown.
- Put a timeout on every network call, and remember a timeout means "I
  stopped waiting", not "it didn't happen".
- Don't order events across machines by wall-clock time.
- Write down what your design assumes can fail. If a partition or a long
  pause breaks it, find out on purpose, before production does.
- When you split data across machines, you'll need [[replication]] and
  [[partitioning]]. Both are built on the problems above.

## Further reading

- [Distributed Systems lecture notes](https://www.cl.cam.ac.uk/teaching/2122/ConcDisSys/dist-sys-notes.pdf), Martin Kleppmann, University of Cambridge, 2021. The clearest short introduction: why distribute, RPC, the two generals, system models, faults and failure detectors, and clock drift.
- [Challenges with distributed systems](https://aws.amazon.com/builders-library/challenges-with-distributed-systems/), Jacob Gabrielson, Amazon Builders' Library. The eight steps of a request/reply, the UNKNOWN outcome, why testing explodes, and how distributed bugs hide and spread.
- [distribution (email)](https://lamport.azurewebsites.net/pubs/distributed-system.txt), Leslie Lamport, 1987. The original of the famous definition, in context.
- [The network is reliable](https://aphyr.com/posts/288-the-network-is-reliable), Kyle Kingsbury and Peter Bailis, 2013. A catalogue of real network failures and what they did to real systems.
