---
id: tan-cobra-2020
title: "Cobra: Making Transactional Key-Value Stores Verifiably Serializable"
author: Cheng Tan, Changgeng Zhao, Shuai Mu, Michael Walfish
url: https://www.usenix.org/system/files/osdi20-tan.pdf
kind: paper
primary: true
---

## Summary

OSDI 2020 paper on checking that a black-box key-value store is
serializable, from its inputs and outputs only, fast enough to keep up
with production load. Where Elle chooses a workload that makes the version
order visible, Cobra works with ordinary reads and writes: it encodes the
unknown write order as "either this edge or that one" choices and hands
the search to an SMT solver built for graph problems, with GPU pruning
first.

## Key claims

- Checking a black-box database for serializability is NP-complete. "checking black-box serializability has long been known to be NP-complete" (section 1)
- The strict variant is easier to check, because real time rules out orders. "the strict variant is "easier" because the real-time constraint diminishes the space of potentially-valid execution schedules." (section 1)
- Heavy concurrency or clock drift brings the hard problem back even for strict serializability. "Heavy concurrency, for example, means few real-time constraints, so the difficult computational problem re-enters." (section 1)
- Unique values make every read traceable to its write; the client library adds a unique id to each write. "embeds a unique id in each write and consumes the id on a read." (section 2.2)
- The version order lives inside the database and isn't exposed. "The version order comes from within the database and is not exposed externally." (section 2.2)
- A polygraph: known read-dependency edges, plus constraints that say a third writer of the same key went either after the reader or before the writer. "Hence T2 has to happen either after T3 or before T1 , but it is unknown which option is the truth." (section 2.3)
- The history is serializable if and only if some choice of one edge per constraint gives an acyclic graph. "there exists an acyclic directed graph that is compatible with the polygraph associated to a history H, iff there exists an acyclic serialization graph G of H." (section 2.3)
- Brute force means 2 to the number of constraints choices, and the number of constraints is large. "not only does this approach need to consider |C| binary choices (2|C| possibilities) but also |C| is massive" (section 2.3)
- Cobra uses the MonoSAT solver, which is built for graph properties. "cobra uses a recent SMT solver, MonoSAT [52], that is well-suited to checking graph properties" (section 1)
- GPUs compute reachability over known edges to settle many constraints before the solver runs. "cobra uses parallel hardware (our implementation uses GPUs; §5) to compute all-pairs reachability" (section 1)
- For a history that never ends, clients issue periodic fence transactions so the verifier can drop old transactions. "clients issue periodic fence transactions (§4.2)." (section 1)
- Results: 10k transactions checked in 14 seconds, where baselines managed 1k or less in the same time; sustained 2k transactions per second. "cobra finishes checking 10k transactions in 14 seconds, whereas baselines can handle only 1k or less in the same time budget." (section 1)

## Visuals worth redrawing

- The small polygraph in section 2.3: T1 writes x=1, T3 reads x=1, T2
  writes x=2, with a two-way dashed constraint on T2.

## My notes

- The authors' machine and workloads for the 14-second figure are in
  section 6; the article only uses the figure as the paper's own claim.
