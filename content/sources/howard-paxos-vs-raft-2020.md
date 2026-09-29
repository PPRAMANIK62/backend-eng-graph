---
id: howard-paxos-vs-raft-2020
title: "Paxos vs Raft: Have we reached consensus on distributed consensus?"
author: Heidi Howard, Richard Mortier
url: https://arxiv.org/abs/2004.05074
kind: paper
primary: false
---

## Summary

Rewrites a simplified Multi-Paxos in Raft's terms (terms, RequestVote,
AppendEntries) and compares the two side by side (PaPoC 2020, arXiv
v2). The finding: they're the same approach and differ only in leader
election. Not primary for either algorithm; Howard is a Paxos researcher.

## Key claims

- The two differ only in how they elect a leader. "We find that both Paxos and Raft take a very similar approach to distributed consensus, differing only in their approach to leader election." (abstract)
- Raft elects only up-to-date servers; Paxos lets any server lead and then brings its log up to date. "Raft only allows servers with up-to-date logs to become leaders, whereas Paxos allows any server to be leader provided it then updates its log to ensure it is up-to-date." (abstract)
- Most of Raft's understandability is presentation. "We surmise that much of the understandability of Raft comes from the paper’s clear presentation rather than being fundamental to the underlying algorithm being presented." (abstract)
- Paxos is a family more than one algorithm, and descriptions vary. "Paxos is often regarded not as a single algorithm but as a family of algorithms for solving distributed consensus." (1)
- Raft decides entries in order; Paxos typically allows out-of-order decisions and needs a gap-filling protocol. "Raft decides log entries in-order whereas Paxos typically allows out-of-order decisions but requires an extra protocol for filling the log gaps which can occur as a result." (1)
- Production systems are split between the two. "production systems today are divided between those which use Paxos" (1)
- In their Paxos, a candidate takes the next term t with t mod n equal to its id, and voters send back their log entries after the candidate's commit index. (3.3)
- Paxos re-stamps old uncommitted entries with the new leader's term; Raft keeps each entry's original term. "Log entries from previous terms are added to the leader’s log with the leader’s term." (Table 1)
- In Paxos, an entry present on a majority is committed; Raft also requires an entry from the current term first. "Paxos makes it safe to commit a log entry if it is present on a majority of servers; but this is not the case for Raft" (4)
- Raft's election is lighter, because votes don't carry log entries. "Raft’s approach is surprisingly efficient given its simplicity as, unlike Paxos, it does not require log entries to be exchanged during leader election." (abstract)
- Simultaneous candidates: in Paxos the higher term wins; in Raft votes can split, so Raft adds a random wait. "In Paxos, if multiple servers become candidates simultaneously, the candidate with the higher term will win the election." (4)
- Names for the same things: terms are also ballots, proposal numbers, views; RequestVote is phase 1 (prepare/promise), AppendEntries is phase 2 (accept). "Terms are also referred to as views, ballot numbers [35], proposal numbers [17], round numbers or sequence numbers [7]." (5)
- Their overall view on understandability. "we find that the two algorithms are not significantly different in understandability" (6)
- Only two algorithms dominate production. "Though many distributed consensus algorithms have been proposed, just two dominate production systems: Paxos, the traditional, famously subtle, algorithm; and Raft" (Abstract)
- Split votes: Raft candidates can tie in the same term; Paxos gives each server its own terms. "In Raft, if multiple servers become candidates simultaneously, they may split the votes as they will have the same term, and so neither will win the election." (4)
- So Raft elections are expected to be slower with more variance. "We thus expect that Raft will be both slower and have higher variance in the time taken to elect a leader." (4)
- But Raft's election sends no log entries. "Raft only allows a candidate with an up-to-date log to become a leader and thus need not send log entries during leader election." (4)
- Paxos re-terms old entries; Raft keeps each entry's term forever, at the price of the rule that only current-term entries commit by counting. (4, Table 1)

## Visuals worth redrawing

- Figure 2: three servers' logs through three Paxos elections, showing
  entries re-stamped with new terms.
- Table 1: the three differences side by side.
- Table 1: three differences between Paxos and Raft, side by side.

## My notes

- They assume reliable, in-order messages (TCP) for simplicity; real
  Paxos doesn't need that.
