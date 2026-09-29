---
id: athalye-porcupine
title: "Porcupine: a fast linearizability checker in Go (README)"
author: Anish Athalye
url: https://github.com/anishathalye/porcupine
kind: code
primary: true
---

## Summary

The README of Porcupine, the Go linearizability checker this project's
phase 11 lab plans to use. A model is a Go struct with an initial state
and a step function; a history is a list of call and return events (or
operations with call and return times). It says whether the history is
linearizable, and can draw an HTML view of the linearization points.

## Key claims

- What it takes and returns. "It takes a sequential specification as executable Go code, along with a concurrent history, and it determines whether the history is linearizable with respect to the sequential specification." (top)
- The algorithm it implements. "Porcupine implements the algorithm described in [Faster linearizability checking via P-compositionality][faster-linearizability-checking], an optimization of the algorithm described in [Testing for Linearizability][linearizability-testing]." (top)
- Speed against Knossos, on Jepsen's test data. "Testing on the data in `test_data/jepsen/`, Porcupine is generally **1,000x**-**10,000x** faster and has a much smaller memory footprint." (top)
- Two ways to give a history. "Porcupine supports specifying history in two ways, either as a list of operations with given call and return times, or as a list of call/return events in time order." (Usage)
- The step function returns whether the operation was legal and the new state. "// step function: takes a state, input, and output, and returns whether it" (Testing linearizability, code comment)
- The second example history (a read returns the new value, a later read returns the old one) is not linearizable. "We can check the history with Porcupine and see that it's not linearizable:" (Testing linearizability)
- The visualizer splits by partition, for example by key. "The visualization is by partition: all partitions are essentially independent, so with the key-value store example above, operations related to each unique key are in a separate partition." (Visualizing histories)
- For a failing history it shows the longest partial linearization. "If a partition has no full linearization, the visualization shows the longest partial linearization." (Visualizing histories)
- Slowness may be unavoidable. "If Porcupine runs really slowly on your model/history, it may be inevitable, due to state space explosion." (Notes)
- Timestamps on weakly ordered CPUs need care. "When recording timestamps for operations, especially on ARM and other weakly-ordered architectures, you may need to use memory barriers or atomic operations to ensure accurate measurements and avoid spurious linearizability violations." (Notes)
- etcd uses it in its robustness tests. "[etcd](https://github.com/etcd-io/etcd) uses Porcupine's linearizability checker and visualizer in its [robustness tests](https://github.com/etcd-io/etcd/tree/main/tests/robustness)" (Users)
- It started with MIT's distributed systems course. "was the original motivation for the development of Porcupine, which is used to test the linearizability of the course's Raft-based distributed key-value store." (Users)
- When a history splits into independent parts, it is far faster still. "On histories where it can take advantage of P-compositionality, Porcupine can be millions of times faster." (top)
- The visualizer shows operations that were tried next and rejected. "It also shows illegal linearization points, history elements that were checked to see if they could occur next but which were illegal to linearize at that point according to the model." (Visualizing histories)
- The visualization is an HTML page. "The result is an HTML page that draws an interactive visualization using JavaScript." (Visualizing histories)

## Visuals worth redrawing

- The two register histories in the README (three clients, bars from
  call to return): one linearizable, one not. Good for an article
  figure.

## My notes

- Read from the master branch README; no release version is pinned
  in it. Recheck the users list and speed claim when the lab starts.
