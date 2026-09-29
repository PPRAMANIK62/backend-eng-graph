---
id: cormode-count-min-2004
title: "An Improved Data Stream Summary: The Count-Min Sketch and its Applications"
author: Graham Cormode, S. Muthukrishnan
url: https://dsf.berkeley.edu/cs286/papers/countmin-latin2004.pdf
kind: paper
primary: true
---

## Summary

The paper that introduced the count-min sketch (LATIN 2004 version,
hosted on a Berkeley course page; the full version appeared in the
Journal of Algorithms, 2005). A d × w table of counters with one hash
function per row; add to one counter per row, estimate with the
minimum. Gives the error guarantee and how to size w and d.

## Key claims

- Named for its two steps: count, then take the minimum. "It is named after the two basic operations used to answer point queries, counting first and computing the minimum next." (3 Count-Min Sketches)
- Structure: a two-dimensional array of width w and depth d, with w = ⌈e/ε⌉ and d = ⌈ln(1/δ)⌉. "A Count-Min (CM) sketch with parameters (ε, δ) is represented by a two-dimensional array counts with width w and depth d" (3)
- Hash functions come from a pairwise-independent family. "Additionally, d hash functions h1 . . . hd : {1 . . . n} → {1 . . . w} are chosen uniformly at random from a pairwise-independent family." (3)
- Update adds the amount to one counter in each row. "then ct is added to one count in each row; the counter is determined by hj ." (3, Update Procedure)
- Space is w·d counters plus the hash functions. "The space used by Count-Min sketches is the array of wd counts" (3)
- Estimate is the minimum over the rows. "The answer to Q(i) is given by âi = minj count[j, hj (i)]." (4.1 Point Query)
- Guarantee: never under, and over by at most ε·(total count) with probability 1 − δ. "The estimate âi has the following guarantees: ai ≤ âi ; and, with probability at least 1 − δ, âi ≤ ai + ε||a||1 ." (4.1, Theorem 1)
- Update and query cost O(ln 1/δ). "The time to produce the estimate is O(ln 1δ ) since finding the minimum count can be done in linear time; the same time bound holds for updates." (4.1)
- The point-query guarantee is shown for the non-negative case (counts never go below zero). "We first show the analysis for point queries for the non-negative case." (4.1 Point Query)
- Finding heavy hitters (the most frequent items) is one of the problems it targets. "The φ-heavy hitters of a multiset of ||a||1 (integer) values each in the range 1 . . . n, consist of those items whose multiplicity exceeds the fraction φ of the total cardinality" (2 Preliminaries)

## Visuals worth redrawing

- The d × w counter grid with one item hashing to one cell per row.
  Redrawn in `count-min-sketch`.

## My notes

- The guarantee is for non-negative counts (the cache case).
- Error is relative to the total of all counts, not to the item's own
  count, so rare items' estimates can be mostly noise.
