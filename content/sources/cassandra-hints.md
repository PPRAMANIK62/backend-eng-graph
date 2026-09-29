---
id: cassandra-hints
title: "Hints (Apache Cassandra operating docs)"
author: Apache Cassandra project
url: https://cassandra.apache.org/doc/latest/cassandra/managing/operating/hints.html
kind: docs
primary: true
---

## Summary

How Cassandra 5.0 handles a write when a replica is down: the
coordinator keeps a hint on its own disk and replays it when the replica
comes back, within a window. Hints are one of three repair paths next to
read repair and anti-entropy repair, and the page is clear that they are
best effort.

## Key claims

- A coordinator stores a hint for a replica that can't take the write. "When replica nodes are unavailable to accept a mutation, either due to failure or more commonly routine maintenance, coordinators attempting to write to those replicas store temporary hints on their local filesystem for later application to the unavailable replica." (Hints)
- Hints are best effort. "Hints are best effort, however, and do not guarantee eventual consistency like anti-entropy repair does." (Hints)
- Hints are kept for a window of downtime, 3 hours by default. "New hints will be retained for up to max_hint_windowin_ms of downtime (defaults to 3 h)." (Hinted Handoff)
- The client already has its quorum ack while one replica is missing the write. "(t1): The client receives a quorum acknowledgement from the coordinator." (Hinted Handoff in Action)
- The hint is written after the write timeout. "After the write timeout (default 2s), the coordinator decides that replica_2 is unavailable and stores a hint to its local disk." (Hinted Handoff in Action)
- A replica that comes back too late stays out of sync until repair. "If the node does not return in time, the destination replica will be permanently out of sync until either read-repair or full/incremental anti-entropy repair propagates the mutation." (Hinted Handoff)
- Replaying a hint can't overwrite newer data because it keeps its original timestamp. "Since hints contain the original unmodified mutation timestamp, hint application is idempotent and cannot overwrite a future mutation." (Storage of Hints on Disk)

## Visuals worth redrawing

- The t0 to t4 timeline of hinted handoff (Hinted Handoff in Action).

## My notes

- The page spells the setting `max_hint_windowin_ms`; the article gives
  only the 3-hour default, not the setting name.
