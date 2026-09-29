---
id: gossip-protocols
title: Gossip protocols
depth: short
phase: 12
note: >-
  Spreading state and membership by random peer-to-peer chatter. SWIM.
needs: [failure-detection]
leads_to: []
compare_with: [anti-entropy]
---

# Gossip protocols

In a gossip protocol, each node every so often picks a few other nodes
at random and tells them what it knows. News spreads the way a rumor
does, and reaches the whole cluster in a number of rounds that grows
only with the logarithm of the cluster size. With no central server to
overload or lose, it's a common way for large clusters to track
who's a member and who has died.

## How a rumor spreads

Say one node in a cluster of a thousand learns that a node joined. How
does everyone else find out? Sending it to everyone directly is fast
but not reliable: the sender may not know every node, and messages get
lost. The Xerox PARC team that studied this in 1987, for
replicated name servers, compared it with two random alternatives:

- **Anti-entropy.** Every so often, each node picks a random other node
  and they compare their whole state and fix any differences. Very
  reliable, but comparing everything is expensive, so it can't run
  often. It's the ancestor of the background repair in
  [[anti-entropy|Dynamo-style stores]].
- **Rumor mongering.** A node with fresh news treats it as a "hot
  rumor" and keeps passing it to random nodes. Once it keeps hitting
  nodes that already know, it stops. Cheap enough to run often, but
  there's a small chance some node never hears.

Both behave like epidemics, and epidemic theory gives the key result:
starting from one node, news reaches everyone in expected time
proportional to the log of the number of nodes. Doubling the cluster
adds a round or two, not double the rounds. How you exchange matters
at the tail, too. When only a few nodes still haven't heard, *pulling*
(asking a random node "what's new?") or push-pull finishes much faster
than *pushing* alone, because the stragglers go looking instead of
waiting to be picked.

## SWIM: failure detection plus gossip

A common use of gossip in backends is cluster membership, and the
classic protocol for it is SWIM, from Cornell in 2002. It
starts from a scaling problem in [[failure-detection]]. If every node
heartbeats every other node, the message load grows with the square of
the cluster size. SWIM splits the job in two: detect failures by
probing, and spread the results by gossip.

Detection works in rounds, called protocol periods. In each one, a node
Mi picks one member Mj and pings it:

![Sequence diagram with three lanes: member Mi, k random members, and member Mj. Mi sends a ping to Mj that gets no ack in time. After a timeout, Mi sends ping-req(Mj) to k random members. They ping Mj, Mj acks them, and they relay the ack back to Mi, so Mj stays alive in Mi's list. A bracket shows that all of this happens within one protocol period. A note says membership updates ride along on every ping, ping-req and ack.](img/gossip-protocols-swim-probe.svg)

*One SWIM protocol period, where the direct ping fails but an indirect one gets through. Adapted from Das, Gupta and Motivala, "SWIM", figure 1.*

1. Mi sends Mj a ping and waits for an ack, with a timeout based on the
   measured round trip.
2. No ack? Mi doesn't give up yet. It asks k other random members to
   ping Mj for it (`ping-req`). If any of them gets an ack, they relay
   it back.
3. If no ack arrives by the end of the period, Mi suspects Mj.

The indirect step keeps one congested path from getting a healthy node
declared dead. The period must be at least three round trips long.

The gossip part costs no extra packets. Every membership change a node
knows about (a join, a leave, a suspicion) is piggybacked on the pings,
ping-reqs and acks it's already sending. So each member sends a
constant number of messages per period however big the cluster is, the
expected time to first detect a failure doesn't grow with the cluster
either, and news spreads in a number of periods that grows with the
log of the cluster size.

Two refinements matter:

- **Suspect before declaring dead.** An unresponsive node is first
  gossiped as *suspected*. If it hears the rumor about itself, it can
  refute it with an *alive* message. Only if the suspicion times out
  is it *confirmed* dead. To tell old news from new, each node carries
  an **incarnation number** that only it may increase; a refutation
  carries a higher one, so it overrides the suspicion, and a
  confirmation overrides both.
- **Probe in round-robin order.** Picking targets purely at random can,
  by bad luck, leave a dead node unprobed for a long time. Going
  through a shuffled list instead means a failure is detected within at
  most twice the cluster size in protocol periods.

## Where it gets tricky

**Everyone's view is a little different.** Gossip is weakly consistent:
two nodes can have different membership lists at any moment, and they
converge only while changes stop long enough. That's fine for "who can
I send traffic to", and wrong for anything that needs one agreed
answer, like which node is the leader or what order writes happened
in. For that you need [[consensus]].

**"Eventually" is a probability.** Rumor mongering can leave a node that
never heard. Systems pair it with a slower, reliable pass like
anti-entropy to catch what the rumor missed.

**Deletes come back.** If a node just forgets a deleted item, the next
anti-entropy exchange with a node that still has it brings it back. The
fix is to spread a *death certificate*, a timestamped tombstone, like
any other update, and decide how long to keep it.

**Suspicion still misfires.** It cuts false positives but doesn't
remove them; see [[failure-detection]] for what happens when the
prober itself is the slow one.

## What this means when you build

- Use gossip for membership and "who's alive" hints in large clusters.
  Don't use it to decide anything that must be decided once.
- Treat a gossiped "dead" as a suspicion, and let the member refute it.
- Pair fast, lossy spreading with a periodic full sync, and use
  tombstones for deletes.

## Further reading

- [SWIM: Scalable Weakly-consistent Infection-style Process Group Membership Protocol](https://www.cs.cornell.edu/projects/Quicksilver/public_pdfs/SWIM.pdf), Abhinandan Das, Indranil Gupta and Ashish Motivala, 2002. Probing, indirect pings, piggybacked gossip, suspicion and incarnation numbers.
- [Epidemic Algorithms for Replicated Database Maintenance](https://bitsavers.org/pdf/xerox/parc/techReports/CSL-89-1_Epidemic_Algorithms_for_Replicated_Database_Maintenance.pdf), Alan Demers and others, Xerox PARC, 1987. Anti-entropy vs rumor mongering, push vs pull, and death certificates.
