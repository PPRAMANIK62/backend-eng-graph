---
id: jepsen-library
title: Jepsen (library source and README)
author: Kyle Kingsbury and Jepsen contributors
url: https://github.com/jepsen-io/jepsen
kind: code
primary: true
---

## Summary

The Jepsen testing library, read from the main branch when this was written:
the README's design overview, the nemesis chapter of the tutorial
(`doc/tutorial/05-nemesis.md`), and the fault code in
`jepsen/src/jepsen/nemesis.clj`, `nemesis/combined.clj`,
`nemesis/time.clj`, `net.clj` and `resources/strobe-time.c`. A Jepsen test drives a real cluster over
SSH, runs client operations while a "nemesis" injects faults, records every
operation's start and end in a history, and checks the history afterwards.

## Key claims

- It has tested a wide range of systems. "Jepsen has been used to verify everything from eventually-consistent commutative databases to linearizable coordination systems to distributed task schedulers." (README)
- What a test is. "A test is a Clojure program which uses the Jepsen library to set up a distributed system, run a bunch of operations against that system, and verify that the history of those operations makes sense." (README)
- A control node drives DB nodes over SSH. "A Jepsen test runs as a Clojure program on a *control node*. That program uses SSH to log into a bunch of *db nodes*" (README, Design Overview)
- Operations' start and end go into a history; a special nemesis process injects faults, scheduled by the generator. "While performing operations, a special *nemesis* process introduces faults into the system--also scheduled by the generator." (README, Design Overview)
- A checker analyzes the history afterwards. "Jepsen uses a *checker* to analyze the test's history for correctness" (README, Design Overview)
- Containers don't have their own clocks, so clock skew needs VMs or real machines. "Containers don't have real clocks, so you generally can't use them to test clock skew." (README, LXC)
- Tests break things on purpose. "tests may mess with clocks, add apt repos, run killall -9 on processes, and generally break things" (README)
- Don't run it against production. "you shouldn't, you know, point Jepsen at your prod machines unless you like to live dangerously" (README)
- Jepsen wraps LazyFS to lose written but unfsynced data, typically right after killing the database process. "Lazyfs allows the injection of filesystem-level faults: specifically, losing data which was written to disk but not fsynced." (jepsen/src/jepsen/lazyfs.clj, ns docstring)
- The tutorial's first nemesis splits the cluster into two random halves on start and heals on stop. "This one partitions the network into two halves, selected randomly, when it receives a `:start` op, and heals the network when it receives a `:stop`." (tutorial 05)
- A timed-out operation may or may not have happened, and the checker treats it that way. "jepsen's checkers understand that a crashed operation may or may not take place." (tutorial 05)
- The tutorial's partition test found stale reads in etcd (its v2 API, which read a replica's local state), fixed by quorum reads. "etcd allows us to read the local state of any replica, without going through consensus" (tutorial 05); "This is a case of a stale read: we saw a value from the *past*, despite more recent writes having completed." (tutorial 05)
- The combined nemesis covers clock skew, crashes, pauses and partitions. "A nemesis which combines common operations on nodes and processes: clock skew, crashes, pauses, and partitions." (nemesis/combined.clj, ns docstring)
- Partition shapes offered: isolate one node, clean majority/minority split, overlapping majorities in a ring, up to a third, isolate primaries. ":majorities-ring  Overlapping majorities in a ring" (nemesis/combined.clj, grudge)
- In a majorities ring every node sees a majority, but no two see the same one. "A grudge in which every node can see a majority, but no node sees the *same* majority as any other." (nemesis.clj, majorities-ring)
- The bridge grudge is a partial partition: two halves cut apart, one node still talking to both. "A grudge which cuts the network in half, but preserves a node in the middle which has uninterrupted bidirectional connectivity to both components." (nemesis.clj, bridge)
- A grudge maps each node to the nodes it should drop traffic from, so it is directional in principle. "returns a map of nodes to nodes they should NOT be connected to." (nemesis.clj)
- Partitions are made with iptables DROP rules on the receiving node, and healed by flushing them. (net.clj, iptables-with-dev: `iptables -A INPUT -s <src> -j DROP`, heal with `iptables -F`)
- Packet faults (delay, loss, corruption, duplication, reordering, rate) go through tc and netem. "Shared convenience call for iptables/ipfilter. Shape the network with tc qdisc, netem, and filter(s) so target nodes have given behavior." (net.clj)
- Pauses use SIGSTOP and SIGCONT. "pausing the given process name on a given node or nodes using SIGSTOP, and when `{:f :stop}` arrives, resumes it with SIGCONT." (nemesis.clj, hammer-time)
- Clock faults: disable NTP, then bump or strobe the clock with small C programs. "Uploads and compiles some C programs for messing with clocks." (nemesis/time.clj, install!)
- Strobing moves the clock forward and back by a delta every period, for a set duration. "Every period ms, adjusts the clock forward by delta ms, or, alternatively, back by delta ms." (resources/strobe-time.c, usage message)
- File faults: flip bits in or truncate files. "`:type` can be `:bitflip` or `:truncate`." (nemesis/combined.clj, file-corruption-package)

## Visuals worth redrawing

- The design overview as a diagram: control node, DB nodes, clients writing a history, nemesis, checker.

## My notes

- Alquraan et al. (2018) said Jepsen didn't support all partition types; the
  bridge and majorities-ring grudges are partial partitions, so that is at
  least partly out of date. No built-in one-way (simplex) partition was seen,
  though a hand-written grudge could express one.
