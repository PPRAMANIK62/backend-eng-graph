---
id: go-benchstat
title: benchstat command (golang.org/x/perf/cmd/benchstat)
author: The Go Authors
url: https://pkg.go.dev/golang.org/x/perf/cmd/benchstat
kind: docs
primary: true
---

## Summary

The Go team's tool for comparing benchmark results before and after a
change. Read for its advice on how many runs to take, how to spread
noise evenly, what its output means, and the multiple-testing trap.

## Key claims

- Run each benchmark many times. "Each benchmark should be run at least 10 times to gather a statistically significant sample of results." (Overview)
- What it computes. "For each benchmark, benchstat computes the median and the confidence interval for the median." (Overview)
- Non-parametric by default. "By default, units use "assume=nothing", so benchstat uses non-parametric statistics: median for summaries, and the Mann-Whitney U-test for A/B comparisons." [inner quotes around assume=nothing] (Overview)
- What the p-value means. "The p-value measures how likely it is that any differences were due to random chance (i.e., noise)." (Example)
- The ~ marker. "the "~" means benchstat did not detect a statistically significant difference between the two inputs." [inner quotes around ~] (Example)
- Interleave runs. "The best way to do this is to interleave before and after runs, rather than running, say, 10 iterations of the before benchmark, and then 10 iterations of the after benchmark." (Tips)
- Fix the number of runs. "Pick a number of benchmark runs (at least 10, ideally 20) and stick to it." (Tips)
- Don't rerun until it's significant. "If benchstat reports no statistically significant change, avoid simply rerunning your benchmarks until it reports a significant change." (Tips)
- The default threshold and what it implies. "By default, benchstat uses an ɑ threshold of 0.05, which means it is *expected* to show a difference 5% of the time even if there is no difference." (Tips)
- Many benchmarks means some false positives. "you should expect that about 5% of them will report a statistically significant change even if there is no difference between the before and after." (Tips)
- Less noise or more runs find smaller changes. "Reducing noise and/or increasing the number of benchmark runs will enable benchstat to discern smaller changes as "statistically significant"." (Tips)

## Visuals worth redrawing

None.

## My notes

- The docs page shows a pseudo-version for the module; the tool has no
  numbered releases.
