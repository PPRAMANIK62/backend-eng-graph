---
id: amdahls-law
title: Amdahl's law
depth: short
phase: 9
note: >-
  The part you can't parallelize caps your speedup, and why more threads
  can even make it slower.
needs: [concurrency-vs-parallelism]
leads_to: [universal-scalability-law]
compare_with: [littles-law]
---

# Amdahl's law

Amdahl's law says that if part of a job has to run one step at a time,
that part sets a ceiling on how much faster more cores can make the
whole job. With 5% of the work serial, no number of cores gets you past
20 times faster. It's the first thing to reach for when adding threads
or machines stops helping.

## The ceiling

Take a job that takes 1 second on one core. A fraction s of it is
serial: it can't be split, say because it runs under a single lock or
walks a list one item at a time. The rest, 1 − s, splits evenly over N
cores (for the split itself, see [[concurrency-vs-parallelism]]). The
serial part still takes s; the parallel part takes (1 − s) / N. So the
speedup is:

speedup = 1 / (s + (1 − s) / N)

As N grows, the second term shrinks toward zero and the speedup
approaches 1 / s. With 10% serial, 8 cores give 1 / (0.1 + 0.9 / 8),
about 4.7 times, and a million cores still can't beat 10 times. The
curve is steep near s = 0: even a small serial share caps you well
below the number of cores.

Gene Amdahl made this argument in 1967, against the idea that the
future lay in many connected processors. His paper has no equation at
all. He observed that data-management "housekeeping" was about 40% of
the instructions in production programs and looked inherently serial,
which alone would limit throughput to five to seven times the
sequential rate. His conclusion: parallel speed is wasted unless
sequential speed improves nearly as much.

## Why it was only half the story

In 1988 John Gustafson reported speedups of about 1,020 on a
1,024-processor machine at Sandia, for three real programs whose serial
part was 0.4 to 0.8 percent. Amdahl's formula said that should be
nearly impossible.

His point was that the formula assumes a fixed amount of work. Nobody
buys a machine 1,000 times bigger to solve the same small problem
faster; they solve a bigger problem in the same time. The serial parts
(startup, loading, I/O) stay the same size while the parallel part
grows with the machine. Measured that way, "scaled speedup" is a
straight line: N + (1 − N) × s.

The two views answer different questions, and a backend has both:

- **One request's latency** is a fixed-size job. If a request does
  some work under a global lock, more cores won't make that request
  faster than the lock allows. Amdahl applies.
- **Throughput across many independent requests** is a growing job.
  More users bring more requests that don't depend on each other, so
  throughput can grow with cores, as long as the requests don't share
  anything. Gustafson applies, until they do share something.

## When more threads make it slower

Amdahl's law is the optimistic case: throughput levels off but never
drops. Real systems often get worse past some point, because workers
also pay to keep shared data consistent with each other. Neil Gunther's
[[universal-scalability-law]] adds that second cost to the formula, and
gives the curve a peak.

## Where it gets tricky

**The serial fraction isn't written in the code.** You rarely know it
by reading a program. You measure throughput at several worker counts
and fit the curve to the points.

**Linear speedup is rare.** Gustafson's straight line is the best case; getting truly linear
speedup has turned out to be hard in practice.

**Gustafson doesn't make Amdahl wrong.** Both formulas are correct;
they differ on what stays fixed, the work or the time. Ask which one
your problem is before quoting either.

## What this means when you build

- Before adding threads or machines, find the serial part: a global
  lock, a single writer, a hot row, a leader everything goes through.
  Shrinking it raises the ceiling; more cores don't.
- Measure throughput at 1, 2, 4, 8 and more workers. If the curve
  flattens, look for contention; if it turns down, look for shared
  writable state.
- Don't size a [[thread-pool]] past the peak. More threads than that
  cost throughput, not just memory.
- Contention makes each request slower as concurrency rises, so the
  latency in [[littles-law]] isn't a constant: more in flight means
  slower requests, which means even more in flight.

## Further reading

- [Validity of the Single Processor Approach to Achieving Large Scale Computing Capabilities](https://www3.cs.stonybrook.edu/~rezaul/Spring-2012/CSE613/reading/Amdahl-1967.pdf), Gene M. Amdahl, 1967 (reprinted 2007). The original three-page argument, with no formula in it.
- [Reevaluating Amdahl's Law](http://www.johngustafson.net/pubs/pub13/amdahl.htm), John L. Gustafson, 1988. The formula, its hidden fixed-size assumption, and scaled speedup.
- [A General Theory of Computational Scalability Based on Rational Functions](https://arxiv.org/abs/0808.1431), Neil J. Gunther, 2008. Amdahl, Gustafson and the Universal Scalability Law as one family, and why throughput can peak and fall.
