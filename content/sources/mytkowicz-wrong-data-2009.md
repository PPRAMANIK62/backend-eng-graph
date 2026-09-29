---
id: mytkowicz-wrong-data-2009
title: Producing Wrong Data Without Doing Anything Obviously Wrong!
author: Todd Mytkowicz, Amer Diwan, Matthias Hauswirth, Peter F. Sweeney
url: https://users.cs.northwestern.edu/~robby/courses/322-2013-spring/mytkowicz-wrong-data.pdf
kind: paper
primary: true
---

## Summary

ASPLOS 2009. Changing things that look irrelevant, like the size of
the UNIX environment or the order object files are linked, changes
memory layout and with it run time, enough to flip the answer to "is
-O3 faster than -O2?". The effect is common, unpredictable across
machines, and ignored by the papers they surveyed. They propose
randomizing the setup and causal analysis.

## Key claims

- The finding. "changing a seemingly innocuous aspect of an experimental setup can cause a systems researcher to draw wrong conclusions from an experiment." (Abstract)
- How much. "can dramatically (frequently by about 33% and once by almost 300%) change the performance of our program." (2 Origin of Measurement Bias, environment size on a Core 2)
- Why. "This phenomenon occurs because the UNIX environment is loaded into memory before the call stack." (2)
- The question it flips. "We show that changing the experimental setup often leads to contradictory conclusions about the speedup of O3." (1 Introduction; speedup = O2 run time / O3 run time)
- Not predictable. "the best link order on one microprocessor is often not the best link order on another microprocessor" (1 Introduction)
- Ignored in practice. "in a literature survey of 133 recent papers from ASPLOS, PACT, PLDI, and CGO, we determined that none of the papers with experimental results adequately consider measurement bias." (Abstract)
- The fix. "experimental setup randomization (or setup randomization for short), runs each experiment in many different experimental setups" (1 Introduction)
- Even the room matters. "the room temperature affects the CPU clock speed" (3 Experimental Methodology)

## Visuals worth redrawing

- Figure 1(b): cycles against environment size, a sawtooth of jumps.

## My notes

- Their hardware (Pentium 4, Core 2) is old; the point about layout is
  not.
