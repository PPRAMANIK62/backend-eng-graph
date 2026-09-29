---
id: failure-detection
title: Failure detection
depth: deep
phase: 12
note: >-
  Deciding a node is dead from missing heartbeats, when slow and dead
  look the same. Phi accrual.
needs: [distributed-system, timeouts, process-pauses, flp-impossibility]
leads_to: [gossip-protocols, raft-elections, two-phase-commit]
compare_with: [health-checks, network-partitions, leader-follower-replication]
---

# Failure detection

A failure detector is the part of a cluster that decides another node
has died. It's the trigger for almost every recovery step: electing a
new leader, moving a shard, retrying a transaction somewhere else. The
catch is that it can only go on silence, and a dead node, a slow node
and a lost message all sound the same. Every failure detector is a
guess, and the design question is which way you'd rather be wrong.

## Silence is all you get

Take two nodes in a [[distributed-system|distributed system]]. Node A
wants to know if node B is alive. The only tool A has is messages: it
can send B something and wait for an answer. There's no shared memory
and no way to look at B directly.

Say A sends a ping and nothing comes back. Four different things could
have happened:

![Four timelines between node A and node B, each ending with A getting no reply before its timeout. In the first, B has crashed. In the second, B is alive but paused (for example by garbage collection) and answers after the timeout. In the third, A's ping is lost in the network. In the fourth, B's reply is delayed and arrives after the timeout. In every case A gives up at the same moment and suspects B.](img/failure-detection-silence.svg)

*From A's side, a crash, a pause, a lost ping and a late reply look the same.*

B might have crashed. It might be alive but frozen in a
[[process-pauses|process pause]] for seconds, say a stop-the-world
garbage collection, and not even know it. The ping might have been
lost. Or the reply might be on its way, just late. A can't tell these
apart. All it can do is pick a [[timeouts|timeout]] and, when it
expires, start treating B as dead.

That's why the output of a failure detector is called a *suspicion*,
not a fact. Even the name is loose: what it really detects is a fault
in one part, a node that isn't answering, not a failure of the whole
system.

## Heartbeats and a timeout

The common design turns the ping around. B sends A a small heartbeat
message at a fixed interval, and A suspects B if no heartbeat arrives
within the timeout. Three numbers matter: how often B sends, how long
A waits, and how long a message takes to cross the network.

The timeout is a trade:

- **Short timeout:** a real crash is noticed quickly, but a busy
  network or a GC pause gets B wrongly declared dead.
- **Long timeout:** fewer wrong suspicions, but a real crash goes
  unnoticed for longer, and whatever depends on B waits.

