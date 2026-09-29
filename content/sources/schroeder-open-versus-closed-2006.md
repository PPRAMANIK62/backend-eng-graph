---
id: schroeder-open-versus-closed-2006
title: "Open Versus Closed: A Cautionary Tale"
author: Bianca Schroeder, Adam Wierman, Mor Harchol-Balter (Carnegie Mellon University)
url: https://www.usenix.org/legacy/event/nsdi06/tech/full_papers/schroeder/schroeder.pdf
kind: paper
primary: true
---

## Summary

NSDI 2006. Load generators come in two kinds: closed (a fixed number of
users, each waiting for a reply before sending again) and open
(requests arrive on their own schedule). The paper shows with real
systems and simulation that the two give very different response
times at the same load, and gives rules of thumb for choosing which
one matches a real workload, including a partly-open model of
sessions.

## Key claims

- Closed. "In a closed system model, new job arrivals are only triggered by job completions (followed by think time)" (1 Introduction)
- Open. "By contrast in an open system model, new jobs arrive independently of job completions" (1 Introduction)
- The choice is usually made by the tool. "the “choice” of a system model (closed versus open) is often not really a researcher’s choice, but rather is dictated by the availability of the workload generator." (1 Introduction)
- Most generators of the time were closed. "Most of these generators/benchmarks assume a closed system model, although a reasonable fraction assume an open one." (1 Introduction, Table 1)
- And their docs didn't say. "the builders often do not seem to view this as an important factor worth mentioning in the documentation." (1 Introduction)
- Size of the gap. "for a fixed load, the mean response time for an open system model can exceed that for a closed system model by an order of magnitude or more." (1 Introduction)
- Load in an open system. "Here load, ρ, is the product of the mean arrival rate of requests, λ, and the mean service demand E[S]." (2 Closed, open, and partly-open systems)
- Principle (ii). "As the MPL grows, closed systems become open, but convergence is slow for practical purposes." (5.1)
- Even at MPL 1000, when job sizes vary a lot. "When the service demand has high variability (C 2 ), a closed system with an MPL of 1000 still has much lower response times then the corresponding open system" (5.1)
- Why: fewer short jobs stuck behind long ones. "for lower MPL there are fewer short jobs stuck behind long jobs in a closed system" (5.1)
- Principle (iii), job size variability matters less in closed systems. "the effect is much smaller in closed systems." (5.1)
- Partly-open rule of thumb. "A partly-open system behaves similarly to an open system when the expected number of requests per session is small (≤ 5 as a rule-of-thumb) and similarly to a closed system when the expected number of requests per session is large (≥ 10 as a rule-of-thumb)." (6, Principle vii)
- Choosing. "A high number of simultaneous users (more than 1000) suggests an open model, but a high number of requests per session (more than 10) suggests a closed model." (9 Conclusion)
- Think time doesn't decide it. "Contrary to popular belief, it turns out that think times are irrelevant to the choice of an open or closed model" (9 Conclusion)
- The cost of choosing wrong. "in capacity planning for an open system, choosing a workload generator based on a closed model can greatly underestimate response times and underestimate the benefits of scheduling." (9 Conclusion)

## Visuals worth redrawing

- Figure 1: closed (users think, send, receive), open (new arrivals
  into a queue), partly open (with probability p submit again).

## My notes

- Table 1 classifies the web load generators of 2006; most are closed,
  httperf is open. The tools have changed since; the split hasn't.
