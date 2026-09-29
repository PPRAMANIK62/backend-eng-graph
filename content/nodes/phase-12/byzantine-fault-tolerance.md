---
id: byzantine-fault-tolerance
title: Byzantine fault tolerance
depth: short
phase: 12
note: >-
  Consensus when some nodes lie, and why most backends don't need it.
needs: [consensus]
leads_to: []
compare_with: [failure-models]
---

# Byzantine fault tolerance

Most [[consensus]] algorithms, [[paxos|Paxos]] and [[raft|Raft]]
included, assume a broken server stops. It may crash, go quiet or come
back later, but it never lies. Byzantine fault tolerance (BFT) drops
that assumption: some servers may keep running and send wrong,
conflicting or malicious messages, and the honest ones must still
agree. It costs more servers, more messages and a lot more design, and
most backends running inside one company don't need it.

## Servers that lie

In the [[failure-models|failure model]] a Byzantine node can do
anything at all, including the worst thing for your algorithm. The
name comes from a 1982 story: generals of an army camped around a city
must agree to attack or retreat, talking only through messengers, and
some generals are traitors. A traitor can tell one general "attack" and
another "retreat", and the loyal ones must still end up with the same
plan.

The result was that with plain, unsigned messages, the problem can be
solved only if more than two-thirds of the generals are loyal. To
tolerate f traitors you need at least 3f + 1 generals: 4 for one
traitor, 7 for two. Three generals with one traitor can't do it. With
unforgeable signatures, so nobody can fake what someone else said, the
paper solves it for any number of traitors, though it stays hard in
practice.

## Why 3f + 1

Say you have n replicas on an ordinary network and up to f may be
faulty.

1. A faulty replica can stay silent, so you must be able to move on
   after hearing from n − f.
2. The f you didn't hear from might just be slow, not faulty. So up to
   f of the n − f answers you did get could come from liars.
3. Honest answers must still outnumber lying ones: n − 2f > f.

So n must be at least 3f + 1. Adding more replicas than that makes
messages bigger and more numerous without tolerating any more faults.
Compare a crash-only algorithm, which only needs a majority of servers
alive (see [[quorums]]).

## PBFT, one request

Practical Byzantine Fault Tolerance (PBFT, 1999) was the first BFT
[[replicated-state-machine|state machine replication]] protocol that
was safe on an asynchronous network and fast enough to use. Replicas
move through numbered views, and in each view one replica is the
primary.

![Timeline of one PBFT request with a client and four replicas, replica 0 the primary and replica 3 faulty and silent. The client sends a request to replica 0. In pre-prepare, replica 0 sends it to replicas 1, 2 and 3. In prepare, replicas 1 and 2 each send to all other replicas. In commit, replicas 0, 1 and 2 each send to all others. In reply, replicas 0, 1 and 2 answer the client, which accepts a result once two replies match.](img/byzantine-fault-tolerance-pbft.svg)

*Normal case with four replicas and one faulty. Adapted from Miguel Castro and Barbara Liskov, "Practical Byzantine Fault Tolerance", figure 1 (1999).*

- **Pre-prepare.** The primary gives the request a sequence number and
  sends it to the backups.
- **Prepare.** Each backup tells every other replica what it received.
  This is what catches a lying primary: if it gave different replicas
  different requests for the same number, they notice.
- **Commit.** Replicas tell each other they're prepared, so that the
  order holds even if the view changes later.
- **Reply.** Each replica runs the request and answers the client
  directly. The client waits for f + 1 matching replies, since at most
  f can be wrong.

If the primary stalls or misbehaves, the replicas suspect it and move
to the next view with a new primary. Normal messages are authenticated
with [[hmac|MACs]]; slower [[public-key-crypto|signatures]] are only
used when something goes wrong. Safety never depends on timing, but
progress does, since [[flp-impossibility|FLP]] rules out guaranteed
progress in a fully asynchronous system. In the 1999 paper, a BFT file
server built on PBFT was only 3% slower than a standard unreplicated
NFS server on the Andrew benchmark.

## Why most backends don't need it

**The same bug is on every replica.** A software bug can make a node
behave arbitrarily, which counts as Byzantine. But if every replica
runs the same code, they all have the bug, and a guarantee that holds
while fewer than a third are faulty doesn't help. Truly independent
failures need different implementations of the service and operating
system, different root passwords and different administrators. That's
rarely practical, so "Byzantine" usually means someone deliberately
breaking the protocol, not bugs.

**Your servers already trust each other.** Inside one company's
datacenter, one service can usually trust the others run by the same
company. The untrusted parties are at the edges, customers and other
companies, and you deal with them by authenticating and checking what
they send, not by running consensus with them.

**It's expensive.** BFT consensus algorithms are much more complicated
and less efficient than crash-fault ones. Crash-recovery algorithms are
the practical choice for datacenters on trusted private networks.

**It doesn't keep secrets.** A faulty replica can still leak its data.

BFT does show up where participants don't trust each other at all,
most visibly in blockchains and cryptocurrencies.

## What this means when you build

- Use crash-fault consensus (Raft, Paxos) inside your own systems, and
  put authentication and validation at the boundaries where untrusted
  input comes in.
- If you really need to survive a compromised replica, budget 3f + 1
  replicas and independent implementations and operators, or the
  guarantee is mostly on paper.

## Further reading

- [The Byzantine Generals Problem](https://lamport.azurewebsites.net/pubs/byz.pdf), Leslie Lamport, Robert Shostak, Marshall Pease, 1982. The paper that named the problem, and the two-thirds result.
- [Practical Byzantine Fault Tolerance](https://pdos.csail.mit.edu/6.824/papers/castro-practicalbft.pdf), Miguel Castro and Barbara Liskov, 1999. PBFT's three phases, the 3f + 1 argument, and what independent failures really require.
- [Distributed Systems: lecture notes](https://www.cl.cam.ac.uk/teaching/2122/ConcDisSys/dist-sys-notes.pdf), Martin Kleppmann, University of Cambridge, 2021/22. Where Byzantine faults sit among failure models, and why trusted datacenters use crash-fault algorithms.