So a failure detector is judged on two things: its **detection time**
(from B crashing to A suspecting it for good) and its **mistake rate**
(how often it suspects a node that's fine). You can't push both to
zero. Sending heartbeats faster doesn't help much either: detection can
never be quicker than the time a message takes to arrive, and
flooding the network with heartbeats can slow that down.

## What a detector can and can't promise

Researchers describe failure detectors with two properties.
**Completeness** says every node that crashes is eventually suspected.
**Accuracy** limits the mistakes: how often, or for how long, a
healthy node may be suspected.

How much accuracy you can get depends on the timing assumptions in
your [[failure-models|failure model]]:

- In a **synchronous** system, where message delay and processing
  speed have known limits, crashes are permanent and links are
  reliable, a timeout can be perfect: it fires only when the node has
  really crashed.
- In an **asynchronous** system, with no limits at all, a timeout means
  nothing. No timeout-based detector exists there.
- In a **partially synchronous** system, the realistic middle where the
  network behaves most of the time, you can build an *eventually
  perfect* detector. It may wrongly suspect a healthy node, or trust a
  crashed one, for a while. But eventually it suspects exactly the
  nodes that have crashed.

One practical recipe gets you there: when A suspects B and then hears
from B after all, A admits the mistake, removes the suspicion and
lengthens its timeout for B. Repeated wrong suspicions push the timeout
up until they stop.

The big consequence is for algorithms that use a detector, like
[[consensus]]. Because the detector is sometimes wrong, those
algorithms must stay correct while it's wrong. The rule they follow: a
bad detector may stop progress, but it must never cause a wrong
answer. That's how Raft and Paxos use it. A timeout starts an election,
but a wrongly started election can only waste time, never make two
nodes disagree. Without any detector at all, the
[[flp-impossibility|FLP result]] shows consensus can get stuck forever.

## Suspicion as a number: phi accrual

A plain timeout gives one bit: trusted or suspected. Different parts
of a system want different answers from the same data, though. A job
scheduler might want to stop sending new work to a worker at the first
sign of trouble, cancel and resubmit its running jobs a bit later, and
only remove it from the pool once it's almost certainly gone.

The **φ (phi) accrual failure detector**, published by Hayashibara and
colleagues in 2004, outputs a suspicion level instead of a yes or no.
It works like this:

1. A records when each heartbeat from B arrives, in a sliding window of
   recent arrivals.
2. From the gaps between arrivals it keeps a mean and a variance, and
   treats the gaps as a normal distribution.
3. At any moment, it asks: given that distribution, how likely is it
   that the next heartbeat would still be on its way this long after
   the last one? Call that probability *P*.
4. φ is −log10(*P*).

![Top: a timeline of heartbeats from node B arriving at node A at roughly regular intervals, then stopping. Bottom: the phi value over the same time. Phi stays near zero while heartbeats arrive and resets at each one. After the last heartbeat it climbs and crosses a horizontal threshold line, labelled 8 by default in Akka and Cassandra, where A suspects B. Two curves: when past heartbeats were regular, phi climbs steeply and crosses sooner; when they were jittery, it climbs gently and crosses later.](img/failure-detection-phi.svg)

*φ grows the longer a heartbeat is overdue, and faster when past heartbeats were regular. Adapted from Hayashibara et al., "The φ Accrual Failure Detector", and the Akka documentation's φ charts.*

The log scale makes φ easy to read. If A suspects B once φ reaches 1,
there's about a 10% chance the suspicion is wrong, meaning a late
heartbeat will still turn up. At φ = 2 it's about 1%, at φ = 3 about
0.1%. Each application picks its own threshold on the same number,
which is the point: monitoring is shared, interpretation isn't.

Because the scale is fitted to recent arrivals, it adapts. On a quiet
network with regular heartbeats, the distribution is narrow, φ climbs
steeply once a heartbeat is late, and a crash is caught quickly. On a
jittery network the same delay produces a lower φ, so the detector
waits longer before it's confident.

φ is used in real systems. Cassandra marks a node down when its φ
reaches `phi_convict_threshold`, 8 by default in Cassandra 5.0. Akka
Cluster (2.10) sends heartbeats every second, uses a default threshold
of 8, and suggests 12 on Amazon EC2 to ride out the network hiccups
seen there. Akka also adds an `acceptable-heartbeat-pause` margin, so a
garbage collection pause or a brief network blip doesn't immediately
count against a node.

## Who watches whom

In a cluster, every node needs some view of every other. The simplest
approach, every node heartbeating every other node, means the message
load grows with the square of the cluster size. Sending all heartbeats
to one central monitor avoids that, but turns the monitor into a hot
spot. Large clusters instead probe a few
random peers per round and spread what they learn peer to peer. That's
[[gossip-protocols|gossip]], and the SWIM protocol behind HashiCorp's
Consul and Nomad works this way.

## Where it gets tricky

**Suspected isn't stopped.** When A declares B dead, B hasn't agreed to
anything. If B was only paused, it wakes up still believing it's the
leader or still holding a lock, and acts on it. Two leaders at once is
the classic outcome. The detector can't prevent this. What prevents it
is the next layer: [[raft-elections|elections]] with terms, where an
old leader can't get a quorum to accept anything once a newer leader
exists, and [[fencing-tokens]] for resources outside the cluster. Some systems take the blunt
route and force a wrongly suspected node to kill itself, so that
"suspected" and "dead" become the same thing by decree.

**The watcher can be the sick one.** A node whose CPU is starved or
whose network is dropping packets misses acks from everyone, and so
suspects everyone. HashiCorp hit this in Consul: in their tests on 100
single-core VMs, one overloaded member was enough to make healthy
members get marked as failed. Their fix, called Lifeguard, has each
node track its own health. It slows its own probing when it's missing
acks, and it starts each suspicion with a long timeout that shortens
only as other members independently agree. In their tests that cut
false positives by 50 to 100 times.

**Flapping is its own failure.** A node that's marked dead, then alive,
then dead again can trigger a failover, a rebalance or a data copy each
time. Akka's docs call out the pattern (UNREACHABLE, then REACHABLE,
repeated) and say to look for long GC pauses, overload and tight CPU
quotas before simply raising the margin. Raising it hides the symptom
and slows every real detection.

