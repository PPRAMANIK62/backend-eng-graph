---
id: etcd-raft-config
title: "etcd-io/raft: raft.go (Config and election code)"
author: etcd authors
url: https://github.com/etcd-io/raft/blob/main/raft.go
kind: code
primary: true
---

## Summary

The main source file of the etcd Raft library, read from the main branch
when this was written. The `Config` struct's comments document the
election and read options (ElectionTick, HeartbeatTick, CheckQuorum,
PreVote, ReadOnlyOption), and the code shows how the randomized election
timeout is picked and how ReadIndex requests wait for a current-term
commit.

## Key claims

- ElectionTick is in ticks, must exceed HeartbeatTick, and 10 times is suggested. "We suggest ElectionTick = 10 * HeartbeatTick to avoid unnecessary leader switching." (Config.ElectionTick)
- The randomized timeout is between one and two election timeouts. "randomized election timeout in [electiontimeout, 2 * electiontimeout - 1]." (pastElectionTimeout comment)
- CheckQuorum: the leader steps down if a quorum hasn't been active for an election timeout. "Leader steps down when quorum is not active for an electionTimeout." (Config.CheckQuorum)
- PreVote is the thesis section 9.6 algorithm. "PreVote enables the Pre-Vote algorithm described in raft thesis section 9.6." (Config.PreVote)
- PreVote prevents disruption from a rejoining partitioned node. "This prevents disruption when a node that has been partitioned away rejoins the cluster." (Config.PreVote)
- A separate pre-candidate state exists. `StatePreCandidate` (StateType constants)
- ReadOnlySafe talks to the quorum and is the default. "ReadOnlySafe guarantees the linearizability of the read only request by communicating with the quorum. It is the default and suggested option." (ReadOnlyOption)
- ReadOnlyLeaseBased relies on a leader lease and clock drift. "ReadOnlyLeaseBased ensures linearizability of the read only request by relying on the leader lease. It can be affected by clock drift." (Config.ReadOnlyOption)
- Unbounded clock drift makes lease reads unsafe. "If the clock drift is unbounded, leader might keep the lease longer than it should (clock can move backward/pause without any bound)." (Config.ReadOnlyOption)
- Lease reads require CheckQuorum. "CheckQuorum MUST be enabled if ReadOnlyOption is ReadOnlyLeaseBased." (Config.ReadOnlyOption)
- MaxInflightBytes bounds the bandwidth-delay product; e.g. 1 MB with 100 ms RTT caps a group at 10 MB/s. "with a peer that has a round-trip latency of 100ms to the leader and this setting is set to 1 MB, there is a throughput limit of 10 MB/s for this group." (Config.MaxInflightBytes)
- A new leader appends an empty entry at its term. "appending single empty entries to the log always succeeds, used both for replicating a new leader's initial empty entry, and for auto-leaving joint configurations." (increaseUncommittedSize)
- ReadIndex requests arriving before the leader has committed an entry in its term are held back. `if !r.committedEntryInCurrentTerm() { r.pendingReadIndexMessages = append(...) }` (stepLeader, MsgReadIndex)
- Joint configurations are supported (EnterJoint, LeaveJoint). "cannot leave a joint config unless in a joint config" (Config.DisableConfChangeValidation)
- StepDownOnRemoval: the leader steps down when removed or demoted to a learner, planned to become unconditional. "StepDownOnRemoval makes the leader step down when it is removed from the group or demoted to a learner." (Config.StepDownOnRemoval)

## Visuals worth redrawing

None.

## My notes

- The pending-read-index check is the code form of step 1 of ReadIndex in
  the dissertation (commit a no-op first).
