---
id: lamport-paxos-simple-2001
title: Paxos Made Simple
author: Leslie Lamport
url: https://lamport.azurewebsites.net/pubs/paxos-simple.pdf
kind: paper
primary: true
---

## Summary

Lamport's own plain-English retelling of Paxos, written because the
original paper (The Part-Time Parliament, 1998) was found hard to read.
Section 2 derives single-value Paxos step by step from what consensus
must guarantee. Section 3 shows how a sequence of Paxos instances with a
stable leader runs a replicated state machine (Multi-Paxos).

## Key claims

- Consensus has three safety rules: only a proposed value is chosen, only one is chosen, and nobody learns a value that wasn't chosen. "Only a single value is chosen, and" (2.1)
- Three roles: proposers, acceptors, learners; one process may play several. "proposers, acceptors, and learners" (2.1)
- The model is asynchronous and non-Byzantine: agents may stop and restart, messages may be lost, delayed or duplicated but not corrupted. "Messages can take arbitrarily long to be delivered, can be duplicated, and can be lost, but they are not corrupted." (2.1)
- A single acceptor is simple but its failure stops everything. "the failure of the acceptor makes any further progress impossible." (2.2)
- A value is chosen when a majority of acceptors accept it; any two majorities share an acceptor. "Because any two majorities have at least one acceptor in common, this works if an acceptor can accept at most one value." (2.2)
- If each acceptor just takes the first proposal, two proposals can split the acceptors and nothing is chosen. "if each is accepted by about half the acceptors, failure of a single acceptor could make it impossible to learn which of the values was chosen." (2.2)
- Proposals carry unique, ordered numbers so acceptors can accept more than one. "a proposal consists of a proposal number and a value." (2.2)
- The key rule: once a value is chosen, every higher-numbered proposal must carry the same value. "If a proposal with value v is chosen, then every higher-numbered proposal issued by any proposer has value v ." (2.2, P2b)
- The proposer can't predict future acceptances, so it asks for a promise instead. "Instead of trying to predict the future, the proposer controls it by extracting a promise that there won’t be any such acceptances." (2.2)
- Phase 1: prepare(n) to a majority; an acceptor that hasn't answered a higher prepare promises and returns the highest proposal it accepted. (2.2, Phase 1)
- Phase 2: with promises from a majority, the proposer sends accept(n, v) where v is the value of the highest-numbered proposal reported, or any value if none. "where v is the value of the highest-numbered proposal among the responses, or is any value if the responses reported no proposals." (2.2, Phase 2)
- An acceptor accepts unless it has promised a higher number. "it accepts the proposal unless it has already responded to a prepare request having a number greater than n." (2.2, Phase 2)
- An acceptor only needs to remember two things (the highest-numbered proposal it accepted and the highest prepare it answered), and must keep them across restarts. "an acceptor must remember this information even if it fails and then restarts." (2.2)
- It writes its answer to stable storage before sending it. "An acceptor records its intended response in stable storage before actually sending the response." (2.5)
- Proposers use disjoint sets of numbers so two never share one. "Different proposers choose their numbers from disjoint sets of numbers" (2.5)
- A proposer can give up on a proposal at any time without harming correctness. "It can abandon a proposal in the middle of the protocol at any time." (2.2)
- Two proposers can keep outbidding each other forever. "It’s easy to construct a scenario in which two proposers each keep issuing a sequence of proposals with increasing numbers, none of which are ever chosen." (2.4)
- Progress needs one distinguished proposer; electing it needs randomness or timeouts (FLP), but safety never depends on the election. "However, safety is ensured regardless of the success or failure of the election." (2.4)
- Learning: acceptors can tell every learner (acceptors × learners messages) or one distinguished learner that tells the rest (fewer messages, one more round). (2.3)
- Multi-Paxos: the i-th Paxos instance chooses the i-th state machine command. "the value chosen by the i th instance being the i th state machine command in the sequence." (3)
- The leader decides where each command goes in the sequence. "Clients send commands to the leader, who decides where in the sequence each command should appear." (3)
- A new leader runs phase 1 for all unfinished and future instances at once, in one short message. "Using the same proposal number for all instances, it can do this by sending a single reasonably short message to the other servers." (3)
- Gaps in the log are filled with no-op commands so later commands can run. "a special “noop” command that leaves the state unchanged." (3)
- In steady state only phase 2 runs. "the effective cost of executing a state machine command—that is, of achieving consensus on the command/value—is the cost of executing only phase 2 of the consensus algorithm." (3)
- Two would-be leaders can stall progress but never cause disagreement. "safety is preserved—two different servers will never disagree on the value chosen as the i th state machine command." (3)
- Membership can change through the state machine itself. "The current set of servers can be made part of the state and can be changed with ordinary state-machine commands." (3)
- A central server can be described as a deterministic state machine that runs commands in sequence. "The server can be described as a deterministic state machine that performs client commands in some sequence." (3)
- Example: a bank, where a withdrawal only succeeds if the balance is big enough. "A withdrawal would be performed by executing a state machine command that decreases an account’s balance if and only if the balance is greater than the amount withdrawn" (3)
- Many servers running the same deterministic machine on the same commands give the same states and outputs. "Because the state machine is deterministic, all the servers will produce the same sequences of states and outputs if they all execute the same sequence of commands." (3)
- So a client can use the answer from any server. "A client issuing a command can then use the output generated for it by any server." (3)
- Lamport calls it simple. "In fact, it is among the simplest and most obvious of distributed algorithms." (1)
- The original presentation is The Part-Time Parliament, ACM TOCS 16(2), 1998. (references, [5])
- The plain-English claim is the abstract. "The Paxos algorithm, when presented in plain English, is very simple." (abstract)
- Phase 2 is as cheap as agreement can get. "It can be shown that phase 2 of the Paxos consensus algorithm has the minimum possible cost of any algorithm for reaching agreement in the presence of faults [2]." (3)
- In phase 1 of Multi-Paxos, an acceptor has more than "OK" to say only for slots where it already got a phase 2 message. "In phase 1, an acceptor responds with more than a simple OK only if it has already received a phase 2 message from some proposer." (3)
- A proposer stores only the highest number it has tried. "Each proposer remembers (in stable storage) the highest-numbered proposal it has tried to issue" (2.5)
- FLP means electing the proposer needs randomness or timeouts. "a reliable algorithm for electing a proposer must use either randomness or real time—for example, by using timeouts." (2.4)
- The leader can run ahead, leaving gaps if it fails. "The leader can propose command 142 before it learns that its proposed command 141 has been chosen." (3)

## Visuals worth redrawing

- None in the paper. The 135 to 140 gap example in section 3 is worth
  drawing as a log with holes and no-ops.

## My notes

- The paper never says "Multi-Paxos"; that name comes from later papers
  (Paxos Made Live, Raft, Howard and Mortier).
