---
id: fault-injection
title: Fault injection
depth: deep
phase: 11
note: >-
  Breaking networks, disks, clocks and processes on purpose to see what
  the system does. netem, toxiproxy, Jepsen. The phase 11 build.
needs: [network-partitions, process-pauses, crash-testing, history-checking]
leads_to: [deterministic-simulation-testing, chaos-engineering]
compare_with: [fuzzing]
---

# Fault injection

Fault injection means breaking things on purpose while your system runs: cut
the network between two nodes, slow it down, kill or freeze a process, move
a clock, corrupt a file. Then you check whether the system still kept its
promises. It exists because the bugs that hurt distributed systems live in
code that only runs when something goes wrong, and ordinary tests almost
never make anything go wrong.

## Why ordinary tests miss these bugs

Two studies of real failures make the case.

One looked at 198 user-reported failures in Cassandra, HBase, HDFS, Hadoop
MapReduce and Redis, all systems built to tolerate faults and already
tested with unit tests, random error injection and static analysis. Almost
all of the catastrophic failures, 92%, came from mishandling an error the
code had already detected: an exception caught and ignored, an error that
aborted the whole cluster, a handler with a `TODO` in it. In 58% of the
catastrophic cases, simple testing of the error-handling code would have
found the bug. That code is the last line of defence, and nobody had made
it run.

The other looked at 136 failures caused by
[[network-partitions|network partitions]] in 25 systems. When developers
tested partitions at all, they mostly used mocks: fake the failure for one
component, on one side of the partition. That can't exercise a whole
protocol with nodes on both sides. Yet 93% of the failures could be
reproduced with a tool that injects real partitions, and 83% needed only
three nodes.

Both studies found the same thing about timing and order. Most failures
need a few events, usually no more than three, in a particular order: a
partition, then a write, then the partition heals. You don't need a huge
cluster to find them. You need the right faults at the right moments.

## The loop: workload, faults, history, checker

Jepsen is a testing library that has been used on everything from
eventually consistent databases to coordination services and task
schedulers. Its design is a good template for any fault-injection
harness.

