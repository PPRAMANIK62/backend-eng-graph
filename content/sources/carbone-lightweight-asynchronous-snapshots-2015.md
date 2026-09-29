---
id: carbone-lightweight-asynchronous-snapshots-2015
title: Lightweight Asynchronous Snapshots for Distributed Dataflows
author: Paris Carbone, Gyula Fóra, Stephan Ewen, Seif Haridi, Kostas Tzoumas
url: https://arxiv.org/pdf/1506.08603
kind: paper
primary: true
---

## Summary

The 2015 paper that describes Asynchronous Barrier Snapshotting (ABS),
the algorithm behind Flink's checkpoints. Barriers injected at the
sources emulate the stages of a batch job, so on acyclic graphs a
snapshot needs only operator state, not the records in flight.

## Key claims

- Two problems with earlier snapshots. "First, they often stall the overall computation which impacts ingestion. Second, they eagerly persist all records in transit along with the operation states which results in larger snapshots than required." (Abstract)
- ABS stores only operator state on acyclic graphs. "ABS persists only operator states on acyclic execution topologies while keeping a minimal record log on cyclic dataflows." (Abstract)
- Naiad's synchronous approach stops everything. "first halting the overall computation of the execution graph, then performing the snapshot and finally instructing each task to continue its operation once the global snapshot is complete." (2 Related Work)
- Chandy-Lamport-style snapshots need upstream backup. "This approach though still suffers from additional space requirements due to the need of an upstream backup and as a result higher recovery times caused by the reprocessing of backup records." (2 Related Work)
- Barriers emulate stages. "In our approach, stages are emulated in a continuous dataflow execution by special barrier markers injected in the input data streams periodically that are pushed throughout the whole execution graph down to the sinks." (4.2)
- Channels must be FIFO and blockable. "Network channels are quasi-reliable, respect a FIFO delivery order and can be blocked and unblocked." (4.2)
- Synchronous snapshots pause in bursts, in their setup (Flink, EC2 m3.medium instances, 1 billion records, 3 shuffles). "since it operates in bursts (of 1-2 sec in our experiments)" (7.2 Results)

## Visuals worth redrawing

- Figure 2: ABS on an acyclic graph, barriers and alignment step by step.

## My notes

- Evaluation compares against Naiad's synchronous algorithm reimplemented on Flink, on a 10-node cluster, and scalability from 5 to 40 nodes.
