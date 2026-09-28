---
id: colin-scott-interactive-latency
title: Latency Numbers Every Programmer Should Know (interactive)
author: Colin Scott
url: https://colin-scott.github.io/personal_website/research/interactive_latency.html
published: undated (year slider to 2020)
accessed: 2026-09-28
kind: blog
primary: false
---

## Summary

An interactive version of the classic latency table with a year slider.
The page's own source code shows how each number is produced: Norvig's 2002
numbers, projected forward and backward with exponential curves, several
of them held flat after a cutoff year. Useful to show where the popular
numbers come from, and that many are extrapolations, not measurements.

## Key claims

- The base numbers come from Norvig and date from 2002. "All of Norvig's original numbers were from 2002" (script comments)
- Numbers are projected with exponential curves. "Exponential functions have the form: y = a*b^x" (script comments)
- Clock speed is held at about 3 GHz from 2005. "Clock speed stopped at ~3GHz in ~2005" (getCycle)
- Memory latency fell about 7% a year until 2000, then is held at 100 ns. "15 years ago, it was decreasing 7% / year" and `var ms = 100; // ns` for years after 2000 (getMemLatency)
- SSD random read latency is projected to 2014, then held at 16,000 ns (16 µs). `return 16000;` (getSSDLatency; source cited: a FAST 2012 paper)
- Same-datacenter round trip is fixed at 500 µs. "Assume this doesn't change much?" with `return 500000; // ns` (getDCRTT)
- Wide-area round trip fixed at 150 ms, with the note that the speed of light is the limit. "Speed of light is ultimately fundamental" (getWanRTT)

## Visuals worth redrawing

- The page's grid of squares per latency (1 square = 1 ns and up) is a nice
  idea for showing orders of magnitude; redraw with our own numbers.

## My notes

- Norvig's page (norvig.com/21-days.html, section "Answers") was opened
  2026-09-28 during candidate research: main memory 100 ns, disk seek 8 ms,
  US to Europe and back 150 ms, "on a typical PC". Not cited separately.