![Diagram. A nemesis box sends "inject, heal" to node A. Test clients send operations to node A through Toxiproxy, which can add latency, timeouts, resets or bandwidth limits. Inside node A, fault points are listed: process (kill -9 to crash, SIGSTOP to pause), clock (NTP off, then bump or strobe), disk (bit flips, truncation, LazyFS), network card (tc netem delay, loss, reorder). The link between node A and node B is cut; node B has an iptables rule dropping all traffic from A. The clients' history flows to a checker that asks whether the history is valid.](img/fault-injection-where.svg)

*Where each fault goes in, and how a test turns faults into a verdict.*

1. **A real cluster.** A control machine logs into a few database nodes
   over SSH and sets up the real system on them.
2. **A workload.** Several clients send operations, like reads and writes,
   and record the start and end of every one. That record
   is the **history**.
3. **A nemesis.** A separate process injects faults on a schedule: split
   the cluster, heal it, pause a node, resume it.
4. **A checker.** After the run, a checker reads the history and decides
   whether it's allowed. For a key-value store that promises
   [[linearizability]], that's a [[linearizability-checking]] step.

The history has to be honest about uncertainty. When a client's request
times out, the operation may or may not have happened, so it's recorded as
unknown, not as failed. The checker then considers both possibilities.
Counting a timeout as a failure is the easiest way to get a checker that
lies. See [[history-checking]] for how checkers reason about this.

A worked example from Jepsen's own tutorial: a test against etcd's v2 API with a
nemesis that split the cluster into two random halves every so often. It
failed with a stale read, a read that returned a value older than a write
that had already completed. The cause was that etcd served reads from any
replica's local state by default. Quorum reads fixed it.

## What you can break, and with what

**Partitions.** The simplest tool is the firewall. To cut node A off from
node B, add a rule on B that drops every packet from A, and the mirror rule
on A; flush the rules to heal. That's how Jepsen does it with `iptables`.
The shape of the cut matters as much as the cut: isolate one node, split a
majority from a minority, leave one "bridge" node that still sees both
halves (a partial partition), or give every node a different majority. A
single rule on one side gives you a one-way partition. The partition study
found 88% of failures needed only one isolated node, and 29% needed a
partial partition.

**A bad network, short of a cut.** Linux's `netem` queueing discipline,
set with `tc`, degrades an interface: fixed or jittered delay, delay from
a long-tailed distribution, random or bursty loss, corruption, duplication,
reordering and rate limits. It takes a seed, so random loss can be
repeated. It has limits worth knowing: it shapes packets leaving an
interface; it's only as precise as the kernel's timers; reordering needs
some delay to work; and for realistic TCP results, it should sit on the
receiving host's ingress. With a priority queue and filters you can apply
it only to traffic toward one peer.

**One connection at a time.** Toxiproxy is a TCP proxy you put between
your code and a dependency, controlled over HTTP. You add "toxics" to it:
latency with jitter, a bandwidth cap, a timeout that stops all data,
connection resets, data sliced into small pieces, a cap on bytes before
closing, chunk loss. Each applies upstream or downstream, to a set share
of connections. It needs no root, which is why it fits in a CI pipeline.
Its limit is its reach: it only affects connections that go through it.

**Processes.** `kill -9` is a crash. `SIGSTOP` freezes a process and
`SIGCONT` resumes it, which is how you create [[process-pauses]].
`SIGKILL` and `SIGSTOP` can't be caught, so the process gets no chance to
react. One Linux
detail: after a stop and continue, some blocking calls, like `epoll_wait`
or socket reads with a timeout, can return `EINTR`, which is itself a code
path worth testing.

**Clocks.** Turn off time synchronization on a node, then jump its clock
once, or keep jumping it forward and back on a short period for a
while. Containers don't have clocks of their own, so testing
[[clock-skew]] needs separate virtual machines or real hardware.

**Disks.** Flip bits in a file or truncate it, to see whether the system
notices corruption. Simulating power loss, where unsynced writes vanish, is
[[crash-testing]]; Jepsen does it with LazyFS, a file system that drops
writes that were never fsynced.

## Random or aimed

Jepsen-style testing is mostly random: the nemesis picks faults and
targets on a schedule, and you run many times. That finds things nobody
thought of. But the partition study found 80% of failures were
deterministic or had known timing, and most needed only a handful of
events. So aimed tests are cheap and worth writing: "isolate the leader,
write to the majority, heal, read from the old leader." Once random
testing finds a bug, turn it into an aimed test.

Faults on real processes aren't fully repeatable. A few bugs depend on
thread interleavings or on background work inside the system, and those
vary from run to run. When you need exact replay, the
alternative is [[deterministic-simulation-testing]]: run the whole cluster
in one process with a fake network and a seeded scheduler.

## Where it gets tricky

**No checker, no result.** Faults on their own only find crashes and
hangs. The bugs that matter, lost writes and stale reads, only show up when
something compares what clients saw with what the system promised.

**A pass proves little.** A clean run means those faults, at those moments,
didn't break it. It says nothing about the next schedule. Record the fault
schedule and the history for every run so failures can be studied.

**Tools disagree about what they cover.** The 2018 partition study said
Jepsen couldn't do every kind of partition. Jepsen's current code has
bridge and ring-shaped partial partitions; built-in one-way partitions
weren't there when this was written, though you can script one.

**Faults can miss their target.** Toxiproxy on `localhost` won't see a
MySQL client that quietly uses the Unix socket. `netem` on the wrong side
of a TCP connection can give misleading timing. Always check that the fault
actually landed.

**Test versus production.** Everything above is for test clusters. Jepsen's
own README warns not to point it at production machines. Injecting faults
into production on purpose, in a controlled way, is
[[chaos-engineering]], a different practice with different safety rules.

**It's related to fuzzing, but not the same.** [[fuzzing|Fuzzing]] feeds
strange inputs to a program. Fault injection keeps the inputs normal and
makes the environment strange. They combine well: generate random
workloads and random faults together.

## What this means when you build

- Write down what should happen before each run: which setups should stay
  correct under which faults. Then run and compare.
- Record every operation with its start, end and result, and mark timeouts
  as unknown.
- Start with the faults that catch the most: isolate one node, kill a node,
  pause a node. Then partial and one-way partitions, then slow networks,
  then clocks.
- Three nodes are enough for most bugs. Keep the cluster small so you can
  run it many times.
- Plant a known bug, like reading from a follower without checking, and
  make sure the harness catches it before trusting a pass.
- Test error handlers directly. In one study, handlers that ignored an
  error, or only logged it, caused a quarter of the catastrophic failures.

## Further reading

- [Jepsen](https://github.com/jepsen-io/jepsen), Kyle Kingsbury and contributors. The README's design, the nemesis tutorial, and the fault code: partitions with iptables, network faults with netem, pauses with SIGSTOP, clock and file faults.
- [An Analysis of Network-Partitioning Failures in Cloud Systems](https://www.usenix.org/system/files/osdi18-alquraan.pdf), Ahmed Alquraan and others, OSDI 2018. Why partition bugs are common, how few nodes and events they need, and why mocks miss them.
- [Simple Testing Can Prevent Most Critical Failures](https://www.usenix.org/system/files/conference/osdi14/osdi14-paper-yuan.pdf), Ding Yuan and others, OSDI 2014. Catastrophic failures come from bad error handling, and simple tests would have caught many.
- [tc-netem(8)](https://man7.org/linux/man-pages/man8/tc-netem.8.html), iproute2. Every network impairment netem can add, and its limits.
- [Toxiproxy](https://github.com/Shopify/toxiproxy), Shopify, v2.12.0. A TCP proxy for injecting network faults in tests and CI.
- [signal(7)](https://man7.org/linux/man-pages/man7/signal.7.html), Linux man-pages. What SIGSTOP, SIGCONT and SIGKILL do, and the EINTR detail after a stop.
