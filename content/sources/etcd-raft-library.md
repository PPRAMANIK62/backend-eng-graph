---
id: etcd-raft-library
title: etcd-io/raft README
author: etcd maintainers
url: https://github.com/etcd-io/raft
kind: code
primary: true
---

## Summary

The README of the Raft library used by etcd, Kubernetes (through etcd),
CockroachDB, TiDB and others, read on the main branch. It implements only
the Raft algorithm itself; the application supplies the network
transport, the log storage and the state machine.

## Key claims

- Raft keeps a replicated state machine in sync through a replicated log. "Raft is a protocol with which a cluster of nodes can maintain a replicated state machine." (intro)
- Used widely in production. "It powers distributed systems such as etcd, Kubernetes, Docker Swarm, Cloud Foundry Diego, CockroachDB, TiDB, Project Calico, Flannel, Hyperledger and more." (intro)
- Only the algorithm; network and disk are the user's job. "the library only implements the Raft algorithm; both network and disk IO are left to the user." (intro)
- The library itself is modelled as a deterministic state machine, so it can be tested. "In order to easily test the Raft library, its behavior should be deterministic." (intro)
- Same state and same input give the same output. "For state machines with the same state, the same state machine input should always generate the same state machine output." (intro)
- Lease-based reads depend on clocks. "this approach relies on the clock of the all the machines in raft group" (Features)
- Followers get a safe read index from the leader before serving reads. "followers asks leader to get a safe read index before processing read-only queries" (Features)
- Optional enhancements include pipelining, flow control, batching and parallel leader disk writes. "Optimistic pipelining to reduce log replication latency" (Features)
- Leader steps down when it loses quorum. "Automatic stepping down when the leader loses quorum" (Features)
- The application loop order: persist entries, HardState and snapshot first, then send messages, then apply committed entries. "Write Entries, HardState and Snapshot to persistent storage in order, i.e. Entries first, then HardState and Snapshot if they are not empty." (Usage, step 1)
- Don't send messages before the HardState and earlier entries are on disk. "It is important that no messages be sent until the latest HardState has been persisted to disk, and all Entries written by any previous Ready batch" (Usage, step 2)
- A proposal isn't guaranteed to commit; it may need to be proposed again. "There is no guarantee that a proposed command will be committed; the command may have to be reproposed after a timeout." (Usage)
- Node IDs must never be reused, so IP addresses make poor IDs. "A given ID MUST be used only once even if the old node has been removed." (Usage)
- Membership changes take effect when applied, not when appended, and only one at a time. "in our implementation the membership change takes effect when its entry is applied, not when it is added to the log (so the entry is committed under the old membership instead of the new)." (Implementation notes)
- A new change is refused while any uncommitted change is in the leader's log. "any proposed membership change is simply disallowed while any uncommitted change appears in the leader's log." (Implementation notes)
- Removing a member from a two-member cluster can get stuck; use three or more nodes. "For this reason it is highly recommended to use three or more nodes in every cluster." (Implementation notes)
- Example config: ElectionTick 10, HeartbeatTick 1, MaxInflightMsgs 256. (Usage code)
- Leadership transfer is implemented. The feature list includes "Leadership transfer extension" (Features)

## Visuals worth redrawing

None.

## My notes

- The raw README was read at raw.githubusercontent.com (main branch).
- The README describes single-node membership changes, but raft.go
  (etcd-raft-config) also has joint configurations (EnterJoint,
  LeaveJoint). The README text looks older than the code.
