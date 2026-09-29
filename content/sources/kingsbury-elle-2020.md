---
id: kingsbury-elle-2020
title: "Elle: Inferring Isolation Anomalies from Experimental Observations"
author: Kyle Kingsbury (Jepsen) and Peter Alvaro (UC Santa Cruz)
url: https://arxiv.org/pdf/2003.10554
kind: paper
primary: true
---

## Summary

The paper behind Elle, Jepsen's transaction isolation checker (arXiv
2003.10554v1, 2020; later published in PVLDB volume 14). Clients
run random transactions and record what they sent and what came back.
Elle rebuilds Adya's dependency graph between those transactions from the
outside, then looks for cycles. The trick is the workload: if every write
appends a unique value to a list, every read shows the full order of writes
to that key, so the checker never has to guess the version order.

## Key claims

- Hand-written isolation tests only check the pattern they were built for. "They find a small number of anomalies in a specific pattern of transactions, and tell us nothing about the behavior of other patterns." (section 1)
- Checking serializability in general is NP-complete, and real time can't be used to prune it the way it can for linearizability. "Serializability checking is also (in general) NP-complete" (section 1)
- An earlier constraint-solver approach by Kingsbury couldn't scale. "Histories of more than a hundred-odd transactions quickly become intractable." (section 1)
- Once you have the dependency graph, finding a cycle is linear time. "cycle detection is solvable in O(vertices + edges) time, thanks to Tarjan's algorithm for strongly connected components" (section 2)
- The problem is that clients never see the version order, which Adya's graph needs. "we lack a key component in Adya's formalism: the version order." (section 2)
- Adya et al. rule out taking the version order from real time. "Adya et al explicitly rule this out, since optimistic and multi-version implementations might require the freedom to commit earlier versions later in time." (section 2)
- Adya's three dependencies: write-depends (Ti installs xi, Tj installs the next version), read-depends (Tj reads xi), anti-depends (Ti reads xi, Tj installs the next version). "Ti reads xi , and Tj installs x's next version" (section 2, directly anti-depends)
- G0 is a cycle of only write dependencies; G1c includes read dependencies; G2 has at least one anti-dependency, and exactly one is G-single. "Instances of G2 involve at least one anti-dependency (those with exactly one are G-single)." (section 2)
- G1a and G1b aren't cycles: reading from an aborted transaction, or reading a version from the middle of another transaction. "or which read versions from the middle of some other transaction" (section 2)
- Unique written values let you map every version you read back to the write that made it. "We call this property recoverability: every version we observe can be mapped to a specific write in some observed transaction." (section 3)
- Blind register writes lose the order of versions. "In a sense, blind writes to a register "destroy history"." (section 3)
- With sets you get some anti-dependencies but not the order between two adds. "because sets are order-free." (section 3)
- With append-only lists, one read gives the whole order of earlier versions. "Then any read of xi tells us the order of all versions written prior" (section 3); "We call this property traceability." (section 3)
- Writes near the end of a history may never be read, so their order stays unknown, but that part is small if reads happen often. "so long as histories are long and include reads every so often, the unknown fraction of a version order can be made relatively small." (section 3)
- A transaction whose commit result is unknown (timeout, crash) is recorded as indeterminate: neither committed nor aborted. "we leave the transaction with neither a commit nor abort operation." (section 4.1)
- Per-process edges tell snapshot isolation from strong session SI; real-time edges tell serializable from strict serializable. "Strict serializability [19] enforces a real-time order" (section 5.1)
- Per-process edges catch a client that sees a write and then stops seeing it, which Berenson et al.'s snapshot isolation allows. "a single process could observe, then un-observe, a write." (section 5.1)
- Plain serializability allows read-only transactions to see the empty initial state. "it is legal, under Adya's formalism, for every read-only transaction to return an initial, empty state of the database" (section 5.1)
- For registers, Elle can still infer partial version orders from the initial state, writes that follow reads in one transaction, and per-key linearizability. "we can iterate these procedures to infer increasingly complete dependency graphs, up to some fixed point." (section 5.2)
- Soundness: an anomaly Elle reports is in every clean interpretation of what was observed. "If Elle infers a cycle anomaly, then every clean interpretation of O exhibits corresponding phenomena." (section 5.1, Theorem 1)
- Cycle search: Tarjan's strongly connected components, then breadth-first search inside each component for a short cycle, on subgraphs restricted by edge type. "Within each graph component, we apply breadth-first search to identify a short cycle." (section 6)
- G-single search: start in the read-write subgraph, follow exactly one rw edge, close the cycle with only ww and wr edges. "follow exactly one read-write edge, then attempt to complete the cycle using only write-write and write-read edges." (section 6)
- Extra anomalies outside Adya's model: garbage reads (a value never written), duplicate writes, internal inconsistency (a transaction contradicts its own earlier reads or writes). "A read observes a value which was never written." (section 6.1)
- Duplicate writes often come from retries. "Duplicate writes can occur when a client or database retries an append operation" (section 6.1)
- Lists are easy to get in SQL. "The SQL standard's CONCAT function and the TEXT datatype are a natural choice for encoding lists, e.g. as comma-separated strings." (section 7)
- Test setup: transactions of typically 1 to 10 operations over a handful of objects, 10 to 30 client threads on 5 to 9 nodes. "typically 1-10 operations" (section 7)
- A client that times out on commit gets a new logical process, so logical concurrency grows. "Tens of thousands of logically concurrent transactions are not uncommon." (section 7)
- TiDB: G-single from an automatic retry that re-applied writes after a conflict, on by default; fixed in 3.0.0-rc2 by turning both retry mechanisms off by default. "TiDB simply re-applied the transaction's writes again, ignoring the conflict." (section 7.1)
- TiDB 2.1.7 to 3.0.0-beta.1 showed anomalies without any faults, including lost updates. "exhibited frequent anomalies—even in the absence of faults." (section 7.1); "as well as lost updates." (section 7.1)
- FaunaDB's internal inconsistencies happened without faults. "in clusters without any faults." (section 7.3)
- TiDB: SELECT ... FOR UPDATE didn't stop write skew, because it couldn't lock rows that didn't exist yet. "freshly inserted rows were not subject to concurrency control." (section 7.1)
- YugaByte DB 1.3.1: G2-item when master nodes were unavailable, traced to a race after leader election. "after a leader election, a fresh master server briefly advertised an empty capabilities set to tablet servers." (section 7.2)
- FaunaDB 2.6.0: a transaction failed to see its own write, an internal inconsistency. "a single transaction failed to observe its own prior writes" (section 7.3)
- Knossos (a linearizability checker) has to try up to c! orders for c concurrent transactions; Elle is linear in history length and hardly affected by concurrency. "given c concurrent transactions, the number of permutations to evaluate is c!." (section 7.5)
- Benchmark setup: simulated in-memory SSI database, 1 to 5 operations per transaction, 100 objects, 100 appends per object, runtimes capped at 100 s, 24-core Xeon with 128 GB RAM. "All tests were performed on a 24-core Xeon with 128 GB of ram." (section 7.5)
- Knossos with 40 or more concurrent processes couldn't check even 5,000-transaction histories in reasonable time. "With 40+ concurrent processes, even histories of 5000 transactions were (generally) uncheckable in reasonable time frames." (section 7.5)
- Elle checked real histories of hundreds of thousands of transactions in tens of seconds. "Elle was able to check histories of hundreds of thousands of transactions in tens of seconds." (section 7.5)
- Limit: no predicates, so Elle can't tell repeatable read from serializable. "we cannot distinguish between repeatable read and serializability." (section 9)
- The soundness theorem covers clean interpretations; unclean ones (aborted reads, dirty updates) are a separate, worse finding. "What of unclean interpretations, like those with aborted reads or dirty updates?" (section 5.1)

## Visuals worth redrawing

- Figures 2 and 3 (section 7): a real-time G-single cycle between three
  transactions, first as the checker's text explanation, then as a graph
  with edges labelled wr, rw and rt.

## My notes

- Two versions exist: arXiv 2003.10554v1 (this url) and the PVLDB
  version (vldb.org/pvldb/vol14/p268-alvaro.pdf, also opened), whose
  wording differs in places. Quotes above are from the arXiv text, with
  curly quotes and apostrophes written as straight ones.
