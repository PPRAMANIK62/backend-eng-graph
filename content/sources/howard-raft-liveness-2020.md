---
id: howard-raft-liveness-2020
title: Raft does not Guarantee Liveness in the face of Network Faults
author: Heidi Howard and Ittai Abraham
url: https://decentralizedthoughts.github.io/2020-12-12-raft-liveness-full-omission/
kind: blog
primary: false
---

## Summary

A short post (Decentralized Thoughts, 2020) written after Cloudflare's
etcd outage. With partial network faults, plain Raft can keep deposing
its leader forever; Pre-Vote fixes that but adds a new stuck case where an
isolated leader never steps down; Pre-Vote plus CheckQuorum together give
liveness as long as some server is connected to a majority.

## Key claims

- The paper's claim implies Raft tolerates link failures that leave a majority connected. "This statement implies that consensus algorithms such as Raft should tolerate network failures (also known as omission faults) as long as they do not impact communication between the majority of servers." (intro)
- Plain Raft doesn't. "Unfortunately, Raft, as described in the original paper, does not guarantee liveness in all such cases." (Does Raft guarantee liveness...)
- Example: five servers, 1-2-3 connected, 4 only sees 2, 5 only sees 3; 4 or 5 keeps timing out and raising the term. "This system will not be able to establish a stable leader." (Does Raft guarantee liveness...)
- Pre-Vote: a trial election before bumping the term; a server only pre-votes if it hasn't heard from a leader within the election timeout. "PreVote requires potential candidates to run a trial election to test if they can win an election before incrementing their term" (fix)
- Pre-Vote creates a new problem: a leader that lost its majority but still reaches one follower keeps that follower from pre-voting for anyone else. "In fact, PreVote introduces new liveness issues to Raft." (So, does Raft with PreVote...)
- CheckQuorum fixes that: the leader steps down without majority responses. "This can be addressed by requiring leaders to actively step down if they do not receive AppendEntries responses from a majority of servers." (So, does Raft with PreVote...)
- Together they give liveness. "Does Raft with PreVote and CheckQuorum guarantee liveness? Yes." (last section)

## Visuals worth redrawing

- The two five-server partial-partition diagrams.

## My notes

- Mentions the alternative fix from the paper's section 6 (ignore
  RequestVote within the election timeout of hearing from a leader).
