---
id: consistent-hashing
title: Consistent hashing
depth: deep
phase: 11
note: >-
  Placing keys on a ring so adding a node moves only a few keys.
needs: [partitioning]
leads_to: []
compare_with: [load-balancing-algorithms, rebalancing]
---

# Consistent hashing

Consistent hashing is a way to decide which server owns a key so that
when a server joins or leaves, only a fair share of the keys move,
instead of almost all of them, and they all move to or from the server
that changed. Caches, Dynamo-style databases and load balancers use it
to [[partitioning|partition]] keys over servers without a central
lookup table.

## Why `hash mod N` breaks

The obvious way to spread keys over servers is `hash(key) mod N`. It
spreads keys evenly and needs no state. The trouble starts when N
changes.

Try it with keys whose hashes are 0 to 11, going from 3 servers to 4.
Only the keys with hash 0, 1 and 2 keep their server. The other nine
move, though moving three would be enough to give the new server its
share. At scale it's the same story: going from 10 shards to 12 with
`mod` reshuffles nearly everything, when moving a sixth of the data
would do.

For a database, that means copying almost all the data to add one
machine. For a cache, it's worse in a different way: after the change,
nearly every key is looked up on a server that doesn't have it, so the
whole cache misses at once and the load falls on whatever is behind it.
That cache problem is where consistent hashing came from, in a 1997 MIT
paper about web servers swamped by too many clients at once (see
[[hot-spots]]).

## The ring

Take the range of the hash function and bend it into a circle, so the
largest value wraps around to the smallest. Then:

1. Hash each server's name to a point on the circle.
2. Hash each key to a point on the circle.
3. Walk clockwise from the key to the first server. That server owns
   the key.

Each server owns the arc between the server before it and itself.

![Two rings side by side. Left, titled three servers: servers A, B and C sit on a circle with six keys between them, and an arrow shows the clockwise direction. Right, titled add server D: server D is placed on the ring between A and B, the two keys on the arc between A and D are highlighted, and a label says D takes these two keys from B. A note says each key belongs to the first server clockwise from it, and no key moves between A, B and C.](img/consistent-hashing-ring.svg)

*Adding a server only takes keys from its clockwise neighbour.*

Now add server D. It lands somewhere on the circle, inside the arc that
B owned. The keys between A and D now reach D first, so they move from
B to D. Every other key still reaches the same server as before.
Removing a server is the reverse: its keys pass to the next server
clockwise. Keys only ever move to a new server or off a removed one,
never between two servers that stayed. That property is called
monotonicity.

The original paper described it a little differently: servers and keys
are points on an interval, and a key goes to the closest server point.
It was designed for web clients that each know a slightly different
list of caches, and it guarantees they still mostly agree on where a
page lives. In a database every node shares one membership list, so
that part matters less.

## One point per server is lumpy

With one random point per server, the arcs come out very uneven. Some
servers get a long arc and many keys, others a short one. With n
servers, the busiest one is likely to hold on the order of log n times
the average. Machines also differ in size, and one point each treats a
big machine like a small one.

The fix is to give each server many points, called virtual nodes or
tokens. The keys a server owns are then the sum of many small arcs,
which evens out. Virtual nodes help in three more ways:

- When a server fails, its many small arcs pass to many different
  neighbours, so its load spreads out instead of landing on one server.
- A new server takes a little from many others instead of a lot from
  one.
- A bigger machine can take more points than a smaller one.

It takes more points than you'd guess. In Google's measurements of the
ring, 10 points per server left about 1% of servers with less than 0.37
times or more than 1.98 times the average share of keys. Even at 1000
points per server, about 1% of servers were 8% or more away from the
average. And every client needs the whole table of points: 1000
servers at 1000 points each took 46 MB as a C++ map, or 7.6 MB as a
packed sorted array.

## Replicas keep walking

To store each key on several machines for [[replication]], keep walking
clockwise past the owner and put copies on the next servers you meet.
Dynamo stores a key on its owner and the next N-1 servers around the
ring.

With virtual nodes, the next few points might belong to the same
physical machine, and two copies on one machine is no copy at all. So
the walk skips points of machines already in the list until it has N
distinct machines. Dynamo calls that list a key's preference list, and
Cassandra walks the ring the same way.

## Other hashes with the same promise

The ring isn't the only way to get "few keys move".

