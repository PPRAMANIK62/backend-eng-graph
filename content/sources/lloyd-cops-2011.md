---
id: lloyd-cops-2011
title: "Don't Settle for Eventual: Scalable Causal Consistency for Wide-Area Storage with COPS"
author: Wyatt Lloyd, Michael J. Freedman, Michael Kaminsky, David G. Andersen
url: https://www.cs.cmu.edu/~dga/papers/cops-sosp2011.pdf
kind: paper
primary: true
---

## Summary

The SOSP 2011 paper on COPS, a geo-replicated key-value store that
gives causal+ consistency (causal consistency plus convergent conflict
handling) while staying available and fast. Defines potential
causality, explains why plain causal isn't enough, and shows how COPS
tracks each write's dependencies and holds a replicated write back
until its dependencies are present.

## Key claims

- Causal+ is the strongest model they could reach under their constraints. "we identify and define a consistency model—causal consistency with convergent conflict handling, or causal+ —that is the strongest achieved under these constraints." (abstract)
- The core mechanism. "The central approach in COPS is tracking and explicitly checking whether causal dependencies between keys are satisfied in the local cluster before exposing writes." (abstract)
- The photo example: the album reference depends on the photo. "The reference “depends on” the picture being saved." (1)
- Causal never shows the reference without the picture. "Programmers never have to deal with the situation where they can get the reference to the picture but not the picture itself, unlike in systems with weaker guarantees, such as eventual consistency." (1)
- Convergent conflict handling stops replicas diverging for good. "The convergent conflict handling component of causal+ consistency ensures that replicas never permanently diverge and that conflicting updates to the same key are dealt with identically at all sites." (1)
- Eventual systems may show versions out of order. "In comparison, eventually consistent systems may expose versions out of order." (1)
- Rule 1 of potential causality. "If a and b are two operations in a single thread of execution, then a ; b if operation a happens before operation b." (section 3, potential causality; the arrow symbol extracts as ";")
- Rule 2. "If a is a put operation and b is a get operation that returns the value written by a, then a ; b." (section 3, potential causality)
- Rule 3. "For operations a, b, and c, if a ; b and b ; c, then a ; c." (section 3, potential causality)
- The model assumes threads talk only through the data store. "Our model, like many, does not allow threads to communicate directly, requiring instead that all communication occur through the data store." (section 3, potential causality)
- Plain causal can leave two replicas disagreeing forever on concurrent writes. "Regular causal consistency would allow two different replicas to forever return different times, even after receiving both put operations." (section 3, causal+)
- Last-writer-wins is one convergent rule. "One common way to handle conflicting writes in a convergent fashion is the last-writer-wins rule (also called Thomas’s write rule [50]), which declares one of the conflicting writes as having occurred later and has it overwrite the “earlier” write." (section 3, causal+)
- COPS versions: Lamport clock in the high bits, node id in the low bits. "The node sets the version number’s high-order bits to its Lamport clock and the loworder bits to its unique node identifier." (section 4, writes and dependencies)
- Only the nearest dependencies need checking. "The nearest dependencies are sufficient for the key-value store to provide causal+ consistency; the full dependency list is only needed to provide get trans operations in COPS-GT." (section 4, writes and dependencies)
- A remote node waits for dependencies before committing. "If not, it blocks until the needed version has been written." (section 4, writes and dependencies)
- Reads never block. "This dependency checking mechanism ensures writes happen in a causally consistent order and reads never block." (section 4, writes and dependencies)
- Real-time causal adds a real-time rule to catch causality hidden from the system. "This real-time requirement helps capture potential causality that is hidden from the system (e.g., outof-band messaging [14])." (related work)
- Low latency is incompatible with linearizability. "Low latency—defined as latency less than the maximum widearea delay between replicas—has also been proven incompatible with linearizability [34] and sequential consistency [8]." (section 2, ALPS systems)
- Local operations are linearizable; replication to other data centres happens in the background. "COPS executes all put and get operations in the local datacenter in a linearizable fashion, and it then replicates data across datacenters in a causal+ consistent order in the background." (1)
- On a put, the client library works out the dependencies and marks the nearest ones. "the library computes the complete set of dependencies deps, and identifies some of those dependency tuples as the value’s nearest ones." (section 4, writes and dependencies)
- Carol and Dan set a meeting time concurrently. "Carol changed it to 8pm, and Dan concurrently changed it to 10pm." (section 3, causal+)
- Explicit conflict handling can return both values. "the key could be marked as in conflict and future gets on it could return both 8pm and 10pm with instructions to resolve the conflict." (section 3, causal+)
- Many systems thought to be causal were really causal+. "Many previous systems believed to implement the weaker causal consistency [10, 41] actually implement the more useful causal+ consistency, though none do so in a scalable manner." (1)
- Earlier systems used per-replica logs with version vectors. "Different replicas then exchange these logs, using version vectors to establish potential causality and detect concurrency between operations at different replicas." (related work)
- That needs one ordering point per replica. "Log-exchange-based serialization inhibits replica scalability, as it relies on a single serialization point in each replica to establish ordering." (related work)
- COPS's last-writer-wins gives causal+ but not real-time causal. "Notably, COPS’s efficient last-writer-wins rule results in a causal+ but not RTC consistent system, while a “return-them-all” conflict handler would provide both properties." (related work)
- The client context could be passed around as a blob. "one could also encode the entire context table as an opaque blob and pass it between client and library so that the library is stateless." (section 4, footnote 4)

## Visuals worth redrawing

- Figure 2: a graph of operations at a replica with edges for "depends
  on".

## My notes

- Locations are by section topic; the two-column text extraction mixes
  section numbers up.
