---
id: jepsen-elle
title: Elle (README)
author: Kyle Kingsbury, Peter Alvaro and contributors (Jepsen)
url: https://github.com/jepsen-io/elle
kind: code
primary: true
---

## Summary

The README of Elle's Clojure implementation, main branch when this was
written. A worked three-transaction example of a G1c cycle, the two
workloads (list append and read-write registers), what Elle can and
can't find, and how fast the optimized checker runs.

## Key claims

- Elle checks black-box databases from client observations only. "Elle is a transactional consistency checker for black-box databases." (intro)
- Its cost grows about linearly with history length and barely with concurrency. "Elle is ~linear in history length, and ~constant, rather than exponential, with respect to concurrency." (intro)
- It points at a small set of transactions as proof. "Elle can point to a minimal set of transactions which witness a consistency violation" (intro)
- Its rules aren't fully trusted yet; check reports by hand. "Jepsen recommends checking reported anomalies by hand to make sure they're valid." (intro)
- Other languages can use it by writing the history to a file. "you can write your history to a file or stream, and call a small wrapper program to produce output." (intro)
- Demo: three committed transactions. T1 appends 1 to x and reads y = [1]; T2 appends 2 to x and 1 to y; T3 reads x = [1 2]. T1 read T2's append to y, so T2 came first; T3's read shows T1's append to x came before T2's, so T1 came first. "T1 < T2, because T2 observed T1's append of 1 to key :y." (Demo, out/G1c.txt; T1 and T2 there are numbered the other way round)
- The verdict names the weakest level the history breaks. "this is the weakest level Elle can demonstrate is violated." (Demo)
- Besides each cycle, Elle plots each strongly connected component. "Elle generates a plot for each strongly-connected component of the dependency graph." (Demo)
- Two main workloads: registers (weaker rules, works almost anywhere) and list append (strongest rules). "Objects are lists, writes append unique elements to those lists." (Types of Tests)
- The anomalies it checks: G0 write cycle, G1a aborted read, G1b intermediate read, G1c cyclic information flow, G-single read skew, G2 anti-dependency cycle. "G-Single: Read skew." (Soundness)
- Process and real-time edges let it tell strict serializability from serializability. "allowing it to distinguish between, say, strict serializability and serializability." (Soundness)
- One read of a list gives a whole prefix of the version order. "For lists, Elle can infer a complete prefix of the Adya version order for a key based on a single read." (Soundness)
- A database that lies in just the right way could hide or fake an anomaly. "if the database lies in *just the right way*, it might appear to exhibit anomalies which didn't actually happen, or mask anomalies which did." (Soundness)
- Elle is not complete. "Elle is not complete: it may fail to identify anomalies which were present in the system under test." (Completeness)
- It trades completeness for speed on purpose. "Serializability checking is NP-complete; Elle intentionally limits its inferences to those solvable in linear (or log-linear) time." (Completeness)
- The unknowns are usually unobserved transactions or the end of the history. "Indeterminacy is generally limited to unobserved transactions, or a small set of transactions at the very end of the history." (Completeness)
- After optimization: 22 million transactions in about two minutes with about 60 GB of heap. "It can check real-world histories of 22 million transactions for (e.g.) strong session serializability in in roughly two minutes, consuming ~60 GB of heap." (Performance)
- Knossos (the linearizability checker) handles a few hundred operations; Elle hundreds of thousands. "Where Knossos is often limited to a few hundred operations per history, Elle can handle hundreds of thousands of operations easily." (Performance)

## Visuals worth redrawing

- The G1c example plot (images/g1c-example.png): two transactions with a
  wr edge one way and a ww edge the other.

## My notes

- The README warns that the RW-register workload may wrongly report
  incompatible version orders with some per-key options.
- A standalone command-line front end, elle-cli, exists (linked from
  the README, not opened).
