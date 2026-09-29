---
id: chandy-distributed-snapshots-1985
title: "Distributed Snapshots: Determining Global States of Distributed Systems"
author: K. Mani Chandy, Leslie Lamport
url: https://lamport.azurewebsites.net/pubs/chandy.pdf
kind: paper
primary: true
---

## Summary

The 1985 ACM TOCS paper that defines a consistent global state and gives
the marker algorithm for recording one while the system keeps running.
Processes record their own state; markers sent on each channel tell the
receiver when to record and which in-flight messages belong to the
channel's state.

## Key claims

- A process can only record what it sees itself. "A process can record its own state and the messages it sends and receives; it can record nothing else." (1 Introduction)
- The algorithm must not stop or change the computation. "The global-state-detection algorithm is to be superimposed on the underlying computation: it must run concurrently with, but not alter, this underlying computation." (1 Introduction)
- The photographers analogy: you can't freeze the scene. "they cannot get all the birds in the heavens to remain motionless while the photographs are taken." (1 Introduction)
- Channels are error-free and FIFO. "Channels are assumed to have infinite buffers, to be error-free, and to deliver messages in the order sent." (2 Model of a Distributed System)
- Recording at the wrong moments counts one token twice. "The composite global state recorded in this fashion would show two tokens in the system, one in p and the other in c." (3.1 Motivation, Example 3.1)
- A marker is a special message that doesn't affect the computation. "The marker has no effect on the underlying computation." (3.1)
- Marker-sending rule. "p sends one marker along c after p records its state and before p sends further messages along c." (3.2)
- Marker-receiving rule, when the receiver has already recorded. "q records the state of c as the sequence of messages received along c after q’s state was recorded and before q received the marker along c." (3.2 Global-state-detection algorithm outline)
- The recorded state may never have existed at one instant. "Of what use is the algorithm if the recorded global state never occurred?" (4 Properties of the recorded global state) The answer (Theorem 1): the recorded state is reachable from the state where recording started, and the state where it ended is reachable from it.
- Useful for checkpoints. "Global state detection can also be used for checkpointing." (Abstract)
- Any process can start by recording its state on its own. "The algorithm can be initiated by one or more processes, each of which records its state spontaneously, without receiving markers from other processes" (3.3 Termination)
- Markers spread along paths, so every reachable process records. "Hence if p records its state and there is a path (in the graph representing the system) from p to a process q, then" q records its state in finite time. (3.3 Termination)

## Visuals worth redrawing

- The single-token system (Figures 2 to 4) and the recorded state for Example 2.2 (Figure 8).

## My notes

- The PDF is a scan; the text layer has OCR errors, so quotes were checked against it only where the text came through cleanly.
