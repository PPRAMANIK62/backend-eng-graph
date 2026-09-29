---
id: coordination-services
title: Coordination services
depth: short
phase: 12
note: >-
  ZooKeeper and etcd: a small, consistent store for leases, locks and
  config. What they're for and what they're not.
needs: [raft, leases]
leads_to: [leader-election, distributed-locks, kubernetes]
compare_with: [service-discovery]
---

# Coordination services

A coordination service is a small, strongly consistent database that
other services use to agree on things: who the leader is, who holds a
lock, which servers are alive, what the current config says. ZooKeeper
and etcd are the ones you'll meet; Google's Chubby came before both, and
its paper explains the design best. You run one so that every other service doesn't have to
implement [[consensus]] itself.

## A tiny database that never splits its brain

Under the hood, each is a handful of servers replicating one log with a
consensus protocol: Paxos in Chubby, Zab in ZooKeeper, [[raft]] in
etcd. Every write goes through the leader and counts once a majority
has it. A Chubby cell typically runs five replicas and stays up while
three are running. When the network splits,
the side without a majority stops accepting writes; etcd's docs say
plainly that it gives up availability rather than risk two sides
disagreeing.

The data is small on purpose. ZooKeeper keeps its whole tree in memory,
and caps each node at 1 MB by default. etcd keeps everything in one
Raft group with no sharding, and its own docs put its reliable size at
several gigabytes. That's the price of strict ordering: everything goes
through one log, so it can't spread out across more machines.

## The building blocks

The services differ in their API, but they give you the same few
pieces:

- **Sessions or leases.** A client keeps itself alive by talking to the
  service. Chubby sessions have a [[leases|lease]] extended by
  KeepAlive calls. A ZooKeeper session has a timeout, and the client
  library sends a heartbeat after a third of it has passed in silence.
  etcd grants leases with a TTL.
- **Data that dies with you.** A ZooKeeper *ephemeral* node is deleted
  when the session that created it ends, by choice or by failure. In
  etcd you attach keys to a lease, and they're deleted when it expires
  or is revoked. This is how
  "who's alive" and "who holds the lock" clean up after a crash.
- **A number that only goes up.** ZooKeeper can append a rising counter
  to a node's name (a *sequential* node). etcd gives every change a
  revision from one store-wide counter. These give an order to requests
  and make good [[fencing-tokens]].
- **Watches.** Instead of polling, a client asks to be told when
  something changes. A ZooKeeper watch fires once and only says that
  something changed, not what.
- **Conditional writes.** Write only if a key's version or revision is
  still what you read, a compare-and-set.

From these, clients build the useful things: [[leader-election]],
[[distributed-locks]], group membership, configuration that updates
everywhere at once. ZooKeeper deliberately ships only the pieces and
leaves these "recipes" to clients. Chubby went the other way and offered
locks directly. etcd has lock and election calls built in.

## Why a service and not a library

Google's Chubby paper explains the choice. A consensus library would
make every service run its own quorum and be structured around it. With
a lock service, an existing program adds a lock call and a check, keeps
its structure, and even a single running copy can take a lock and make
progress. The elected leader also needs somewhere to announce itself, so
the lock service stores small files too. Before Chubby, Google's
systems elected primaries with ad hoc schemes or by asking an operator.

## What they're for, and what they're not

They're for small, important, rarely changing facts: the current leader,
membership, config, locks, service addresses ([[service-discovery]]).
Chubby's most popular use turned out to be as a name service.
[[kubernetes|Kubernetes]] stores all its cluster state in etcd.

They're not for bulk data. One Google team rewrote a 1.5 MB file in
Chubby on every user action, until the service added a 256 kB file
limit, and moving that data out took about a year. Using Chubby's event
mechanism as a publish/subscribe system was slow and inefficient too.
etcd's docs point you to a distributed SQL database once you have more
than a few gigabytes.

## Where it gets tricky

**Reads aren't always up to date.** ZooKeeper orders writes through the
leader but answers reads from whichever server you're connected to, and
that server may be behind. Its `sync` call makes the next read catch up
first. etcd offers [[linearizability|linearizable]] reads.

**A lock from a coordination service is still a lease.** The service
can be perfectly consistent and your lock still unsafe, because the
holder can pause or its messages arrive late. That's the whole subject
of [[distributed-locks]].

**Herds.** If a thousand clients watch the same node, one change wakes
all of them at once. ZooKeeper's lock recipe is built so that each client
watches a different node ([[thundering-herd]]).

## What this means when you build

- Use one when several processes must agree on one fact, and keep the
  data in it small.
- Run a small group (Chubby uses five), placed so the nodes
  don't fail together ([[failure-domains]]).
- Use the existing clients and recipes, not your own lock on top of raw
  calls; the timing details are easy to get wrong.
- Pass the revision or sequence number to anything you protect with it.

## Further reading

- [The Chubby lock service for loosely-coupled distributed systems](https://research.google.com/archive/chubby-osdi06.pdf), Mike Burrows, OSDI 2006. Why a lock service instead of a consensus library, sessions and leases, and what people misused it for.
- [ZooKeeper: Wait-free coordination for Internet-scale systems](https://www.usenix.org/legacy/event/atc10/tech/full_papers/Hunt.pdf), Patrick Hunt, Mahadev Konar, Flavio P. Junqueira, Benjamin Reed, USENIX ATC 2010. Znodes, ephemeral and sequential nodes, watches, and its ordering guarantees.
- [etcd versus other key-value stores](https://etcd.io/docs/v3.6/learning/why/), etcd authors, etcd v3.6 docs. What etcd is for, how it compares with ZooKeeper and Consul, and an honest note on its locks.
- [etcd API](https://etcd.io/docs/v3.6/learning/api/), etcd authors, etcd v3.6 docs. Revisions, and how leases are granted, kept alive and tied to keys.
