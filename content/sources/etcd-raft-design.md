---
id: etcd-raft-design
title: "etcd-io/raft: design.md (Progress and flow control)"
author: etcd authors
url: https://github.com/etcd-io/raft/blob/main/design.md
kind: code
primary: true
---

## Summary

A short design note in the etcd Raft repository describing how the leader
tracks each follower (match, next) and switches a follower between three
modes: probe, replicate and snapshot. It also lists the two flow-control
limits (bytes per message, messages in flight).

## Key claims

- Per follower the leader tracks match and next. "`match` is the index of the highest known matched entry." (Progress)
- Three states. "A progress is in one of the three state: `probe`, `replicate`, `snapshot`." (Progress)
- Probe sends at most one append per heartbeat interval. "When the progress of a follower is in `probe` state, leader sends at most one `replication message` per heartbeat interval." (Progress)
- Replicate streams and moves next ahead optimistically. "leader sends `replication message`, then optimistically increases `next` to the latest entry sent." (Progress)
- A new leader starts every follower in probe. "A newly elected leader sets the progresses of all the followers to `probe` state with `match` = 0 and `next` = last index." (Progress)
- A rejection or an unreachable follower drops back to probe. "The progress will fall back to `probe` when the follower replies a rejection `msgAppResp` or the link layer reports the follower is unreachable." (Progress)
- Snapshot state when the follower is too far behind; no appends while it runs. "A progress changes from `probe` to `snapshot` when the follower falls very far behind and requires a snapshot." (Progress)
- In replicate state the number of in-flight messages is capped. "limit the # of in flight messages < N when in `replicate` state." (Flow Control)
- Flow control: cap message size and messages in flight so the transport buffer doesn't overflow. "We want to make sure raft does not overflow that buffer, which can cause message dropping and triggering a bunch of unnecessary resending repeatedly." (Flow Control)

## Visuals worth redrawing

- The probe / replicate / snapshot state diagram.

## My notes

- Matches the dissertation's pipelining description (10.2.2): optimistic
  next index, fall back on failure.
