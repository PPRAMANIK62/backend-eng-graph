---
id: gray-lamport-consensus-commit-2006
title: Consensus on Transaction Commit
author: Jim Gray and Leslie Lamport
url: https://lamport.azurewebsites.net/video/consensus-on-transaction-commit.pdf
kind: paper
primary: true
---

## Summary

The paper that states the transaction commit problem precisely, walks
through classic two-phase commit, shows why it blocks when the
coordinator fails, and replaces the coordinator with Paxos (Paxos
Commit). Published in ACM TODS in 2006 (MSR-TR-2003-96); the version
read is Lamport's copy, revised in 2017 to fix one minor error.

## Key claims

- The commit problem is agreement on commit or abort. "The distributed transaction commit problem requires reaching agreement on whether a transaction is committed or aborted." (Abstract)
- Two-phase commit blocks if the coordinator fails. "The classic Two-Phase Commit protocol blocks if the coordinator fails." (Abstract)
- A transaction commits only if every participant is willing. "The transaction can be committed only if all sites are willing to commit it." (1)
- The coordinator's failure leaves everyone not knowing. "The failure of that coordinator can cause the protocol to block, with no process knowing the outcome, until the coordinator is repaired." (1)
- The participants are called resource managers (RMs). "a transaction is performed by a collection of processes called resource managers (RMs), each executing on a different node." (2)
- A participant in the working state may abort on its own. "Prior to the commit request, any RM may spontaneously decide to abort its part of the transaction." (2)
- Safety: nobody commits while someone else aborts. "It is impossible for one RM to be in the committed state and another to be in the aborted state." (2, Consistency)
- Committing requires everyone to have prepared first. "An RM can enter the committed state only after all RMs have been in the prepared state." (2)
- FLP rules out guaranteed progress, so they require progress only under timeliness assumptions. "a deterministic, purely asynchronous algorithm cannot satisfy the stability and consistency conditions and still guarantee progress in the presence of even a single fault." (2)
- The coordinator is called the transaction manager (TM). "The Two-Phase Commit protocol is an implementation of transaction commit that uses a transaction manager (TM) process to coordinate the decision-making procedure." (3.1)
- The TM commits only after a Prepared message from every RM. "When it has received a Prepared message from all RMs, the TM can enter the committed state and send Commit messages to all the other processes." (3.1)
- In practice a timeout triggers the spontaneous abort. "In an implementation, spontaneous aborting can be triggered by a timeout." (3.1)
- Each process writes its state to stable storage before sending a message in that state, so restart is easy. "Each process records its current state in stable storage before sending any message while in that state." (3.1)
- Normal-case cost: four message delays and 3N − 1 messages. "in the normal case, the RMs learn that the transaction has been committed after four message delays." (3.2)
- With the TM on the initiating RM's node, three message delays. "leaving 3N − 3 messages and three message delays." (3.2)
- Stable-storage writes on the critical path, reducible to two. "This can be reduced to two write delays by having all RMs prepare concurrently." (3.2)
- A missing Prepared makes the TM abort; a TM failure after all prepared blocks. "if the TM fails right after every RM has sent a Prepared message, then the other RMs have no way of knowing whether the TM committed or aborted the transaction." (3.3)
- Three-phase commit attempts lack complete proven algorithms. "However, we know of none that provides a complete algorithm proven to satisfy a clearly stated correctness condition." (3.3)
- Consensus needs 2F + 1 acceptors to survive F failures. "without strict synchrony assumptions, 2F + 1 acceptors are needed to achieve consensus despite the failure of any F of them." (4.1)
- Paxos Commit tolerates coordinator failures. "The Paxos Commit algorithm runs a Paxos consensus algorithm on the commit/abort decision of each participant to obtain a transaction commit protocol that uses 2F + 1 coordinators and makes progress if at least F +1 of them are working properly." (Abstract)
- Paxos Commit runs one Paxos instance per RM on its prepared/aborted vote. "there is one instance of the consensus algorithm for each RM." (4.2)
- Same stable-storage delays as 2PC. "Both algorithms have the same three stable storage write delays (two if all RMs prepare concurrently)." (5)
- Message counts for 5 RMs and F = 1. "for a transaction with 5 RMs, the Two-Phase Commit uses 12 messages, regular Paxos Commit uses 17, and Faster Paxos Commit uses 20 (with co-location)." (5)
- 2PC is Paxos Commit with one acceptor. "The Two-Phase Commit protocol is thus the degenerate case of the Paxos Commit algorithm with a single acceptor." (5)

## Visuals worth redrawing

- Figure 1 (2): the RM state machine, working to prepared to committed,
  or to aborted.
- Figure 2 (3.1): the message flow of two-phase commit in the normal
  case.

## My notes

- The paper's TM/RM names are the X/Open XA names. Most other sources
  say coordinator and participant.
