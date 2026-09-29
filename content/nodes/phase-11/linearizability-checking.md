---
id: linearizability-checking
title: Checking linearizability
depth: short
phase: 11
note: >-
  Checking a recorded history for linearizability. Knossos and
  Porcupine. The phase 11 harness.
needs: [linearizability, history-checking]
leads_to: []
compare_with: [history-checking, deterministic-simulation-testing]
---

# Checking linearizability

You can't look inside a distributed store to see whether it's
[[linearizability|linearizable]]. What you can do is run many clients
against it, record every request and answer with its start and end
time, and then search for an order of operations that explains every
answer. If no such order exists, you've caught a bug. Knossos and
Porcupine are two checkers that do this search, and Porcupine is the
harness for this phase's lab.

## Why asserts aren't enough

The obvious test gives each client its own key: write a random value,
read it back, assert they match. If it fails, the store is broken. But
plenty of non-linearizable stores pass it forever, because no two
clients ever touch the same key.

The interesting bugs need contention: many clients reading and writing
a few shared keys while you inject faults like partitions and crashes
(see [[fault-injection]]). Then there's no single right answer to assert
on. A read that overlaps two writes may legally return either value. So
you stop predicting outputs and check the whole run afterwards.

## What goes in

A checker needs two things.

**A model.** A single-threaded description of the object, written as
code: its starting state, and a step function that takes a state, an
operation and its result, and says whether that result was legal and
what the next state is. For a register, a write always succeeds and
sets the state; a read is legal only if it returns the current state.

**A history.** Every operation, recorded as an invocation and a
completion. The completion is one of three kinds:

- **ok**: it happened, with this result.
- **fail**: it definitely didn't happen.
- **info**, or unknown: the client timed out and can't tell.

Unknown matters. A write that [[timeouts|timed out]] may have taken effect, or may
take effect later. The checker treats it as concurrent with everything
after it started, and tries both possibilities. The client that sent
it is treated as crashed and never issues another operation, because a
client is single-threaded and still has one operation in flight.

## The search

The checker tries to build a linearization: an order of operations
that the model accepts, where no operation comes before one that
finished before it started. It tries operations that could go next,
steps the model for each, and follows the ones the model accepts.
Knossos runs two such searches, a graph search and a tree search, in
parallel. The answer is linearizable, not linearizable, or unknown if
it ran out of memory.

This search is expensive by nature. Checking linearizability is
NP-complete: you can turn any subset-sum problem into a history of
"add" operations and one read, and the history is linearizable only if
some subset adds up to what the read returned. In practice, checkers
prune hard and work well on small histories.

The biggest win comes from splitting. Operations on different keys are
independent, so a key-value history can be split by key and each key
checked on its own, which turns one huge search into many small ones
(the property behind this is locality, covered in [[linearizability]]).
Porcupine does this, and it's a large part of why it's fast: on the Jepsen test data it reports
1,000 to 10,000 times faster than Knossos, and far more when a history
splits well. Its author wrote it because Knossos handled about a
hundred events from a couple of clients, and he had tens of clients
producing thousands of events. Porcupine checked those in a couple of
seconds.

When a history fails, the useful output is where it fails. Porcupine
draws an HTML view of each key's operations with the longest order it
could build and the operations that couldn't be placed next.

## Where it gets tricky

**Bad timestamps make false alarms.** The check relies on start and end
times. If the recording itself reorders them, you get violations the
store never committed. Porcupine's docs warn that on ARM and other
weakly ordered CPUs you may need memory barriers or atomics around the
timestamps.

**Some histories stay slow.** If keys can't be split apart, or the model
has a huge state space, the search can blow up. Keep histories short
and keys few but contended.

**It checks one object at a time.** [[transaction|Transactions]] across keys need a
different approach: [[history-checking]].

**It proves bugs, not correctness.** A passing run means this history
was fine. Run many, with faults, before trusting the result.

## What this means when you build

- **Record honestly.** Log the invocation before sending and the
  completion after receiving. Mark timeouts as unknown, never as failed.
- **Use few keys and many clients**, so operations overlap and bugs have
  somewhere to show.
- **Plant a bug first.** Make the store serve reads from a stale replica
  and confirm the checker catches it before you trust a pass. Porcupine's
  author reports he couldn't plant a correctness bug in his key-value
  store that the checker missed, while simple asserts caught only the
  obvious ones.

## Further reading

- [Testing Distributed Systems for Linearizability](https://anishathalye.com/testing-distributed-systems-for-linearizability/), Anish Athalye, 2017. Why record-and-check beats asserts, the NP-completeness proof, and why Porcupine exists.
- [Porcupine](https://github.com/anishathalye/porcupine), Anish Athalye. The checker this lab uses: models, histories, speed against Knossos, the visualizer and its caveats.
- [Knossos](https://github.com/jepsen-io/knossos), Kyle Kingsbury. Jepsen's original checker, and the ok, fail and info way of recording operations.
