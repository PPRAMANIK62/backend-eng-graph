---
id: ongaro-consensus-thesis-2014
title: "Consensus: Bridging Theory and Practice (PhD dissertation)"
author: Diego Ongaro
url: https://web.stanford.edu/~ouster/cgi-bin/papers/OngaroPhD.pdf
kind: paper
primary: true
---

## Summary

Diego Ongaro's Stanford dissertation (2014), the long form of the Raft
paper. Read for this project: chapter 3 sections 3.8 to 3.10 (persisted
state, timing, leadership transfer), chapter 4 (membership changes,
single-server and joint consensus), chapter 5 sections 5.1 to 5.2
(snapshots), chapter 6 sections 6.2 to 6.4 (routing, linearizable
semantics, read-only queries, leases), section 9.6 (Pre-Vote) and
section 10.2 (writing to disk in parallel, batching, pipelining). The
errata in the dissertation's GitHub README flag a bug in chapter 4's
single-server changes (see ongaro-raft-dev-membership-bug-2015).

## Key claims

- Each server persists its current term and vote, and persists new entries before they count toward commitment. "each server persists its current term and vote; this is necessary to prevent the server from voting twice in the same term" (3.8)
- The commit index can be lost on restart and rebuilt. "The most interesting example is the commit index, which can safely be reinitialized to zero on a restart." (3.8)
- A server that loses its persistent state can't rejoin under the same identity. "If a server loses any of its persistent state, it cannot safely rejoin the cluster with its prior identity." (3.8)
- Leadership transfer: the old leader catches the target up, then sends TimeoutNow so it starts an election at once. "The prior leader sends a TimeoutNow request to the target server." (3.10)
- Single-server changes: only one server added or removed at a time. "Thus, Raft restricts the types of changes that are allowed: only one server can be added or removed from the cluster at a time." (4.1)
- Adding or removing one server keeps every old majority overlapping every new majority. "When adding a single server to a cluster or removing a single server from a cluster, any majority of the old cluster overlaps with any majority of the new cluster" (4.1)
- The new configuration takes effect as soon as it's in a server's log. "The new configuration takes effect on each server as soon as it is added to that server's log" (4.1) [curly apostrophe in the pdf]
- The change is complete when Cnew commits; only then may the next change start. "The configuration change is complete once the Cnew entry is committed." (4.1)
- A configuration entry can be removed after a leader change, so servers must fall back. "a server must be prepared to fall back to the previous configuration in its log." (4.1)
- Adding an empty server can cost availability: a 3-server cluster plus an empty fourth can't commit if one original fails. "if a fourth server with an empty log is added to the same cluster and one of the original three servers fails, the cluster will be temporarily unable to commit new entries" (4.2.1)
- New servers first join as non-voting members. "a new server joins the cluster as a non-voting member." (4.2.1)
- Catch-up in rounds, e.g. 10; if the last round is shorter than an election timeout, add the server. "The algorithm waits a fixed number of rounds (such as 10). If the last round lasts less than an election timeout, then the leader adds the new server to the cluster" (4.2.1)
- The leader should abort a change to a server that is down or too slow; their first change had a port typo and was correctly aborted. "our very first configuration change request included a typo in a network port number; the system correctly aborted the change and returned an error." (4.2.1)
- Removing the leader: use leadership transfer, or have the leader step down once Cnew commits. "a leader that is removed from the configuration steps down once the Cnew entry is committed." (4.2.2)
- Removed servers disrupt the cluster with higher terms. "Without additional mechanism, servers not in Cnew can disrupt the cluster." (4.2.3)
- Pre-Vote alone doesn't fix disruptive removed servers. "Unfortunately, the Pre-Vote phase does not solve the problem of disruptive servers" (4.2.3)
- The fix: ignore RequestVote within the minimum election timeout of hearing from a leader; leadership transfer needs a flag to bypass it. "if a server receives a RequestVote request within the minimum election timeout of hearing from a current leader, it does not update its term or grant its vote." (4.2.3)
- Joint consensus was their first approach. "This was the first approach to membership changes that we came up with, and it is described only for completeness." (4.3)
- While Cnew commits, a removed leader manages a cluster without itself. "there will be a period of time (while it is committing Cnew ) when a leader can manage a cluster that does not include itself" (4.2.2)
- Joint consensus is kept only for completeness; single-server changes are recommended. "Now that we know about the simpler single-server approach, we recommend that one instead, since handling arbitrary changes requires extra complexity." (4.3)
- Joint consensus example: 3 servers to 9 needs 2 of 3 and 5 of 9. "agreement requires both 2 of the 3 servers in the old configuration and 5 of the 9 servers in the new configuration." (4.3)
- Automatically removing failed servers is dangerous. "it can be dangerous for the cluster to automatically remove failed servers, as it could then be left with too few replicas" (4.4)
- Each server compacts the committed prefix of its log on its own. "each server compacts the committed prefix of its log independently." (5)
- Raft keeps the index and term of the last discarded entry to anchor the rest of the log. "Raft retains the index and term of the last entry it discarded; this anchors the rest of the log in place after the state machine's state" (5) [curly apostrophe]
- Compaction can't wait until every follower has every entry. "It is not feasible to defer compaction until log entries have been "fully replicated" to every member in the cluster" (5) [curly quotes]
- State machines must also snapshot their client-session data. "State machines must also serialize the information they keep for providing linearizability to clients" (5.1)
- Snapshots are slow (10 GB of memory takes about a second to copy; an SSD writes about 500 MB/s), so they must run concurrently. "copying 10 GB of memory takes about one second on today's servers, and serializing it will usually take much longer" (5.1.1) [curly apostrophe]
- LogCabin snapshots concurrently with fork. "LogCabin currently uses fork, which interacts poorly with threads and C++ destructors" (5.1.3)
- Copy-on-write needs extra memory proportional to what changes during the snapshot; fork adds false sharing. "requires extra memory proportional to the fraction of the state machine state that is changed during the snapshotting process." (5.1.1)
- Snapshot when the log exceeds the previous snapshot size times an expansion factor; factor 4 means about 20% of disk bandwidth and about 6 times the state's size on disk. "Servers take a snapshot once the size of the log exceeds the size of the previous snapshot times a configurable expansion factor." (5.1.2)
- LogCabin writes a snapshot to a temp file and renames it once flushed. "LogCabin writes each snapshot to a temporary file first, then renames the file when writing is complete and has been flushed to disk" (5.1.3)
- Code that assumed a present entry meant all earlier entries were present broke once compaction existed. "the code assumed that if entry i was present in the log, entries 1 through i − 1 would also be present." (5.1.3)
- Suggests snapshotting after every entry during development to catch bugs. "We recommend taking snapshots after applying every log entry during development, since that can help catch bugs quickly." (5.1.3)
- Snapshot transfer speed usually doesn't matter, unless more failures mean the follower is needed for availability. "The performance of this transfer is usually not very important" (5.1.3)
- A streaming interface avoids holding the whole state in memory. "A streaming interface from the state machine to a file on disk is useful to avoid buffering the entire state machine state in memory" (5.1.3)
- Disk-based state machines can drop log entries once applied, but still need copy-on-write to send a consistent image. "once an entry is applied, it can be discarded from the Raft log." (5.2)
- Routing: a non-leader rejects and returns the leader's address (recommended) or proxies. (6.2)
- A leader steps down if an election timeout passes without a successful round of heartbeats to a majority (the basis of what etcd calls CheckQuorum). "a leader in Raft steps down if an election timeout elapses without a successful round of heartbeats to a majority of its cluster" (6.2)
- As described, Raft is at-least-once; duplicates need filtering. "As described so far, Raft provides at-least-once semantics for clients" (6.3)
- Sessions: client id, serial numbers, remembered responses; expiry must be deterministic. "session expiry must be deterministic, just as normal state machine operations must be." (6.3)
- Reads that bypass the log can be stale if the leader was partitioned and replaced. "If the partitioned leader responded to a read-only query without consulting the other servers, it would return stale results, which are not linearizable." (6.4)
- Stale-read bugs were found in two third-party Raft implementations. "Problems due to stale reads have already been discovered in two third-party Raft implementations [45]" (6.4)
- ReadIndex steps: wait for a current-term commit (no-op), save commit index as readIndex, heartbeat a majority, wait until applied reaches readIndex, then read. "The leader saves its current commit index in a local variable readIndex." (6.4)
- After majority acks, the leader knows no newer leader existed when it sent the heartbeats. "Once these acknowledgments are received, the leader knows that there could not have existed a leader for a greater term at the moment it sent the heartbeats." (6.4)
- One round of heartbeats can cover many queued reads. "it can use a single round of heartbeats for any number of read-only queries that it has accumulated." (6.4)
- Followers can serve reads by asking the leader for a readIndex. "the follower could issue a request to the leader that just asked for a current readIndex" (6.4)
- Lease reads: after a majority acks heartbeats, the leader assumes no new leader for about an election timeout and answers reads with no messages; relies on bounded clock drift. "The lease approach assumes a bound on clock drift across servers" (6.4.1)
- The lease runs from when the heartbeats were sent plus the election timeout divided by the clock drift bound. "it would extends its lease to start + election timeout / clock drift bound, since the followers shouldn't time out before then." (Figure 6.3 caption; the PDF text layer scrambles the fraction)
- What breaks the drift bound. "due to scheduling and garbage collection pauses, virtual machine migrations, or clock rate adjustments for time synchronization" (6.4.1)
- LogCabin doesn't implement leases. "LogCabin does not currently implement this alternative, and we do not recommend using it unless necessary to meet performance requirements." (6.4.1)
- Not recommended unless needed; broken assumptions give arbitrarily stale reads. "If the assumptions are violated, the system could return arbitrarily stale information." (6.4.1)
- Leases must expire before leadership transfer. "a leader would need to expire its lease before transferring leadership." (6.4.1)
- Clients can track the highest index seen to get monotonic progress even if clocks misbehave. "servers would include the index corresponding to the state machine state with each reply to clients." (6.4.1)
- Client interaction is a major source of bugs. "client interaction can be a major source of bugs" (6.5)
- A partitioned server that rejoins with a higher term forces the leader to step down. "a server that has been partitioned from the cluster is likely to cause a disruption when it regains connectivity." (9.6)
- Pre-Vote: only increment the term after a majority says it would vote (up-to-date log and no heartbeat from a valid leader for a baseline election timeout). "In the Pre-Vote algorithm, a candidate only increments its term if it first learns from a majority of the cluster that they would be willing to grant the candidate their votes" (9.6)
- Pre-Vote is recommended where robustness matters and doesn't appear to hurt election performance. "We recommend the Pre-Vote extension in deployments that would benefit from additional robustness." (9.6)
- The slow steps are the disk write and the network. "Typically, the most time-consuming steps are writing the new log entry to disk and replicating it across the network." (10.2)
- Disk write 100 µs on a fast SSD to 10 ms on a slow magnetic disk; network 5 µs to 400 ms RTT. "Writing to disk can take anywhere from 100 µs for a fast solid state disk to 10 ms for a slow magnetic disk" (10.2)
- The leader can write to its own disk in parallel with replication, and can even commit before its own write finishes. "The leader may even commit an entry before it has been written to its own disk, if a majority of followers have written it to their disks; this is still safe." (10.2.1)
- A naive leader flushes its own disk before sending, so two disk writes run back to back. "This results in two sequential disk writes on the path to process a request" (10.2.1)
- Pipelining is for latency under moderate load. "Pipelining, on the other hand, optimizes latency under moderate load" (10.2.2)
- Batching optimizes throughput, pipelining optimizes latency. "Thus, large batches optimize throughput and are useful when the system is under heavy load." (10.2.2)
- Pipelining: the leader advances nextIndex optimistically; the consistency check makes this safe. "The AppendEntries consistency check guarantees that pipelining is safe; in fact, the leader can safely send entries in any order." (10.2.2)
- LogCabin batches up to one megabyte per AppendEntries so heartbeats still flow. "Leaders in LogCabin send as many entries as are available between the follower's next index and the end of the log, up to one megabyte in size." (10.2.2) [curly apostrophe]
- One TCP connection per follower keeps entries in order in practice. "a leader in LogCabin uses a single TCP connection to each follower" (10.2.2)
- Why transfer: a stepping-down leader otherwise leaves the cluster idle for an election timeout. "When it steps down, the cluster will be idle for an election timeout until another server times out and wins an election." (3.10)
- Or to move leadership somewhere better. "a server with high load would not make a good leader, or in a WAN deployment, servers in a primary datacenter may be preferred in order to minimize the latency between clients and the leader." (3.10)
- Raft can't just elect the preferred server. "Raft needs a server with a sufficiently up-to-date log to" become leader, which may not be the preferred one (3.10; a page break splits the sentence)
- Step 1. "The prior leader stops accepting new client requests." (3.10)
- Step 2. "The prior leader fully updates the target server’s log to match its own, using the normal log replication mechanism described in Section 3.5." (3.10)
- TimeoutNow acts like the target's timer firing. "This request has the same effect as the target server’s election timer firing" (3.10)
- Abort after about an election timeout. "If leadership transfer does not complete after about an election timeout, the prior leader aborts the transfer and resumes accepting client requests." (3.10)
- Why it's safe. "when the target server receives a TimeoutNow request, it is equivalent to the target server’s clock jumping forwards quickly, which is safe." (3.10)
- Not implemented by the author at the time. "However, we have not currently implemented or evaluated this leadership transfer approach." (3.10)

## Visuals worth redrawing

- Figure 4.3: single-server changes keep old and new majorities overlapping (even and odd sizes).
- Figure 4.8: joint consensus timeline (same as paper Figure 11).
- Figure 5.2: snapshot replacing indexes 1 to 5 with last included index 5 and term 3.
- Figure 6.3: lease timeline, start + election timeout / clock drift bound.
- Figure 10.2: unoptimized vs optimized request pipeline (leader disk write in parallel).

## My notes

- The README errata for this dissertation (github.com/ongardie/dissertation)
  say chapter 4's single-server changes have an important bug; see the
  raft-dev post.
- Chapter 9's election numbers were not read in full; only 9.6 and the 9.7
  conclusion were read.
