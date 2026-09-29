---
id: universal-scalability-law
title: Universal Scalability Law
depth: short
phase: 9
note: >-
  Why throughput stops growing, then falls, as you add workers:
  contention plus the cost of keeping them in step.
needs: [amdahls-law]
leads_to: []
compare_with: []
---

# Universal Scalability Law

[[amdahls-law|Amdahl's law]] says a system's speedup levels off once the
serial part dominates. Real systems often do worse: past some number of
workers, adding more makes throughput fall. The Universal Scalability
Law (USL), from Neil Gunther, is a formula for that shape. It has two
parameters you fit to measurements, and each one points at a different
kind of problem to fix.

## Two costs of adding workers

The USL gives throughput with p workers, relative to one worker:

C(p) = p / (1 + σ(p − 1) + κp(p − 1))

- **σ, contention.** Time spent waiting in line for something only one
  worker can use: a [[mutex|lock]], a single log writer, one hot
  database row. This is Amdahl's serial fraction. With κ = 0 the USL
  is exactly Amdahl's law, and throughput flattens toward 1/σ.
- **κ, coherency.** The cost of workers keeping shared data consistent
  with each other: caches passing a written value back and forth, nodes
  exchanging state. Its term grows with p², so as you add workers it
  eventually outgrows everything else.

With any κ above zero, the curve has a peak at √((1 − σ) / κ) workers.
Past it, throughput goes backwards. Gunther calls that retrograde
scaling, and it's most common in work on shared writable data: online
reservation systems, updates to database records.

![Speedup over one core against the number of cores, from 1 to 64. A dashed line shows perfect scaling. The Amdahl curve for 5% serial work rises and flattens toward a dotted ceiling at 20. The USL curve with the same 5% plus a small coherency cost rises alongside it, peaks near 31 cores at about 9 times, then slowly falls: more cores, less throughput.](img/universal-scalability-law-curve.svg)

*Amdahl's law with σ = 0.05, and the USL with the same σ and κ = 0.001 (example values, not measurements). Adapted from Neil J. Gunther, "A General Theory of Computational Scalability Based on Rational Functions", figure 1 (2008).*

As a worked example with those made-up values, σ = 0.05 and κ = 0.001,
the peak is at √(0.95 / 0.001), about 31 workers, where throughput is
31 / (1 + 0.05 × 30 + 0.001 × 31 × 30), about 9 times one worker. At 64
workers it is lower than at 31.

## Using it: fit, don't guess

You can't read σ or κ off the code. The USL is a model with fitting
parameters: measure throughput at a range of worker counts (1, 2, 4, 8
and up), fit σ and κ to the points, and read the result:

- **Large σ, tiny κ:** the curve flattens. Look for a serialization
  point, a lock or a single writer, and shrink it.
- **Noticeable κ:** the curve turns down. Look for shared writable
  state that every worker touches, and partition it so workers stop
  talking to each other.
- **The peak** tells you the most workers worth running. More than that
  buys you less throughput for more money.

Underneath, Gunther shows that Amdahl's law and Gustafson's speedup are
both corollaries of a bound from [[queueing-theory]], and the USL is the
same kind of bound with one more term.

## Where it gets tricky

**A fit is not an explanation.** σ and κ describe the shape of the
curve you measured. They tell you what kind of cost to look for, not
where it is in the code; you still need a [[profiling|profiler]].

**Measure far enough.** With points only well below the peak, a small κ
is hard to tell apart from zero, and the model will happily predict
more than the system can do.

**The workload has to stay the same.** Each point must be the same work
per request at a different worker count. If requests get cheaper or
dearer as load rises (caches warming, queues forming), you're fitting
something else.

## What this means when you build

- Load-test at several concurrency levels, not just one, and plot
  throughput against workers or nodes.
- Fit the USL to those points to find the peak before you size a
  [[thread-pool]], a connection pool or a cluster.
- If the curve bends down, adding machines is the wrong fix. Remove the
  shared state or partition it first.
- Use the fitted curve in [[capacity-planning]], with the peak as a hard
  ceiling.

## Further reading

- [A General Theory of Computational Scalability Based on Rational Functions](https://arxiv.org/abs/0808.1431), Neil J. Gunther, 2008. The USL, what σ and κ mean, the peak, and how Amdahl and Gustafson follow from a queueing bound.