**Jump consistent hash** (Google, 2014) is about five lines of code that take
a 64-bit key and a number of buckets and return a bucket. It needs no
memory at all, splits keys almost perfectly evenly, and takes fewer
than ln(n) + 1 loop steps on average. When a bucket is added, it takes an equal
slice from every existing bucket, where a new server on the ring only
takes from the servers next to its points. The catch is that buckets
are numbered 0 to n-1, so you can only add or remove the last one. That
suits database shards, which are kept alive by replicas and change only
when you change capacity. It doesn't suit a cache pool where any server
can die.

**Rendezvous hashing**, also called highest random weight, hashes the
key together with each server's name and picks the server with the
highest result. Servers can have any names and leave in any order, but
every lookup costs one hash per server.

**Bounded loads** (2016) gives every server a cap of (1 + ε)
times the average load. A key that lands on a full server keeps walking
the ring to the next one with room. The number of keys that move per
change doesn't grow with the size of the system, and ε is the knob: a
small ε keeps load even but moves more keys, a large one moves fewer.
Google used it in Cloud Pub/Sub. Vimeo added it to HAProxy for its
video streaming, settled on c = 1.25 (ε = 0.25), and cut cache
bandwidth by a factor of almost 8.

Load balancers use variants of their own, covered in
[[load-balancing-algorithms]].

## Where it gets tricky

**"Consistent" has nothing to do with consistency.** The name means the
mapping stays mostly the same as servers change. It says nothing about
whether replicas agree, which is [[consistency-models]].

**Even keys aren't even load.** Consistent hashing spreads keys, not
requests. A key that gets most of the traffic stays on one server
whatever the hash does, and so do its replicas. That's
[[hot-spots]].

**More virtual nodes isn't free.** In Cassandra, each token can add up
to 2 × (RF − 1) neighbours on the ring, where RF is the number of
copies. More neighbours means more combinations of failed nodes that
take part of the ring offline, and more separate repair jobs to run.
Cassandra 2.x chose tokens at random and needed 256 per node to stay
balanced. From 3.x a deterministic allocator picks tokens so the ring
stays balanced with far fewer.

**Everyone has to agree on the list of servers.** Two clients with
different server lists can send the same key to different servers.
Storage systems spread the list by gossip and change it on purpose:
Dynamo adds and removes nodes only by an explicit admin command,
because an outage rarely means a node is gone for good, and a temporary
failure shouldn't move data.

**Few moves and even load pull against each other.** Dynamo started
with random tokens on a ring and ended up with a fixed number of equal
partitions, using the ring only to decide which node holds which
partition. Its random-token designs balanced worse and made adding a
node slow. That story is in [[rebalancing]].

## What this means when you build

- Never place keys with `mod N` if N can change and moving keys is
  costly.
- For a cache tier or sticky routing where servers come and go, use a
  ring with many virtual nodes, or rendezvous hashing for a small number
  of servers.
- For database shards, prefer many fixed partitions and move whole
  partitions between machines; use jump hash if shards are numbered.
- If no server may ever be overloaded, use bounded loads.
- Check the spread with your real keys and your real server count.

## Further reading

- [Consistent Hashing and Random Trees](https://www.cs.princeton.edu/courses/archive/fall09/cos518/papers/chash.pdf), Karger et al., MIT, STOC 1997. The original: why `mod p` fails for caches, the properties a consistent hash should have, and the first construction.
- [Dynamo: Amazon's Highly Available Key-value Store](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf), DeCandia et al., Amazon, SOSP 2007. The ring in production: virtual nodes, preference lists, explicit membership, and the move to fixed partitions.
- [Dynamo (Apache Cassandra architecture docs)](https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html), Apache Cassandra. `mod` vs a token ring, vnodes, and what too many tokens cost.
- [A Fast, Minimal Memory, Consistent Hash Algorithm](https://arxiv.org/pdf/1406.2294), Lamping and Veach, Google, 2014. Jump consistent hash, and measurements of how uneven and memory-hungry the ring is.
- [Consistent Hashing with Bounded Loads](https://arxiv.org/pdf/1608.01350), Mirrokni, Thorup and Zadimoghaddam, 2016. Why plain consistent hashing overloads servers, and a capped version with bounded movement.
- [Consistent Hashing with Bounded Loads (Google Research blog)](https://research.google/blog/consistent-hashing-with-bounded-loads/), Mirrokni and Zadimoghaddam, Google, 2017. The same algorithm in plain words, with a worked example and the Vimeo result.
