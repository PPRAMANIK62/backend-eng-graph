---
id: gustafson-reevaluating-amdahl-1988
title: "Reevaluating Amdahl's Law"
author: John L. Gustafson
url: http://www.johngustafson.net/pubs/pub13/amdahl.htm
kind: paper
primary: true
---

## Summary

A one-page paper from Sandia National Laboratories. Amdahl's formula
assumes a fixed problem size; in practice people grow the problem to
fit the machine, so the parallel part grows with the processor count
and the serial part doesn't. Measured "scaled" speedups of about 1,020
on 1,024 processors. Also called Gustafson's law.

## Key claims

- Amdahl's formula with serial time s, parallel time p and N processors. "Speedup = (s + p ) / (s + p / N )" (first section)
- Its limit. "the maximum speedup obtainable from even an infinite number of parallel processors is only 1/s." (first paragraph)
- Speedups measured on a 1,024-processor hypercube for three applications with s = 0.4 to 0.8 percent: 1021, 1020 and 1016. (second section)
- The hidden assumption. "The expression and graph both contain the implicit assumption that p is independent of N, which is virtually never the case." (third section)
- What people really do. "in practice, the problem size scales with the number of processors." (third section)
- So fix the time, not the work. "it may be most realistic to assume that run time, not problem size, is constant." (third section)
- The serial parts (startup, program loading, serial bottlenecks, I/O) don't grow with problem size. (fourth section)
- Scaled speedup is a straight line: "Scaled speedup = (s' + p' x N ) / (s' + p')" which equals N + (1 − N) × s'. (fourth section)
- Amdahl's formula makes big speedups look near impossible. "implies that very few problems will experience even a 100-fold speedup." (first section)

## Visuals worth redrawing

- Figure 2: fixed-size vs scaled-size speedup side by side. Not
  reproduced on the web page.

## My notes

- The page doesn't show the year. Gustafson's own "Gustafson's Law"
  page on the same site says he wrote it in 1988.
