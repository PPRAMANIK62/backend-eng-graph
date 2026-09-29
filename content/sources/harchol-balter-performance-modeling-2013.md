---
id: harchol-balter-performance-modeling-2013
title: "Performance Modeling and Design of Computer Systems: Queueing Theory in Action, chapter 1"
author: Mor Harchol-Balter
url: https://www.cs.cmu.edu/~harchol/PerformanceModeling/chpt1.pdf
kind: book
primary: true
---

## Summary

The free first chapter of a CMU professor's queueing textbook (Cambridge
University Press, 2013). It says what queueing theory is for
(predicting delay, and capacity planning) and runs through design
puzzles whose answers surprise people: doubling load needs less than
double the speed, a faster server can do nothing in a closed system,
and one fast server vs many slow ones depends on job-size variability.

## Key claims

- What it is. "Queueing theory is the theory behind what happens when you have lots of jobs, scarce resources, and subsequently long queues and delays." (1.1)
- Queues are everywhere in a computer: CPU scheduler, disk, router buffers, memory banks, database lock queues, server farms. (1.1)
- Capacity planning is one of its main uses. "Commonly this takes the form of capacity planning, where one determines which additional resources to buy to meet delay goals" (1.1)
- The usual assumptions make the math easy. "Markovian assumptions, such as assuming Exponentially distributed service demands or a Poisson arrival process, greatly simplify the analysis" (1.1)
- And they can be wrong. "in some cases Markovian assumptions are very far from reality; for example, in the case in which service demands of jobs are highly variable or are correlated." (1.1)
- Doubling the arrival rate needs less than double the speed (example λ = 3, μ = 5 jobs per second). "It turns out that doubling CPU speed together with doubling the arrival rate will generally result in cutting the mean response time in half!" (1.2, Design Example 1)
- In a closed system with 6 jobs always present, making one of two servers twice as fast barely helps. "Both the average response time and throughput are hardly affected." (1.2, Design Example 2)
- The same change in an open system, where arrivals don't wait for completions, does help. "Absolutely!" (1.2, Design Example 2)
- One fast server or n slow ones. "the answer depends on the variability of the job size distribution, as well as on the system load." (1.2, Design Example 3)
- High variability favors many servers. "When job size variability is high, we prefer many slow servers because we do not want short jobs getting stuck behind long ones." (1.2, Design Example 3)
- Low load favors one fast server. "When load is low, not all servers will be utilized, so it seems better to go with one fast server." (1.2, Design Example 3)
- Simplified workload models mislead. "I have found many cases where making simplifying assumptions about the workload can lead to very inaccurate performance results and poor system designs." (1.1)

## Visuals worth redrawing

- Figure 1.2: one CPU serving a FCFS queue, λ = 3, μ = 5, "if λ goes to
  2λ, by how much should μ increase?"
- Figures 1.3 and 1.4: the same two servers as a closed and an open
  system.

## My notes

- The chapter only states results; proofs are in later chapters that
  weren't opened (13 for the doubling result, 7 for the closed system).
- The year comes from the author's book page, which says it was
  published in 2013.
