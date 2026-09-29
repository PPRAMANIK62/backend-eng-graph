---
id: lamport-time-clocks-1978
title: Time, Clocks, and the Ordering of Events in a Distributed System
author: Leslie Lamport
url: https://lamport.azurewebsites.net/pubs/time-clocks.pdf
kind: paper
primary: true
---

## Summary

The 1978 paper (Communications of the ACM 21(7)) that defines
"happened before" for a distributed system, gives the logical clock
rules that respect it, turns them into a total order with a tie-break,
and uses that order for mutual exclusion and a replicated state
machine. It also shows where logical clocks fall short: causes that
travel outside the system.

## Key claims

- A system is distributed when message delay matters. "A system is distributed if the message transmission delay is not negligible compared to the time between events in a single process." (Introduction)
- Sometimes neither event came first. "In a distributed system, it is sometimes impossible to say that one of two events occurred first." (Introduction)
- Happened-before is defined without physical clocks: same-process order, send before receive, and transitivity. "We will therefore define the "happened before" relation without using physical clocks." (The Partial Ordering)
- Concurrent means neither could affect the other. "Two events are concurrent if neither can causally affect the other." (The Partial Ordering)
- The clock condition goes one way only. "Note that we cannot expect the converse condition to hold as well, since that would imply that any two concurrent events must occur at the same time." (Logical Clocks)
- Rule IR1: tick between events. "increments Ci between any two successive events." (Logical Clocks)
- Rule IR2: messages carry the sender's clock, and the receiver moves its clock past it. "sets Ci greater than or equal to its present value and greater than" (Logical Clocks, IR2(b))
- Ties are broken by an arbitrary order of processes, which gives a total order. "To break ties, we use any arbitrary total ordering < of the processes." (Ordering the Events Totally)
- Only the partial order is fixed by what happened; the total order is one of many. "It is only the partial ordering which is uniquely determined by the system of events." (Ordering the Events Totally)
- Every process running the same commands in timestamp order gives a replicated state machine. "Synchronization is achieved because all processes order the commands according to their timestamps" (Ordering the Events Totally)
- The anomaly: a cause that travels outside the system (a phone call) isn't seen. "It is quite possible for request B to receive a lower timestamp and be ordered before request A." (Anomalous Behavior)
- Failure only makes sense with physical time. "Without physical time, there is no way to distinguish a failed process from one which is just pausing between events." (Ordering the Events Totally)
- The mutual exclusion algorithm has no central coordinator. "This is a distributed algorithm. Each process independently follows these rules, and there is no central synchronizing process or central storage." (Ordering the Events Totally)
- Same order of commands everywhere means the same state machine everywhere. "each process uses the same sequence of commands." (Ordering the Events Totally)
- One fix for the anomaly: the user carries the timestamp. "When issuing request B, his friend could specify that B be given a timestamp later than TA." (Anomalous Behavior)
- The phone-call setup. "Suppose a person issues a request A on a computer A, and then telephones a friend in another city to have him issue a request B on a different computer B." (Anomalous Behavior)

## Visuals worth redrawing

- Figures 1 to 3: space-time diagrams with process lines, message
  arrows and tick lines. Redrawn as a three-process diagram with
  counter values in lamport-clocks.

## My notes

- The PDF is a scan; the text layer has OCR errors, so quotes are kept
  to clean stretches.
- The paper's second half synchronises physical clocks and derives a
  bound. Not used by the lamport-clocks node.
