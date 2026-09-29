---
id: replicated-state-machine
title: Replicated state machines
depth: deep
phase: 12
note: >-
  Same commands in the same order give the same state on every node.
  Consensus picks the order.
needs: [consensus]
leads_to: [raft, paxos, durable-execution]
compare_with: [lamport-clocks, leader-follower-replication, workflow-determinism]
---

# Replicated state machines

A replicated state machine is the standard way to make a service
survive server crashes. You write the service as a deterministic state
machine, run a copy on several servers, and feed every copy the same
commands in the [[total-order-broadcast|same order]]. Every copy then goes through the same
states and gives the same answers, so the group behaves like one server
that doesn't go down. [[consensus]] is what picks the order.

## One server, then many

Start with one server running a bank. Its state is every account
balance. Its commands are things like "withdraw 100 from Alice", which
lowers the balance only if it's big enough and returns the old and new
balance. Clients send commands, the server runs them one at a time.

That's simple, and the service is exactly as reliable as that one
machine. So run the same program on three servers. If all three:

1. start from the same state,
2. run the same commands,
3. in the same order,
4. and each command's result depends only on the state and the command,

then all three end up with the same balances and return the same
answers. A client can take the reply from any of them. Lose a server
and the others carry on with identical state.

The last condition is the definition of a state machine here: its
outputs are completely determined by the sequence of commands it has
processed, and by nothing else, not the time, not the speed of the
machine, not anything else going on.

## The log is the contract

In practice the "same commands in the same order" part is a
**replicated log**:

