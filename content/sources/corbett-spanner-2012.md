---
id: corbett-spanner-2012
title: "Spanner: Google's Globally-Distributed Database"
author: James C. Corbett, Jeffrey Dean, Michael Epstein, Andrew Fikes, Christopher Frost, JJ Furman, Sanjay Ghemawat, and others
url: https://static.googleusercontent.com/media/research.google.com/en//archive/spanner-osdi2012.pdf
kind: paper
primary: true
---

## Summary

The OSDI 2012 paper on Spanner. For clocks, the part that matters is
TrueTime: an API that returns time as an interval with a known error
bound, backed by GPS and atomic clocks, and the commit wait that turns
that bound into a correct ordering of transactions.

## Key claims

- TrueTime returns an interval, not a single time. "TrueTime explicitly represents time as a TTinterval, which is an interval with bounded time uncertainty (unlike standard time interfaces that give clients no notion of uncertainty)." (3)
- The references are GPS receivers and atomic clocks. "The underlying time references used by TrueTime are GPS and atomic clocks." (3)
- Its epoch is Unix time with smeared leap seconds. "The time epoch is analogous to UNIX time with leap-second smearing." (3)
- The error bound is a sawtooth between polls. "varying from about 1 to 7 ms over each poll interval." (3)
- Poll interval and assumed drift. "The daemon’s poll interval is currently 30 seconds, and the current applied drift rate is set at 200 microseconds/second" (3)
- Machines whose clocks drift faster than the assumed bound are evicted. "To protect against broken local clocks, machines that exhibit frequency excursions larger than the worstcase bound derived from component specifications and operating environment are evicted." (3)
- Commit wait: the leader waits until the commit timestamp is certainly in the past before anyone can see the write. "the coordinator leader waits until TT.after(s), so as to obey the commit-wait rule described in Section 4.1.2." (4.2.1)
- Measured cost of commit wait. "From the 1-replica experiments, commit wait is about 5ms, and Paxos latency is about 9ms." (5.1)
- Bad clocks are rarer than bad CPUs in their fleet. "Our machine statistics show that bad CPUs are 6 times more likely than bad clocks." (5.3)
- The bound's tail gets worse with network congestion and when time masters go down. "However, there can be significant tail-latency issues that cause higher values of" (5.3)
- The interval is guaranteed to contain true time. "The TT.now() method returns a TTinterval that is guaranteed to contain the absolute time during which TT.now() was invoked." (3)
- The error bound (epsilon) is half the interval's width. "which is half of the interval’s width" (3)
- Time masters in every datacenter, a daemon on every machine. "TrueTime is implemented by a set of time master machines per datacenter and a timeslave daemon per machine." (3)
- Tail spikes came from network congestion. "due to networking improvements that reduced transient network-link congestion." (5.3)
- And from time masters taken down. "resulted from the shutdown of 2 time masters at a datacenter for routine maintenance." (5.3)
- Cross-group transactions run two-phase commit between Paxos group leaders. "If a transaction involves more than one Paxos group, those groups’ leaders coordinate to perform two-phase commit." (2.1)
- The transaction manager's state is itself replicated by Paxos. "The state of each transaction manager is stored in the underlying Paxos group (and therefore is replicated)." (2.1)
- Most transactions touch one group and skip 2PC. "If a transaction involves only one Paxos group (as is the case for most transactions), it can bypass the transaction manager" (2.1)
- Putting 2PC over Paxos is their answer to its availability problem. "Running two-phase commit over Paxos mitigates the availability problems." (2.3)
- They chose to offer transactions and let programmers deal with the cost. "We believe it is better to have application programmers deal with performance problems due to overuse of transactions as bottlenecks arise, rather than always coding around the lack of transactions." (2.3)
- External consistency is linearizability of the commit order. "the serialization order satisfies external consistency (or equivalently, linearizability [20])" (1)
- Read-write transactions use two-phase locking. "Transactional reads and writes use two-phase locking." (4.1.2)
- Reads in read-write transactions use wound-wait against deadlock. "Reads within read-write transactions use wound-wait [33] to avoid deadlocks." (4.2.1)
- Writes are buffered at the client until commit, and the client drives 2PC. "Having the client drive two-phase commit avoids sending data twice across wide-area links." (4.2.1)
- Each non-coordinator participant locks, picks a prepare timestamp and logs a prepare record through Paxos. "logs a prepare record through Paxos." (4.2.1)
- The coordinator skips its own prepare. "The coordinator leader also first acquires write locks, but skips the prepare phase." (4.2.1)
- After commit wait, everyone applies at one timestamp. "All participants apply at the same timestamp and then release locks." (4.2.1)
- Applications choose where data lives, trading read latency, write latency and durability. "Applications can specify constraints to control which datacenters contain which data, how far data is from its users (to control read latency), how far replicas are from each other (to control write latency), and how many replicas are maintained (to control durability, availability, and read performance)." (1)
- Placement can differ per user. "an application might store each end-user's data in its own directory, which would enable user A's data to have three replicas in Europe, and user B's data to have five replicas in North America." (2.2)
- F1 runs five replicas across the US. "F1 uses five replicas spread across the United States." (1)
- Most applications stay in one geographic region. "Most other applications will probably replicate their data across 3 to 5 datacenters in one geographic region, but with relatively independent failure modes." (1)
- F1's split, and why. "F1 has 2 replicas on the west coast of the US, and 3 on the east coast." (5.4)
- After failures, F1 moved Paxos leaders near its frontends. "the most that the F1 team has had to do is update their database's schema to tell Spanner where to preferentially place Paxos leaders, so as to keep them close to where their frontends moved." (5.4)
- How many participants 2PC can take, in their tests across 3 zones with 25 spanservers each. "Scaling up to 50 participants is reasonable in both mean and 99th-percentile, and latencies start to rise noticeably at 100 participants." (5.1, Table 4)
- F1, Google's ads backend, was the first customer. "Our initial customer was F1 [35], a rewrite of Google's advertising backend." (1)
- The Start rule. "assigns a commit timestamp si no less than the value of TT.now().latest" (4.1.2)
- The Commit Wait rule. "The coordinator leader ensures that clients cannot see any data committed by Ti until TT.after(si ) is true." (4.1.2)
- Machines with bad clocks are evicted. "machines that exhibit frequency excursions larger than the worstcase bound derived from component specifications and operating environment are evicted." (3)

## Visuals worth redrawing

- Figure 6 (5.3): percentiles of the TrueTime bound over time. Not
  redrawn.

## My notes

- "worstcase" is how the PDF text extracts; the printed word is
  hyphenated across a line.
- The symbol for the error bound (epsilon) doesn't survive text
  extraction, so quotes stop before it.
