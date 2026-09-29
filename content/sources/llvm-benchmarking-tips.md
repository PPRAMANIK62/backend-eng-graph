---
id: llvm-benchmarking-tips
title: Benchmarking tips (LLVM docs)
author: LLVM Project
url: https://llvm.org/docs/Benchmarking.html
kind: docs
primary: true
---

## Summary

LLVM's short guide to cutting noise when benchmarking a compiler
patch on Linux: turn off frequency scaling, Turbo Boost and address
randomization, avoid storage, reserve cores and switch off their SMT
siblings.

## Key claims

- Noise isn't the only problem. "Note that low noise is required, but not sufficient. It does not exclude measurement bias." (Introduction; cites Mytkowicz et al., ASPLOS 2009)
- Repeat. "Run the benchmark multiple times to be able to recognize noise." (General)
- Fix the CPU. "Disable frequency scaling, Turbo Boost and address space randomization (see OS-specific section)." (General)
- Avoid storage. "Putting the program, inputs and outputs on tmpfs avoids touching a real storage system, which can have a pretty big variability." (General)
- Governor. "Set scaling_governor to performance:" (Linux)
- SMT. "Disable the SMT pair of the cpus you will use for the benchmark." (Linux)
- What you get. "With these in place you can expect perf variations of less than 0.1%." (Linux)
- Quiet the machine. "Disable as many processes or services as possible on the target system." (Linux)
- Reserve cores with cset. "Use https://github.com/lpechacek/cpuset to reserve CPU cores for just the program you are benchmarking." (Linux; the command is `cset shield -c N1,N2 -k on`)

## Visuals worth redrawing

None.

## My notes

- Disagrees with pyperf on ASLR (pyperf: never disable it, run many
  processes instead).
