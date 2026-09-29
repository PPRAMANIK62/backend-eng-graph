---
id: chain-replication
title: Chain replication
depth: short
phase: 12
note: >-
  Writes go down a chain of nodes, reads come from the tail.
needs: [replication, consensus]
leads_to: []
compare_with: [raft]
---

# Chain replication

Chain replication puts the copies of your data in a line. Writes go in
at the head and pass from server to server down to the tail. Reads go
straight to the tail. That layout gives you strong consistency and
cheap reads, and it's an alternative to majority-vote
[[replication]] like [[raft|Raft]] when you want every copy up to date.

## Head orders, tail answers

Take a key-value store with each key on three servers in a chain.

![A chain of three servers: head, middle and tail. A client sends updates to the head; updates flow head to middle to tail, and acknowledgements flow back up. Another client sends queries to the tail, which sends the replies. A master above the chain, itself replicated with consensus, watches the servers, relinks the chain on failure and tells clients where the head and tail are.](img/chain-replication-chain.svg)

*One chain. Adapted from Robbert van Renesse and Fred B. Schneider, "Chain Replication for Supporting High Throughput and Availability", figure 2 (2004).*

1. A client sends `put(k, v)` to the head. The head works out the new
   value and puts the update in order.
2. The head forwards the change to the middle over a reliable, in-order
   link. The middle applies it and forwards it to the tail.
3. The tail applies it. The update is now on every copy, and the tail
   sends the reply.
4. A client that wants `get(k)` asks the tail, and only the tail.

Reads are consistent for a simple reason: the tail only holds updates
every server already has, and it handles every read and every final
write step itself, one at a time. One server sees the whole order, so a
read always sees the latest write (strong consistency, as in
[[linearizability]]), with no vote.

The head computes the new value once and forwards the result, so an
update can even be non-deterministic. And each server's list of updates
is always a prefix of its predecessor's, which keeps repairs simple.

## When a server fails

Chain replication assumes fail-stop servers: a broken server halts
instead of doing wrong things, and the halt can be detected. With t
servers, up to t − 1 can fail and the data survives.

The chain can't fix itself, though. A separate **master** detects
failed servers, relinks the chain and tells clients where the head and
tail now are. In the original design, the master is itself replicated
with Paxos (see [[paxos]] and [[coordination-services]]). The repairs:

- **Head dies.** The next server becomes the head. Updates the old head
  hadn't forwarded are lost, which looks to the client like a dropped
  request, so it retries.
- **Tail dies.** The server before it becomes the tail. It already has
  everything the old tail had, and maybe more.
- **A middle server dies.** Its predecessor links to its successor and
  re-sends anything the successor might have missed. Each server keeps
  a list of updates it sent that the tail hasn't acknowledged yet; the
  tail's acks, passed back up the chain, trim that list.

New servers join at the tail: the current tail copies its state over,
then hands over the tail role.

## Compared with a primary and backups

Chain replication is a kind of
[[leader-follower-replication|primary/backup replication]], with the
primary's job split in two: the head orders updates, the tail orders
reads between them.

- **Reads are cheaper.** A read touches one server and never waits on
  anyone else. A primary has to wait for its backups' acks on earlier
  updates before answering a read.
- **Writes are slower.** Updates travel one hop at a time, so write
  latency is the sum of every hop. A primary sends to all backups in
  parallel, so it waits only for the slowest.
- **Outages are shorter.** Counted in message delays after a failure is
  detected: a head failure blocks updates for 2, a tail failure blocks
  everything for 2, a middle failure blocks nothing. Losing a primary
  costs 5. Detecting the failure takes far longer than any of these,
  and costs the same in both designs.

## Where it gets tricky

**The tail is a hot spot.** Every read of a key lands on one server,
so a popular key makes that tail a [[hot-spots|hot spot]], and in a
multi-datacenter chain the tail may be far away. You can run many
chains with different tails, placed with [[consistent-hashing]], but a
single hot key still sits on one tail. CRAQ (2009) lets any server in
the chain answer reads. Each server keeps versions marked clean or
dirty: an update is dirty until the tail's ack comes back up the
chain. A clean key is served locally. For a dirty key the server asks
the tail which version is committed and returns that. For read-mostly
loads, read throughput then grows with chain length.

**Reading from any server isn't free.** Sending reads to a random copy
in plain chain replication gives up strong consistency: two reads at
different servers can see different writes while an update is still
travelling down. That's closer to [[eventual-consistency]].

**Fail-stop is an assumption.** The chain has no vote, so it can't
decide on its own that a server is dead. Everything rests on the master
getting that right, which is why the master runs on [[consensus]].

## What this means when you build

- Pick it for read-heavy data where every copy must hold every write.
  You pay write latency for it.
- Keep chains short, because write latency grows with every hop.
- Put membership in a consensus-backed service, not in the chain.

## Further reading

- [Chain Replication for Supporting High Throughput and Availability](https://www.cs.cornell.edu/home/rvr/papers/OSDI04.pdf), Robbert van Renesse and Fred B. Schneider, 2004. The original protocol, its failure handling, and the comparison with primary/backup.
- [Object Storage on CRAQ](https://www.usenix.org/legacy/event/usenix09/tech/full_papers/terrace/terrace.pdf), Jeff Terrace and Michael J. Freedman, 2009. Why the tail becomes a bottleneck and how clean and dirty versions let every server answer reads.
