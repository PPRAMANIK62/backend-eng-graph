---
id: kleppmann-interleaving-anomalies-2019
title: Interleaving anomalies in collaborative text editors
author: Martin Kleppmann, Victor B. F. Gomes, Dominic P. Mulligan, Alastair R. Beresford
url: https://martin.kleppmann.com/papers/interleaving-papoc19.pdf
kind: paper
primary: true
---

## Summary

A PaPoC 2019 workshop paper showing that convergence isn't enough for a
text-editing CRDT. Two people typing at the same spot can end up with
their words mixed letter by letter, and every replica agrees on that
garbled text. Logoot and LSEQ do this; RGA does a milder version.

## Key claims

- CRDTs implement strong eventual consistency: eventual delivery, convergence, termination. "CRDTs implement a consistency model called strong eventual consistency [6, 19], defined by the following properties:" (1.1)
- Convergence: same set of updates, in any order, gives the same state. "If the same set of updates have been applied (possibly in a different order) on two replicas then those two replicas have equivalent state." (1.1)
- Convergence alone doesn't make an editor usable. "Unfortunately convergence alone does not guarantee that a collaborative text editor is usable." (Abstract)
- A silly merge could still converge, so SEC is necessary but not sufficient. "the convergence property for a document could be met by storing all inserted characters in lexicographical order, but this does not represent a useful document editing system." (1.1)
- The anomaly: concurrent insertions at one spot interleave character by character. "the merging algorithm randomly interleaves the two insertions of ‘ Alice’ and ‘ Charlie’ character by character, resulting in an unreadable jumble of characters." (2)
- Which algorithms do it. "Two published CRDTs for collaborative text editing, Logoot [21, 22] and LSEQ [12, 13], suffer from this problem" (2)
- RGA avoids the full anomaly but has a lesser one. "RGA can exhibit a lesser variant of the anomaly, which we describe in Section 3." (2)
- Cause: each character gets a position from a dense ordered set, so two runs of positions between the same neighbours mix. "Conceptually, these algorithms work by assigning every character of the text a unique position identifier from a dense ordered set" (2)
- Seen in practice, not just in theory. "We performed tests with open source implementations of Logoot [1, 2] and LSEQ [5, 12], and observed this interleaving anomaly occurring in practice [8]." (2)

## Visuals worth redrawing

- Figure 2: "Hello!" edited to "Hello Alice!" and "Hello Charlie!" merging into "Hello Al Ciharcliee!".
- Figure 3: the same thing with rational-number positions under each character.

## My notes

- Text CRDTs belong mostly to realtime-sync (phase 17); here the paper is the clearest proof that "converges" and "does what users want" are different things.
