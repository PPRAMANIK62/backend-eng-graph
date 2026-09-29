---
id: amdahl-single-processor-1967
title: Validity of the Single Processor Approach to Achieving Large Scale Computing Capabilities
author: Gene M. Amdahl
url: https://www3.cs.stonybrook.edu/~rezaul/Spring-2012/CSE613/reading/Amdahl-1967.pdf
kind: paper
primary: true
---

## Summary

Amdahl's three-page paper from the AFIPS spring conference, 1967, read
as reprinted in IEEE SSCS News (2007) with a redrawn figure and an
editors' note. It argues that the sequential part of real programs
(data management "housekeeping", irregular problems) limits what many
parallel processors can deliver, so sequential speed still matters. The
law named after him isn't written as a formula in it.

## Key claims

- No formula in the original. "Interestingly, it has no equations and only a single figure." (editors' note)
- The sequential share he measured: housekeeping was "very nearly constant for about ten years, and accounts for 40% of the executed instructions in production runs." (page 1)
- The limit that follows. "Overhead alone would then place an upper limit on throughput of five to seven times the sequential processing rate, even if the housekeeping were done in a separate processor." (page 1)
- His conclusion. "the effort expended on achieving high parallel processing rates is wasted unless it is accompanied by achievements in sequential processing rates of very nearly the same magnitude." (page 1)
- Coordination costs too: two processors sharing memory take about 2.2 times the hardware and give about 1.8 times the performance, because of memory conflicts. "The resulting performance achieved would be about 1.8." (page 2)
- What he argued against: the idea that progress needed many connected computers. "truly significant advances can be made only by interconnection of a multiplicity of computers in such a manner as to permit cooperative solution." (page 1, opening)

## Visuals worth redrawing

- Figure 1: performance of three machine designs against the fraction
  of instructions that can run in parallel. Not needed.

## My notes

- Hosted on a Stony Brook course page, a scan of the SSCS News reprint.
- The formula everyone calls Amdahl's law comes later (see
  gustafson-reevaluating-amdahl-1988 and
  gunther-scalability-rational-functions-2008).