**The model behind φ is a choice.** φ assumes heartbeat gaps follow a
normal distribution. That's a convenient model, not a measured fact
about your network. A long GC pause sits far out in the tail of a
normal distribution fitted to regular heartbeats, which is why Akka
adds a fixed pause margin on top.

**A failure detector isn't only a health check.** A load balancer's
[[health-checks|health check]] is a failure detector too, and a wrong
answer there costs a backend some time out of rotation. The detectors
in this article feed algorithms that must stay correct even when the
detector is wrong. That's a stronger requirement, and it's why
consensus systems never trust a detector for safety.

## What this means when you build

- Treat every "node is dead" signal as a suspicion. Design the action
  it triggers so that acting on a live node is safe: fenced, idempotent
  or reversible.
- Pick the timeout from measured heartbeat delays, not a round number,
  and write down which way you chose to be wrong. A timeout shorter
  than your worst GC pause will fail over healthy nodes.
- If different reactions need different confidence, expose a level
  (φ or similar) and give each reaction its own threshold.
- When a detector flaps, look at the node doing the detecting as well
  as the node being detected.
- Don't let a detector alone decide who the leader is. Use it to start
  an election, and let the election protocol, [[two-phase-commit]]
  recovery or a lease decide.

## Further reading

- [The φ Accrual Failure Detector](https://dspace.jaist.ac.jp/dspace/bitstream/10119/4784/1/IS-RR-2004-010.pdf), Naohiro Hayashibara, Xavier Défago, Rami Yared and Takuya Katayama, 2004. The accrual idea, the φ formula, and the detection time vs mistake rate trade.
- [Unreliable Failure Detectors for Reliable Distributed Systems](https://www.cs.utexas.edu/~lorenzo/corsi/cs380d/papers/p225-chandra.pdf), Tushar Deepak Chandra and Sam Toueg, 1996. Completeness and accuracy, why a wrong detector may cost liveness but not safety, and the timeout back-off recipe.
- [Distributed Systems lecture notes](https://www.cl.cam.ac.uk/teaching/2122/ConcDisSys/dist-sys-notes.pdf), Martin Kleppmann, University of Cambridge. Section 2.4: why a timeout can't tell crashed from slow, and perfect vs eventually perfect detectors, in plain terms.
- [Phi Accrual Failure Detector](https://doc.akka.io/libraries/akka-core/current/typed/failure-detector.html), Akka core docs (2.10). φ in a production library: defaults, the heartbeat pause margin, and how to read flapping.
- [cassandra.yaml file configuration](https://cassandra.apache.org/doc/5.0/cassandra/managing/configuration/cass_yaml_file.html), Apache Cassandra 5.0 docs. `phi_convict_threshold` and its default.
- [Lifeguard: Local Health Awareness for More Accurate Failure Detection](https://arxiv.org/abs/1707.00788), Armon Dadgar, James Phillips and Jon Currey, HashiCorp, 2017. What goes wrong when the detecting node is the unhealthy one, measured on Consul.
- [SWIM](https://www.cs.cornell.edu/projects/Quicksilver/public_pdfs/SWIM.pdf), Abhinandan Das, Indranil Gupta and Ashish Motivala, 2002. Why all-to-all heartbeats don't scale, and the random-probing alternative.
