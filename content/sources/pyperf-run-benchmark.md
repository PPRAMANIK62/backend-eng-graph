---
id: pyperf-run-benchmark
title: Run a benchmark (pyperf docs)
author: Victor Stinner and pyperf contributors
url: https://pyperf.readthedocs.io/en/latest/run_benchmark.html
kind: docs
primary: true
---

## Summary

How pyperf (2.10.0 docs) runs a benchmark: a calibration run, then many
worker processes, each doing a warmup that's thrown away and then a few
measured values. Why many processes: to average out randomness like
address space layout. Also notes on warmup and on benchmarks that never
settle.

## Key claims

- Many processes. "Then pyperf spawns 20 worker processes (Run 2 .. Run 21)." (pyperf architecture)
- Warmup thrown away. "Each worker starts by running the benchmark once to “warmup” the process, but this result is ignored in the final result." (pyperf architecture)
- Why many runs. "The number of runs should be large enough to reduce the effect of random factors like randomized address space layer (ASLR) and the Python randomized hash function." (Runs, values, warmups, outer and inner loops)
- Set warmups by looking. "The “warmups” parameter should be configured by analyzing manually values." (Runs, values, warmups)
- One warmup value is usually enough. "Usually, skipping the first value is enough to warmup the benchmark." (Runs, values, warmups)
- Goal of tuning. "The first goal is to avoid outliers only caused by other “noisy” applications, and not the benchmark itself." (How to get reproducible benchmark results)
- Some never settle. "On some benchmarks, performances are never stable" (JIT compilers; cites "Virtual Machine Warmup Blows Hot and Cold", 2016)
- Why not keep warming up until the numbers settle. "Running an arbitrary number of warmup values may also make the benchmark less reliable since two runs may use a different number of warmup values." (JIT compilers)

## Visuals worth redrawing

None.

## My notes

- The companion page (Tune the system for benchmarks) says "ASLR must
  not be disabled manually!" and covers CPU isolation and Turbo Boost.
