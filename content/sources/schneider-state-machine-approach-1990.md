---
id: schneider-state-machine-approach-1990
title: "Implementing Fault-Tolerant Services Using the State Machine Approach: A Tutorial"
author: Fred B. Schneider
url: https://www.cs.cornell.edu/fbs/publications/SMSurvey.pdf
kind: paper
primary: true
---

## Summary

The standard tutorial on state machine replication (ACM Computing
Surveys, 1990). A service is written as a state machine whose outputs
depend only on the sequence of requests it has processed. Run a copy on
several processors, make sure every non-faulty copy gets every request
(Agreement) and processes them in the same order (Order), and the copies
act as one fault-tolerant service. Read: introduction, sections 1 and 2,
and the start of 3.

## Key claims

- A single server is only as fault tolerant as its processor. "the resulting service can only be as fault tolerant as the processor executing that server." (Introduction)
- What makes something a state machine: outputs depend only on the request sequence. "Outputs of a state machine are completely determined by the sequence of requests it processes, independent of time and any other activity in a system." (1, Semantic Characterization of a State Machine)
- A loop that reads a changing sensor inside a command breaks this, because outputs then depend on execution speed. "would not depend solely on the requests made to the state machine but would, in addition, depend on the execution speed of the loop." (1)
- Anything structured as procedures can be structured as state machines and clients. "Anything that can be structured in terms of procedures and procedure calls can also be structured using state machines and clients" (1)
- Same starting state and same requests in the same order give the same output. "Provided each replica being run by a nonfaulty processor starts in the same initial state and executes the same requests in the same order, then each will do the same thing and produce the same output." (2)
- Byzantine processors need 2t + 1 replicas and a majority vote on outputs; fail-stop needs only t + 1. "If processors experience only fail-stop failures, then an ensemble containing t + 1 replicas suffices, and the output of the ensemble can be the output produced by any of its members." (2)
- The key requirement, Replica Coordination. "All replicas receive and process the same sequence of requests." (2)
- Split into Agreement and Order. "Every nonfaulty state machine replica receives every request." and "Every nonfaulty state machine replica processes the requests it receives in the same relative order." (2)
- Read-only requests can go to one replica when processors are fail-stop. "When processors are fail stop, a request r whose processing does not modify state variables need only be sent to a single nonfaulty state machine replica." (2)
- Order can be relaxed for requests that commute. "Second, Order can be relaxed for requests that commute." (2)

## Visuals worth redrawing

None worth redrawing; the paper's figures are code.

## My notes

- The t + 1 figure for fail-stop assumes failures are detectable
  (fail-stop in Schneider's sense). With crash failures that can't be
  told apart from slowness, agreement itself needs a majority; see
  dwork-partial-synchrony-1988 and chandra-unreliable-failure-detectors-1996.
- The paper credits Lamport (1978) for the approach.
