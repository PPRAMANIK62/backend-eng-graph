---
id: donnemartin-system-design-primer
title: The System Design Primer
author: Donne Martin and contributors
url: https://github.com/donnemartin/system-design-primer
kind: docs
primary: false
---

## Summary

A large community-maintained GitHub guide to system design. Read here
for its section "How to approach a system design interview question"
(four steps) and its appendix for back-of-the-envelope estimates (a
powers-of-two table and a copy of the latency numbers).

## Key claims

- Step 1 is use cases, constraints and assumptions. "Step 1: Outline use cases, constraints, and assumptions" (How to approach a system design interview question)
- The questions include volume, request rate and read/write ratio. "What is the expected read to write ratio?" (Step 1 list)
- Steps 2 to 4: high-level design, core components, then scale it. "Step 4: Scale the design" (How to approach...)
- Scaling means finding and fixing bottlenecks. "Identify and address bottlenecks, given the constraints." (Step 4)
- Everything is a trade-off. "Discuss potential solutions and trade-offs. Everything is a trade-off." (Step 4)
- The appendix gives a powers-of-two table: 2^10 ≈ 1 thousand (1 KB), 2^20 ≈ 1 million (1 MB), 2^30 ≈ 1 billion (1 GB), 2^40 ≈ 1 trillion (1 TB). (Appendix, Powers of two table)
- Handy rules derived from the latency table include about 2,000 round trips per second inside a data centre. "2,000 round trips per second within a data center" (Appendix, Handy metrics)

## Visuals worth redrawing

None.

## My notes

- Secondary; its latency table is a copy of Dean's and Norvig's with an
  SSD row added. Cite it only for the method steps and the powers of two.
