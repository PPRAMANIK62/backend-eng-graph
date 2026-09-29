---
id: kleppmann-dist-sys-notes
title: "Distributed Systems: lecture notes (University of Cambridge, Part IB)"
author: Martin Kleppmann
url: https://www.cl.cam.ac.uk/teaching/2122/ConcDisSys/dist-sys-notes.pdf
kind: book
primary: false
---

## Summary

Course notes with slides for Cambridge's undergraduate distributed systems
course (the 2021/22 run, revised in 2020/21). Sections 1 and 2, and the start of 3.1, were read for
this project: what a distributed system is, RPC and why it isn't a local call,
the two generals and Byzantine generals problems, system models (network,
node and timing behaviour), faults vs failures, and failure detectors. Not
primary for any one system, but a careful teaching text by a researcher in
the field.

## Key claims

- A distributed system is many computers cooperating over a network, with no shared memory. "Different computers can only communicate by sending each other messages over a network." (1.1)
- Nodes and messages can fail, and you may not find out. "Communication may fail (and we might not even know it has failed)." (Slide 6)
- A partial failure: one node down while the rest keep going. "if one node has crashed (a partial failure), the remaining nodes may still be able to continue providing the service." (1.1)
- Handling faults is what makes the field different. "Dealing with faults is what makes distributed computing fundamentally different, and often harder, compared to programming a single computer." (1.1)
- Reasons to distribute: inherently distributed, reliability, performance (nearby nodes), problems too big for one machine. (Slide 4)
- No reply leaves the RPC client unsure whether the server did the work; retrying may do it twice. "If the client sends an RPC request but receives no response, it doesn't know whether or not the server received and processed the request." (1.3)
- Two generals: no finite number of messages gives certainty. "it can be proved that they cannot reach certainty by exchanging any finite number of messages." (2.1)
- A node can only know about another node through messages. "there is no way for one node to have certainty about the state of another node." (2.1)
- Byzantine generals: with malicious nodes and unpredictable delays, need 3f + 1 nodes to tolerate f. "in a system with 3f + 1 generals, no more than f may be malicious." (2.2)
- A system model has three parts: network, node and timing behaviour. "Capture assumptions in a system model consisting of:" network behaviour, node behaviour, timing behaviour (Slide 31)
- Network models: reliable links, fair-loss links, arbitrary links; a partition is links dropping or delaying all messages for a while. "Network partition: some links dropping/delaying all messages for extended period of time" (Slide 33)
- A fair-loss link can lose, duplicate or reorder messages. "Fair-loss links: Messages may be lost, duplicated, or reordered." (Slide 33)
- Fair-loss links become reliable with retries plus deduplication; TCP does this but gives up after a timeout. "TCP is usually configured with a timeout, so it will give up and stop retrying after a certain time, typically on the order of one minute." (2.3)
- TLS turns an arbitrary link into a fair-loss link, except it can't stop an attacker from blocking traffic. "The only thing that TLS cannot prevent is the adversary dropping (blocking) communication." (2.3)
- Node models: crash-stop, crash-recovery (memory lost, disk survives), Byzantine. "A node may crash at any moment, losing its in-memory state. It may resume executing sometime later." (Slide 34)
- Crash-recovery makes no promise about how long recovery takes. "The model makes no assumptions about how long it may take for a crashed node to recover, and it is possible for a crashed node to never recover." (2.3)
- A bug shared by all nodes defeats a Byzantine algorithm, so "Byzantine" usually means deliberate misbehaviour. "We therefore usually reserve the term Byzantine when referring to deliberate deviation from the protocol, and not for bugs." (2.3)
- Network models can be converted into each other; node models can't. "This is not the case with the different models of node behaviour." (2.3)
- Timing models: synchronous, partially synchronous, asynchronous. "The system is asynchronous for some finite (but unknown) periods of time, synchronous otherwise." (Slide 35)
- Algorithms built for synchrony fail badly when it breaks, even briefly. "algorithms designed for a synchronous model often fail catastrophically if the assumptions of bounded latency and bounded execution speed are violated, even just for a short while" (2.3)
- Some problems can't be solved in the asynchronous model, hence partial synchrony. "some problems in distributed computing are impossible to solve in an asynchronous model" (2.3)
- Causes of timing violations: retries after loss, congestion and queueing, route changes; OS scheduling, stop-the-world GC, page faults and swap. (Slide 36)
- Packets have been delayed over a minute inside one datacenter. "even within a single datacenter, there have been documented cases of packets being delayed for more than a minute" (2.3)
- GC pauses on large heaps can last minutes. "On large heaps, such pauses can be as long as several minutes" (2.3)
- A paused node doesn't notice; others may think it crashed. "After a while, the paused node resumes processing, without even realising that it was paused for a significant period of time." (2.3)
- A pause is not a crash: the program keeps its memory and doesn't know. "When an executing process or thread is paused, it normally does not notice it has been paused, unless it regularly checks the system clock to measure elapsed time." (2.3)
- Synchrony is rarely safe to assume. "it is very rarely safe to assume a synchronous system model." (2.3)
- Wrong assumptions break the algorithm. "If your assumptions are wrong, all bets are off!" (Slide 37)
- Fault vs failure: a fault is a part not working, a failure is the whole system not working. "Failure: system as a whole isn't working Fault: some part of the system isn't working" (Slide 39)
- Timeout-based failure detectors can't tell crash from slowness or loss. "cannot tell the difference between crashed node, temporarily unresponsive node, lost message, and delayed message" (Slide 40)
- A perfect timeout-based failure detector exists only with synchrony, crash-stop and reliable links. "A perfect timeout-based failure detector exists only in a synchronous crash-stop system with reliable links" (2.4)
- Raft gives total order broadcast directly, where Paxos starts from one value. "Raft is designed to provide FIFO-total order broadcast “out of the box”." (6.1)
- Paxos and Raft assume fair-loss links, crash-recovery nodes and partial synchrony. "Paxos and Raft assume a system model with fair-loss links (Slide 33), crash-recovery behaviour of nodes (Slide 34), and partial synchrony (Slide 35)." (6.1)
- FLP: no deterministic consensus algorithm is guaranteed to terminate in an asynchronous crash-stop model, which is why Raft and Paxos assume partial synchrony. "There is no deterministic consensus algorithm that is guaranteed to terminate in an asynchronous crash-stop system model." (Slide 107)
- Byzantine consensus costs more. "Byzantine fault-tolerant consensus algorithms are significantly more complicated and less efficient than non-Byzantine ones." (6.1)
- Clocks are only for timeouts; safety doesn't depend on timing. "Safety (correctness) does not depend on timing." (Slide 107)
- Terms stop two leaders in the same term, not two leaders at once in different terms. "Can guarantee unique leader per term. Cannot prevent having multiple leaders from different terms." (Slide 109)
- A partitioned old leader may not know it was replaced. "Thus, we end up with two nodes both believing to be the leader." (6.1)
- So a leader must get a quorum's confirmation for every decision. "It is not safe for a leader to act unilaterally." (6.1)
- An old leader finds out in that round, because one of the quorum voted for the new leader. "because at least one of the nodes in the second-round quorum must have also voted for the new leader." (6.1)

