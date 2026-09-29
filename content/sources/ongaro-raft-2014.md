---
id: ongaro-raft-2014
title: "In Search of an Understandable Consensus Algorithm (Extended Version)"
author: Diego Ongaro, John Ousterhout
url: https://raft.github.io/raft.pdf
kind: paper
primary: true
---

## Summary

The Raft paper, extended version (USENIX ATC 2014). Raft is a
consensus algorithm for managing a replicated log, designed to be easier
to understand than Paxos. It separates leader election, log replication
and safety, and gives the leader strong control of the log.

## Key claims

- Both authors are at Stanford University (title page).

- Paxos became almost the same word as consensus. "Leslie Lamport’s Paxos protocol [15] has become almost synonymous with consensus" (3)
- Paxos is hard to understand. "The first drawback is that Paxos is exceptionally difficult to understand." (3)
- There's no agreed version of multi-Paxos; Lamport only sketched it. "he sketched possible approaches to multi-Paxos, but many details are missing." (3)
- Real systems start from Paxos and drift away from it. "As a result, practical systems bear little resemblance to Paxos." (3)
- Paxos's core is symmetric peer-to-peer, with leadership only as an optimization. "Another problem is that Paxos uses a symmetric peer-to-peer approach at its core" (3)
- The Chubby and Spanner algorithms haven't been published in detail. "The algorithms for Chubby and Spanner have not been published in detail, though both claim to be based on Paxos." (10)
- User study: 43 students at two universities, 33 answered Raft questions better than Paxos questions. "after learning both algorithms, 33 of these students were able to answer questions about Raft better than questions about Paxos." (abstract)
- In Paxos, leader election is separate from consensus and only an optimization; Raft builds it in. "in Paxos, leader election is orthogonal to the basic consensus protocol: it serves only as a performance optimization and is not required for achieving consensus." (10)
- Consensus algorithms stay available while a majority works; five servers survive two failures. "Thus, a typical cluster of five servers can tolerate the failure of any two servers." (2)
- Safety doesn't depend on timing; bad clocks and long delays only hurt availability. "faulty clocks and extreme message delays can, at worst, cause availability problems." (2)
- Steady-state cost: one round trip from the leader to half the cluster. "Raft achieves this using the minimal number of messages (a single round-trip from the leader to half the cluster)." (9.3)
- Consensus algorithms usually come up as the engine of a replicated state machine. "Consensus algorithms typically arise in the context of replicated state machines [37]." (2)
- Replicated state machines keep working when some servers are down. "state machines on a collection of servers compute identical copies of the same state and can continue operating even if some of the servers are down." (2)
- Large systems with one cluster leader (GFS, HDFS, RAMCloud) keep leader election and config in a separate replicated state machine; Chubby and ZooKeeper are examples. "Examples of replicated state machines include Chubby [2] and ZooKeeper [11]." (2)
- Same commands in the same order into a deterministic machine give the same state and outputs. "Since the state machines are deterministic, each computes the same state and the same sequence of outputs." (2)
- Keeping the log the same everywhere is the consensus algorithm's job. "Keeping the replicated log consistent is the job of the consensus algorithm." (2)
- The result looks like one reliable machine. "As a result, the servers appear to form a single, highly reliable state machine." (2)
- Safety holds under all non-Byzantine conditions: delays, partitions, loss, duplication, reordering. "They ensure safety (never returning an incorrect result) under all non-Byzantine conditions, including network delays, partitions, and packet loss, duplication, and reordering." (2)
- Servers fail by stopping and may recover from stable storage. "Servers are assumed to fail by stopping; they may later recover from state on stable storage and rejoin the cluster." (2)
- A minority of slow servers doesn't slow down the common case. "a minority of slow servers need not impact overall system performance." (2)
- Safety must not depend on timing, but availability must. "However, availability (the ability of the system to respond to clients in a timely manner) must inevitably depend on timing." (5.6)
- Raft's RPCs make the receiver write to stable storage first, which is why broadcast time depends on storage. "Raft’s RPCs typically require the recipient to persist information to stable storage" (5.6)
- The timing requirement for a steady leader. "broadcastTime ≪ electionTimeout ≪ MTBF" (5.6)
- Broadcast time 0.5 ms to 20 ms depending on storage, so election timeouts of roughly 10 ms to 500 ms. "As a result, the election timeout is likely to be somewhere between 10ms and 500ms." (5.6)
- Raft manages a replicated log and gives the same result as Multi-Paxos with a different structure. "Raft is a consensus algorithm for managing a replicated log. It produces a result equivalent to (multi-)Paxos, and it is as efficient as Paxos, but its structure is different from Paxos" (Abstract)
- The design goal was understandability, reached by decomposition and a smaller state space. "Raft separates the key elements of consensus, such as leader election, log replication, and safety, and it enforces a stronger degree of coherency to reduce the number of states that must be considered." (Abstract)
- Strong leader: entries only flow from the leader. "log entries only flow from the leader to other servers." (1)
- A command completes after one round of RPCs to a majority. "a command can complete as soon as a majority of the cluster has responded to a single round of remote procedure calls" (2)
- Raft first elects a leader and gives it full responsibility for the log. "Raft implements consensus by first electing a distinguished leader, then giving the leader complete responsibility for managing the replicated log." (5)
- Three roles. "At any given time each server is in one of three states: leader, follower, or candidate." (5.1)
- Terms are numbered with consecutive integers, each starts with an election. "Terms are numbered with consecutive integers. Each term begins with an election" (5.1)
- At most one leader per term. "Raft ensures that there is at most one leader in a given term." (5.1)
- Terms act as a logical clock; a server with a stale term steps down, requests with stale terms are rejected. "Terms act as a logical clock [14] in Raft, and they allow servers to detect obsolete information such as stale leaders." (5.1)
- "If a candidate or leader discovers that its term is out of date, it immediately reverts to follower state." (5.1)
- Only two RPCs are needed, a third for snapshots. "the basic consensus algorithm requires only two types of RPCs." (5.1)
- Heartbeats are empty AppendEntries; a follower that hears nothing for an election timeout starts an election. "If a follower receives no communication over a period of time called the election timeout, then it assumes there is no viable leader and begins an election to choose a new leader." (5.2)
- A candidate increments its term, votes for itself and asks the others in parallel. "To begin an election, a follower increments its current term and transitions to candidate state." (5.2)
- Majority of the full cluster wins; one vote per server per term, first come first served. "Each server will vote for at most one candidate in a given term, on a first-come-first-served basis" (5.2)
- A candidate that sees an AppendEntries with a term at least as large as its own steps back to follower. "If the leader's term (included in its RPC) is at least as large as the candidate's current term, then the candidate recognizes the leader as legitimate and returns to follower state." (5.2) [apostrophes are curly in the pdf]
- Split votes: without extra measures they could repeat forever. "However, without extra measures split votes could repeat indefinitely." (5.2)
- Randomized timeouts, example range 150 to 300 ms. "election timeouts are chosen randomly from a fixed interval (e.g., 150–300ms)." (5.2)
- They first tried a ranking system and dropped it for randomized retry. "Eventually we concluded that the randomized retry approach is more obvious and understandable." (5.2)
- Leader appends, replicates in parallel, applies once safely replicated, retries forever. "the leader retries AppendEntries RPCs indefinitely (even after it has responded to the client) until all followers eventually store all log entries." (5.3)
- Each entry has a command, the term it was received in, and an index. "Each log entry stores a state machine command along with the term number when the entry was received by the leader." (5.3)
- Committed means replicated on a majority by the leader that created it, and this commits earlier entries too. "A log entry is committed once the leader that created the entry has replicated it on a majority of the servers" (5.3)
- The leader sends its commit index in AppendEntries (including heartbeats) so followers learn it. "it includes that index in future AppendEntries RPCs (including heartbeats) so that the other servers eventually find out." (5.3)
- Log Matching: same index and term means same command and same history. "If two entries in different logs have the same index and term, then the logs are identical in all preceding entries." (5.3)
- Why Log Matching holds: one entry per index per term, entries never move, and the consistency check works as an induction step. "a leader creates at most one entry with a given log index in a given term, and log entries never change their position in the log." "The consistency check acts as an induction step" (5.3)
- The consistency check: the leader sends the index and term of the entry before the new ones; the follower refuses if it doesn't have it. "If the follower does not find an entry in its log with the same index and term, then it refuses the new entries." (5.3)
- The leader forces followers' logs to match its own; conflicting follower entries get overwritten. "In Raft, the leader handles inconsistencies by forcing the followers' logs to duplicate its own." (5.3)
- nextIndex per follower, initialized to one past the leader's last entry, decremented on rejection. "After a rejection, the leader decrements nextIndex and retries the AppendEntries RPC." (5.3)
- Optional optimization: return conflicting term and first index for that term; the authors doubt it's needed. "In practice, we doubt this optimization is necessary, since failures happen infrequently and it is unlikely that there will be many inconsistent entries." (5.3)
- Leader Append-Only: a leader never overwrites or deletes its own entries. "a leader never overwrites or deletes entries in its log; it only appends new entries." (Figure 3)
- A slow follower doesn't slow the cluster. "a single slow follower will not impact performance." (5.3)
- Election restriction: a voter denies its vote if its own log is more up-to-date. "the voter denies its vote if its own log is more up-to-date than that of the candidate." (5.4.1)
- Up-to-date defined: compare last term, then length. "If the logs have last entries with different terms, then the log with the later term is more up-to-date. If the logs end with the same term, then whichever log is longer is more up-to-date." (5.4.1)
- Why a candidate with an up-to-date log has every committed entry: it needs votes from a majority, and every committed entry is on at least one of them. "A candidate must contact a majority of the cluster in order to be elected, which means that every committed entry must be present in at least one of those servers." (5.4.1)
- A leader can't count replicas for entries from older terms (Figure 8). "Raft never commits log entries from previous terms by counting replicas." (5.4.2)
- Only current-term entries are committed by counting; earlier ones commit indirectly. "Only log entries from the leader's current term are committed by counting replicas" (5.4.2)
- Entries keep their original term numbers, unlike other algorithms. "log entries retain their original term numbers when a leader replicates entries from previous terms." (5.4.2)
- The Leader Completeness proof hinges on the voter, a server in both majorities. "at least one server ("the voter")" (5.4.3) [curly quotes in the pdf; continues "both accepted the entry from leaderT and voted for leaderU"]
- The five properties Raft guarantees at all times (Figure 3). "Election Safety: at most one leader can be elected in a given term." "Leader Completeness: if a log entry is committed in a given term, then that entry will be present in the logs of the leaders for all higher-numbered terms." "State Machine Safety: if a server has applied a log entry at a given index to its state machine, no other server will ever apply a different log entry for the same index." (Figure 3)
- Persistent state (currentTerm, votedFor, log[]) is written before answering RPCs; commitIndex and lastApplied are volatile. "Persistent state on all servers: (Updated on stable storage before responding to RPCs)" (Figure 2)
- Duplicate commands are filtered by per-client serial numbers remembered in the state machine. "the state machine tracks the latest serial number processed for each client, along with the associated response." (8)
- Raft RPCs are idempotent, so retries after crashes are harmless. "Raft RPCs are idempotent, so this causes no harm." (5.5)
- Safety must not depend on timing, availability must. "safety must not depend on timing: the system must not produce incorrect results just because some event happens more quickly or slowly than expected." (5.6)
- Timing requirement broadcastTime ≪ electionTimeout ≪ MTBF; broadcast 0.5 to 20 ms, so election timeout 10 to 500 ms. "the broadcast time may range from 0.5ms to 20ms, depending on storage technology. As a result, the election timeout is likely to be somewhere between 10ms and 500ms." (5.6)
- When the leader crashes the system is unavailable for about an election timeout. "When the leader crashes, the system will be unavailable for roughly the election timeout" (5.6)
- Switching configurations directly is unsafe: two majorities. "any approach where servers switch directly from the old configuration to the new configuration is unsafe." (6)
- A direct switch can elect two leaders in the same term. "there is a point in time where two different leaders can be elected for the same term, one with a majority of the old configuration (Cold ) and another with a majority of the new configuration (Cnew )." (Figure 10 caption)
- Joint consensus needs separate majorities of old and new. "Agreement (for elections and entry commitment) requires separate majorities from both the old and new configurations." (6)
- A server uses the latest configuration in its log, committed or not. "a server always uses the latest configuration in its log, regardless of whether the entry is committed" (6)
- New servers join as non-voting members first. "the new servers join the cluster as non-voting members (the leader replicates log entries to them, but they are not considered for majorities)." (6)
- Removed servers can disrupt the cluster; fix: ignore RequestVote within the minimum election timeout of hearing from a leader. "if a server receives a RequestVote RPC within the minimum election timeout of hearing from a current leader, it does not update its term or grant its vote." (6)
- The log can't grow forever. "in a practical system, it cannot grow without bound." (7)
- Snapshot: write the whole state, discard the log up to that point. "the entire current system state is written to a snapshot on stable storage" (7)
- Each server snapshots independently, only committed entries. "Each server takes snapshots independently, covering just the committed entries in its log." (7)
- Snapshot metadata: last included index and term, kept for the consistency check, plus the latest configuration. "These are preserved to support the AppendEntries consistency check for the first log entry following the snapshot" (7)
- After a snapshot is written, the log up to it and any older snapshot can go. "it may delete all log entries up through the last included index, as well as any prior snapshot." (7)
- The fixed log-size trigger should sit well above the snapshot size. "If this size is set to be significantly larger than the expected size of a snapshot, then the disk bandwidth overhead for snapshotting will be small." (7)
- The leader sends a snapshot when it has already discarded the entry a follower needs. "This happens when the leader has already discarded the next log entry that it needs to send to a follower." (7)
- InstallSnapshot sends chunks in order; each chunk resets the follower's election timer. "this gives the follower a sign of life with each chunk, so it can reset its election timer." (Figure 13)
- If the snapshot is newer, the follower drops its whole log; if it covers a prefix, it keeps what follows. "entries following the snapshot are still valid and must be retained." (7)
- Leader-only snapshots were rejected: wasteful and more complex. "it is typically much cheaper for a server to produce a snapshot from its local state than it is to send and receive one over the network." (7)
- When to snapshot: too often wastes disk, too rarely fills storage and slows replay; simple rule is a fixed log size. "One simple strategy is to take a snapshot when the log reaches a fixed size in bytes." (7)
- Copy-on-write, e.g. fork on Linux, so snapshots don't block writes. "the operating system's copy-on-write support (e.g., fork on Linux) can be used to create an in-memory snapshot of the entire state machine" (7)
- Clients go to the leader; followers redirect. "If the client's first choice is not the leader, that server will reject the client's request and supply information about the most recent leader it has heard from" (8)
- Without dedup a retried command can run twice; fix with client serial numbers. "The solution is for clients to assign unique serial numbers to every command." (8)
- Reads without the log risk stale data from a deposed leader. "this would run the risk of returning stale data, since the leader responding to the request might have been superseded by a newer leader of which it is unaware." (8)
- New leader commits a blank no-op at the start of its term. "Raft handles this by having each leader commit a blank no-op entry into the log at the start of its term." (8)
- Leader exchanges heartbeats with a majority before answering a read; a lease would rely on bounded clock skew. "Alternatively, the leader could rely on the heartbeat mechanism to provide a form of lease [9], but this would rely on timing for safety (it assumes bounded clock skew)." (8)
- Raft in RAMCloud's config store was about 2000 lines of C++. "The Raft implementation contains roughly 2000 lines of C++ code, not including tests, comments, or blank lines." (9)
- Election measurements (five servers, broadcast time roughly 15 ms, leader crashed 1000 times per line): no randomness means more than 10 s from split votes; 5 ms randomness gives a 287 ms median; 12 to 24 ms timeouts elect in 35 ms on average. "Adding just 5ms of randomness helps significantly, resulting in a median downtime of 287ms." (9.3)
- "In the absence of randomness, leader election consistently took longer than 10 seconds in our tests due to many split votes." (9.3)
- Setup for those measurements: five servers, broadcast time about 15 ms, 1000 trials per line except 100 for the fixed 150 ms case. "The measurements were taken on a cluster of five servers with a broadcast time of roughly 15ms." (Figure 16) "Each line represents 1000 trials (except for 100 trials for "150–150ms")" (Figure 16) [curly quotes]
- With 50 ms of randomness the worst case was 513 ms. "completion time (over 1000 trials) was 513ms." (9.3)
- 12 to 24 ms timeouts: 35 ms average, longest 152 ms, but shorter timeouts break the timing requirement. "it takes only 35ms on average to elect a leader (the longest trial took 152ms)." (9.3) "leaders have difficulty broadcasting heartbeats before other servers start new elections." (9.3)
- Figure 7: a follower can be missing entries, have extra uncommitted ones, or both; scenario (f) is a server that led terms 2 and 3 and crashed before committing any of their entries. "A follower may be missing entries (a–b), may have extra uncommitted entries (c–d), or both (e–f)." (Figure 7)
- A new leader starts nextIndex one past its last entry, 11 in figure 7. "it initializes all nextIndex values to the index just after the last one in its log (11 in Figure 7)." (5.3)
- Recommendation: a conservative 150 to 300 ms. "We recommend using a conservative election timeout such as 150–300ms" (9.3)
- A formal TLA+ specification (about 400 lines) and a safety proof cover the consensus core of section 5; the Log Completeness Property was proven mechanically, State Machine Safety informally. "We have developed a formal specification and a proof of safety for the consensus mechanism described in Section 5." (9.2)
- The greatest difference from Paxos is strong leadership; election is the first phase of consensus. "The greatest difference between Raft and Paxos is Raft's strong leadership" (10)

## Visuals worth redrawing

- Figure 1: replicated state machine architecture.
- Figure 2: the one-page summary of Raft's state and RPCs.
- Figure 4: server states (follower, candidate, leader) and transitions.
- Figure 5: time divided into terms, some with no leader after a split vote.
- Figure 6 and 7: log layout with term numbers, and the ways follower logs can differ from a new leader's.
- Figure 8: why a leader can't commit an old-term entry by counting replicas.
- Figure 10 and 11: two majorities during a direct switch; joint consensus timeline.
- Figure 12: a snapshot replacing log indexes 1 to 5.

## My notes

- Section 3 is the main source for the "Paxos is hard" side of the
  argument; Howard and Mortier (2020) push back on it.
