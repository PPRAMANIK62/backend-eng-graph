---
id: gunther-scalability-rational-functions-2008
title: A General Theory of Computational Scalability Based on Rational Functions
author: Neil J. Gunther
url: https://arxiv.org/abs/0808.1431
kind: paper
primary: true
---

## Summary

Gunther's 2008 arXiv paper (v2) on the Universal Scalability Law
(USL), his model of throughput against processor count. It writes
Amdahl's law, Gustafson's speedup and the USL as one family of
formulas, and shows them as bounds of a closed queueing model. The USL
adds a second term for the cost of keeping data coherent, which makes
throughput peak and then fall.

## Key claims

- Amdahl's law with serial fraction σ on p processors: Sp = p / (1 + σ(p − 1)), which tends to 1/σ as p grows. (§2.1, equations 2 and 3)
- Gustafson's speedup, σ + (1 − σ)p, assumes the work grows with p; truly linear speedup is hard to get. "achieving truly linear speedup has turned out to be difficult in practice." (§2.2)
- The USL: Cp = p / (1 + σ(p − 1) + κp(p − 1)), with Cp the throughput on p processors over the throughput on one. (§2.3, equation 5)
- What σ means. "Contention-limited scalability due to serialization or queueing" (§2.3)
- What κ means. "Coherency-limited scalability due to inconsistent copies of data" (§2.3)
- With κ = 0 the USL is Amdahl's law. "In particular, (2) is identical to (5) with κ = 0." (§2.3)
- It has a peak, at p* = √((1 − σ)/κ). "The important implication is that beyond p∗ the throughput becomes retrograde." (§2.3)
- Where that happens. "This effect is commonly observed in applications that involve shared-writable data" (§2.3)
- Examples for the worst case (both terms): tasks on shared-writable data, online reservation systems, updating database records. (Table 1)
- The models are bounds of a queueing model. "Simpler rational functions, such as Amdahl’s law and Gustafson speedup, are corollaries of this queue-theoretic bound." (abstract)
- σ and κ are fitting parameters. "Each of the above-mentioned scalability models is distinguished by the number of coefficients or fitting parameters" (§1)

## Visuals worth redrawing

- Figure 1: USL, Amdahl and Gustafson curves against linear scaling,
  with the Amdahl ceiling at 1/σ. Redraw as throughput against cores.

## My notes

- Gunther runs a consultancy (Performance Dynamics) and the USL is his
  model, so primary: true for the USL.
- The paper is about fitting the model to measured throughput; σ and κ
  come from data, not from reading the code.