![Three servers side by side, server 1 being the leader. Each has a consensus module, a log with the entries x:=3, y:=1 and y:=9, and a state machine showing x=3, y=9. A client sends y:=9 to server 1's consensus module, which replicates the entry to the other two servers; a label says a majority must store it. On every server the log feeds the state machine in order, and server 1 returns the result to the client.](img/replicated-state-machine-log.svg)

*A replicated state machine built on a log. Adapted from Ongaro and Ousterhout, "In Search of an Understandable Consensus Algorithm", figure 1.*

1. A client sends a command to the consensus module on one server,
   usually the leader.
2. The consensus modules agree on where the command goes in the log,
   and store it on a majority of servers. Only then is the entry
   committed.
3. Each server applies committed entries to its state machine strictly
   in log order.
4. The leader returns the state machine's output to the client.

Keeping the logs identical is the whole job of the consensus
algorithm. The simplest way to see it: run one round of consensus to
decide log entry 1, another for entry 2, and so on. Paxos, as Lamport
describes it, does exactly that; [[raft]] builds the log in directly.
The state machine on top never talks to other servers. It just reads
its log.

Two properties hold the design together. **Agreement:** every working
replica receives every command. **Order:** every working replica
processes them in the same order. Break either one and the copies
drift apart.

## Deterministic means deterministic

The rule that trips people up is that applying a command must give the
same result on every replica. Anything the command reads besides the
current state and the command itself can break that:

- **The clock.** "Expire sessions older than an hour" gives different
  answers on replicas that apply it a few milliseconds apart.
- **Randomness.** Generating an ID with a random number inside the
  apply step gives each replica a different ID.
- **Loops over changing inputs.** A command that keeps polling a sensor
  until something happens produces output that depends on how fast the
  replica runs.
- **Errors.** If a command fails on one replica (say, out of disk) and
  succeeds on another, they've diverged. Even failures have to be
  deterministic.

The fix is the same every time: make the nondeterministic choice once,
outside the state machine, and put the result in the command. The
leader reads the clock and writes "expire sessions older than
[timestamp]" into the log. The client generates the ID. The polling
loop moves into the client, which sends a command each time it reads
the sensor.

In return you get a lot of freedom. The logic inside a command can be
as complicated as you like, a whole database transaction with business
rules, as long as it's deterministic. When every replica runs the
command itself, it's called **active replication**. The common
alternative is **passive** or primary-backup replication: the leader
runs the transaction and ships the resulting changes, and followers
apply those changes in commit order. That's
[[leader-follower-replication]], and it's the same idea with the
leader's commit records as the log.

## Where you see it

Replicated state machines are rarely the whole product. They're the
small, critical core. Systems with a single cluster leader, like GFS,
HDFS and RAMCloud, keep their leader election and configuration in a
separate replicated state machine. Google's Chubby and Apache
ZooKeeper are replicated state machines. The etcd Raft library, used
by etcd (and so by Kubernetes), CockroachDB, TiDB and others, gives you
the log; you supply the state machine, the network transport and the
storage.

## Where it gets tricky

**Divergence is silent.** Nothing in the log tells you that two
replicas computed different results. Google's Chubby team added a
check: the leader periodically puts a "checksum now" command in the
log, every replica checksums its database at that point, and they
compare. It caught three inconsistencies in production: one operator
error, one possibly caused by corrupted hardware memory, and one
suspected illegal memory access in the code.

**The log grows forever.** Replaying every command since the beginning
is how a replica rebuilds its state, but nobody wants to keep years of
log. Replicas take a **snapshot** of the state machine, record which
log position it corresponds to, and delete the log before it. Each
replica can snapshot on its own schedule. The details are in
[[raft-snapshots]].

**Reads are commands too.** It's tempting to answer reads straight
from the local state machine. A replica may be behind, though, and even
the leader may have been replaced without knowing it, so a local read
can return stale data. Getting fresh reads without putting every read
through the log is covered in [[linearizable-reads]].

**How many replicas?** In the classic account of this approach, t + 1
replicas survive t failures if servers fail cleanly by stopping, and
2t + 1 if they can lie. Consensus systems use 2t + 1 even for plain
crashes. Both are right; they count different things. The t + 1 figure
assumes the replicas already have their commands in order and failures
are detectable. Agreeing on that order, when a crashed server and a
slow one look the same, needs a majority, so 2t + 1.

**Order can sometimes be relaxed.** If two commands commute, meaning
either order gives the same final state and outputs, replicas can apply
them in different orders. Taken to the extreme, where all updates
commute, you don't need consensus at all; that's the idea behind
[[crdts]].

**Changing the replica set.** Which servers are in the group can itself
be part of the state, changed by ordinary commands through the log.
Doing that safely has its own rules; see [[raft-membership-changes]].

## What this means when you build

- Write the state machine as a pure function: state and command in,
  new state and output out. No clock, no randomness, no network or file
  I/O inside it.
- Decide nondeterministic values (times, IDs, random choices) before
  the command enters the log, and store them in it.
- Make failures part of the result, not an exception that one replica
  hits and another doesn't.
- Add a cross-replica checksum. Divergence you can't see is divergence
  you can't fix.
- Test by replaying the same log into fresh replicas and comparing the
  states. The etcd Raft library does the same thing to itself: it's
  written as a deterministic state machine so it can be tested, which
  is the idea behind [[deterministic-simulation-testing]].
- The same rule, deterministic code replaying a recorded history, comes
  back in [[durable-execution]].

## Further reading

- [Implementing Fault-Tolerant Services Using the State Machine Approach](https://www.cs.cornell.edu/fbs/publications/SMSurvey.pdf), Fred Schneider, 1990. The classic tutorial: what counts as a state machine, Agreement and Order, and replica counts.
- [In Search of an Understandable Consensus Algorithm](https://raft.github.io/raft.pdf), Diego Ongaro and John Ousterhout, 2014. Section 2 and figure 1: the replicated log and where replicated state machines are used.
- [Paxos Made Simple](https://lamport.azurewebsites.net/pubs/paxos-simple.pdf), Leslie Lamport, 2001. Section 3: a bank as a state machine, and one consensus instance per command.
- [Distributed Systems lecture notes](https://www.cl.cam.ac.uk/teaching/2122/ConcDisSys/dist-sys-notes.pdf), Martin Kleppmann, University of Cambridge. Section 5.3: state machine replication on total order broadcast, deterministic errors, active vs passive replication.
- [Paxos Made Live](https://research.google.com/archive/paxos_made_live.pdf), Tushar Chandra, Robert Griesemer and Joshua Redstone, Google, 2007. Snapshots and the checksum check that caught real divergence.
- [etcd-io/raft](https://github.com/etcd-io/raft), etcd maintainers. A widely used library that gives you the log and leaves the state machine to you.
