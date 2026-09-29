---
id: vanrenesse-paxos-moderately-complex-2015
title: Paxos Made Moderately Complex
author: Robbert van Renesse, Deniz Altinbuken
url: https://www.cs.cornell.edu/courses/cs7412/2011sp/paxos.pdf
kind: paper
primary: false
---

## Summary

A full description of multi-decree Paxos with pseudocode, explained
through invariants (ACM Computing Surveys 47(3), 2015; read from a
Cornell course copy). Covers ballots and slots, liveness, and the
optimizations needed in practice.

## Key claims

- Paxos is not simple even if its invariants are. "Paxos is by no means a simple protocol, even though it is based on relatively simple invariants." (abstract)
- To tolerate f crashes, Paxos needs 2f + 1 acceptors. "Thus, to tolerate f crash failures, Paxos needs at least 2 f + 1 acceptors, always leaving at least f +1 acceptors to maintain the fault-tolerant memory." (2.2)
- Ballot numbers and slot numbers are separate ideas. "Do not confuse ballot numbers and slot numbers; they are orthogonal concepts." (2.2)
- Two leaders can pre-empt each other forever. "This ping-pong scenario can be continued indefinitely, with no ballot ever succeeding in choosing a pvalue." (3)
- Crash and slowness can't be told apart by pinging in a purely asynchronous system. "In a purely asynchronous environment, it is impossible to determine through pinging or any other method whether a particular leader has crashed or is simply slow." (3)
- Fix: a leader that sees a higher ballot watches that leader instead of competing, and timeouts grow with ballot numbers so some leader eventually gets enough time. "the higher the competing ballot number, the longer a leader waits before trying to preempt it with a higher ballot number." (3)
- A node that loses power but keeps its disk is slow, not crashed. "A process that suffers from a power failure but can recover from disk is not theoretically considered crashed—it is simply slow for a while." (3)
- FLP applies to Paxos too. "The well-known “FLP impossibility result” [Fischer et al. 1985] demonstrates that in an asynchronous environment that admits crash failures, no consensus protocol can guarantee termination, and the Synod protocol is no exception." (3)

## Visuals worth redrawing

- Figure 9: two leaders and three acceptors duelling.

## My notes

- Separates roles into replicas, leaders and acceptors, unlike Paxos
  Made Simple's proposer/acceptor/learner.