- Tolerating one crash in three nodes lets you upgrade one node at a time. "if a service can tolerate one out of three nodes being unavailable, then a software upgrade can be rolled out by installing it and restarting one node at a time" (2.4)
- Distributed systems lean on time everywhere: timeouts, failure detectors, retry timers, logs, cache expiry, ordering events across nodes. "Schedulers, timeouts, failure detectors, retry timers" (Slide 43)
- Each computer's quartz clock drifts, faster or slower, and temperature changes it. "Due to manufacturing imperfections, some clocks run slightly faster than others." (3.1)
- Drift is measured in ppm; 1 ppm is about 86 ms a day, and most computer clocks are within about 50 ppm. "Most computer clocks correct within ≈ 50 ppm" (Slide 45)
- (Sections 5.3 and 6 read later.) A failure detector usually detects crashes; Byzantine faults aren't always detectable. "A failure detector usually detects crash faults." (2.4)
- The usual implementation: send a message, wait, label crashed on timeout. "In most cases, a failure detector works by periodically sending messages to other nodes, and labelling a node as crashed if no response is received within the expected time." (2.4)
- In an asynchronous system no timeout-based detector exists at all. "in an asynchronous system, no timeout-based failure exists, since timeouts are meaningless in the asynchronous model." (2.4)
- The eventually perfect failure detector may be wrong for a while, but eventually labels a node crashed if and only if it has crashed. "But eventually, labels a node as crashed if and only if it has crashed" (Slide 41)
- Tolerating one of three nodes down makes rolling upgrades possible. "if a service can tolerate one out of three nodes being unavailable, then a software upgrade can be rolled out by installing it and restarting one node at a time" (2.4)
- Fault tolerance always has a limit, often fewer than half the nodes crashed. "some distributed algorithms are able to make progress provided that fewer than half of the nodes have crashed, but they stop working if more than half the nodes crash." (2.4)
- State machine replication: total order broadcast every update, apply it deterministically. "Replica is a state machine: starts in fixed initial state, goes through same sequence of state transitions in the same order =⇒ all replicas end up in the same state" (Slide 101)
- Determinism includes errors. "Even errors must be deterministic: if an update succeeds on one replica but fails on another, they would become inconsistent." (5.3)
- The transition logic can be arbitrarily complex, even a whole transaction. "An excellent feature of SMR is that the logic for moving from one state to the next can be arbitrarily complex, as long as it is deterministic." (5.3)
- Each replica running the same transaction code is active replication. "with each replica independently executing the same deterministic transaction code (this is known as active replication)." (5.3)
- A replica can't update its state right away; it has to wait for the broadcast to deliver the update back. "Cannot update state immediately, have to wait for delivery through broadcast" (Slide 102)
- Leader-based database replication (followers applying the leader's commits in order) is total order broadcast of commit records, called passive or primary-backup replication. "This approach is known as passive replication or primary-backup replication" (5.3)
- With weaker broadcast (causal, reliable, best-effort), updates must commute instead. "If replica state updates are commutative, replicas can process updates in different orders and still end up in the same state." (Slide 104)
- Manual failover is slow for unplanned outages; consensus automates choosing a new leader. "Even in the best case, it will take several minutes for an operator to respond, during which the system is not able to process any updates." (6)
- Consensus defined: the decided value was proposed, everyone decides the same, and decisions are final. "The algorithm guarantees that the decided value is one of the proposed values, that all nodes decide on the same value (with the exception of faulty nodes, which may not decide anything), and that the decision is final" (6.1)
- Consensus and total order broadcast are equivalent; one instance per slot turns consensus into a log. "It has been formally shown that consensus and total order broadcast are equivalent to each other" (6.1)
- Paxos decides a single value; Multi-Paxos, Raft, Viewstamped Replication and Zab provide total order broadcast. "In its original formulation, Paxos provides only consensus on a single value" (6.1)
- Paxos and Raft assume partial synchrony, crash-recovery nodes and fair-loss links. "Paxos, Raft, etc. assume a partially synchronous, crash-recovery system model." (Slide 107)
- FLP stated. "There is no deterministic consensus algorithm that is guaranteed to terminate in an asynchronous crash-stop system model." (Slide 107)
- Clocks are only used for timeouts, so only liveness depends on timing. "Paxos, Raft, etc. use clocks only used for timeouts/failure detector to ensure progress. Safety (correctness) does not depend on timing." (Slide 107)
- Byzantine consensus is more complex and less efficient. "Byzantine fault-tolerant consensus algorithms are significantly more complicated and less efficient than non-Byzantine ones." (6.1)
- Ways around FLP: randomised algorithms, or, in practice, clocks for timeouts. "It is possible to get around the FLP result by using a nondeterministic (randomised) algorithm." (6.1)
- Terms: each election increments the term, a node votes once per term, a quorum elects the leader. "Require a quorum of nodes to elect a leader in a term" (Slide 108)
- With majority quorums a vote succeeds while a majority is up. "If a majority quorum is used, this vote can succeed as long as a majority of nodes (2 out of 3, or 3 out of 5, etc.) are working and able to communicate." (6.1)
- Two leaders from different terms can exist at once; an old leader may not know it's been replaced. "Thus, we end up with two nodes both believing to be the leader." (6.1)
- So a leader asks a quorum before every decision; any quorum overlaps the one that elected a newer leader. "at least one of the nodes in the second-round quorum must have also voted for the new leader." (6.1)
- Byzantine example sizes: 4 generals tolerate 1 malicious, 7 tolerate 2. "For example, a system with 4 generals can tolerate f = 1 malicious general, and a system with 7 generals can tolerate f = 2." (2.2)
- Signatures make the Byzantine problem easier but not easy. "However, even with signatures, the Byzantine generals problem remains challenging." (2.2)
- Real systems have mixed trust: a shop must assume customers may cheat, but services inside one company's datacenter can usually trust each other. "for RPC between services belonging to the shop, running in the same datacenter, one service can probably trust the other services run by the same company." (2.2)
- BFT systems became popular with blockchains. "This idea has become popular in recent years in the context of blockchains and cryptocurrencies" (2.2)
- Crash-recovery consensus is enough for trusted private networks. "We will focus on fair-loss, crash-recovery algorithms for now, which are useful in many practical settings (such as datacenters with trusted private networks)." (6.1)
- Atomic commit: every node commits or every node aborts. "either all nodes must commit the transaction and make its updates durable, or all nodes must abort the transaction and discard or roll back its updates." (7.1)
- Atomic commit is not consensus: one crashed participant forces abort. "Must abort if a participating node crashes" (Slide 123)
- 2PC is not 2PL. "2PL ensures serializable isolation, while 2PC ensures atomic commitment." (7.1)
- Three-phase commit assumes a synchronous model. "There is also a three-phase commit protocol, but it assumes the unrealistic synchronous system model" (7.1)
- A participant that votes ok must be able to commit later no matter what. "the replica must write all of the transaction’s updates to disk and check any integrity constraints before replying ok to the prepare message, while continuing to hold any locks for the transaction." (7.1)
- Any no, or a timeout, means abort. "if any node wants to abort, or if any node fails to reply within some timeout, the coordinator decides to abort." (7.1)
- The coordinator is a single point of failure; prepared participants are in doubt. "Any in-doubt transactions must wait until the coordinator recovers to learn their fate" (7.1)
- Fault-tolerant 2PC: broadcast votes with total order broadcast, let nodes vote abort for a suspected-dead node, and count only the first vote per node. "we count only the first vote from any given replica, and ignore any subsequent votes from the same replica." (7.1)
- Atomic commit makes the strongest assumptions of the problems in the course. "Atomic commit makes the strongest assumptions, since it must wait for communication with all nodes participating in a transaction" (Slide 141 text)
- Spanner combines Paxos per shard, 2PL and 2PC. "State machine replication (Paxos) within a shard" (Slide 154)
- Spanner commit wait: take the latest end of the TrueTime interval, then wait out the uncertainty. "before the transaction actually commits and releases its locks, it first pauses and waits for a duration equal to the clock uncertainty period" (8.2)
- Lamport clocks can't order transactions linked only through a user. "we cannot expect a human to include a properly formed timestamp on every action they perform." (8.2)
- (Broadcast) FIFO broadcast. "If m1 and m2 are broadcast by the same node, and broadcast(m1 ) → broadcast(m2 ), then m1 must be delivered before m2" (Slide 75)
- Causal broadcast. "If broadcast(m1 ) → broadcast(m2 ) then m1 must be delivered before m2" (Slide 75)
- Total order broadcast. "If m1 is delivered before m2 on one node, then m1 must be delivered before m2 on all nodes" (Slide 75)
- FIFO-total order broadcast combines the two. "Combination of FIFO broadcast and total order broadcast" (Slide 75)
- A sender also delivers its own message to itself, which total order needs. "we assume that whenever a node broadcasts a message, it also delivers that message to itself" (4.2)
- Simple approach 1: a leader as sequencer. "To broadcast message, send it to the leader; leader broadcasts it via FIFO broadcast." (Slide 86)
- Simple approach 2: Lamport timestamps, but you must hear from every node. "Need to use FIFO links and wait for message with timestamp ≥ T from every node" (Slide 86)
- Neither simple approach is fault tolerant. "neither of these approaches is fault tolerant: in both cases, the crash of a single node can stop all other nodes from being able to deliver messages." (4.3)

## Visuals worth redrawing

- Slide 23: the two generals exchange, and the indistinguishable case where the reply is lost.
- Slide 33 to 35: the three-part system model (network, node, timing) as a menu.
- Slide 109: node 1 still believes it leads term t while nodes 2 and 3 elect a leader for t + 1.
- Section 6.2 (Raft 1/9 to 9/9): Raft as pseudocode over nine slides.

## My notes

- The notes cite Bailis and Kingsbury for "networks are unreliable", Dwork,
  Lynch and Stockmeyer for partial synchrony, and Waldo et al. for RPC.
- Section 7.1 (two-phase commit, slides 122 to 127) and the Spanner part
  of section 8 (slides 154 to 158) were also read, for the phase 12
  transaction nodes.
