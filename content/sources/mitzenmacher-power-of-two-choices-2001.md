---
id: mitzenmacher-power-of-two-choices-2001
title: The Power of Two Choices in Randomized Load Balancing
author: Michael Mitzenmacher
url: https://www.eecs.harvard.edu/~michaelm/postscripts/tpds2001.pdf
kind: paper
primary: true
---

## Summary

IEEE Transactions on Parallel and Distributed Systems 12(10), 2001
(from his 1996 thesis work). In the "supermarket model", each arriving
job samples d servers at random and joins the one with the shortest
queue. Going from d = 1 to d = 2 cuts the expected time in the system
exponentially; more choices help only by a constant factor. Backed by
simulations of 100 and 500 queues.

## Key claims

- The model: pick d servers at random, join the one with the fewest customers. "Each customer chooses some constant d servers independently and uniformly at random from the n servers and waits for service at the one with the fewest customers." (Abstract)
- Two choices give an exponential improvement over one; three only a constant factor more than two. "Having d = 2 choices leads to exponential improvements in the expected time a customer spends in the system over d = 1, whereas having d = 3 choices is only a constant factor better than d = 2." (Abstract; the "=" signs are lost in the PDF text layer)
- Rule of thumb for system design. "Systems where items have two (or a small number of) choices can perform almost as well as a perfect load balancing system with global load knowledge." (1 Introduction)
- Two choices may beat cleverer schemes because they cost less. "because a system based on two choices can have significantly lower overhead, it is possible it may perform better than apparently better but more complicated load balancing algorithms." (1 Introduction)
- Simulations chose without replacement, as in practice. "In these simulations, choices were made without replacement as this method is more likely to be used in practice." (4 Simulation Results)
- The effect shows up in small systems too. "even of relatively small systems on the order of 100 queues." (4 Simulation Results)
- Table 2, 500 queues at arrival rate 0.99 of capacity, average time in system (service time mean 1): d = 1: 100.00 (predicted, 1/(1 - 0.99)); d = 2: 5.5413 simulated (5.4320 predicted); d = 3: 3.9518 (3.8578); d = 5: 3.0012 (2.9017). (Table 2, page 1101; the table is an image, read from the rendered page)
- Table 1, 100 queues, d = 2: average time 1.2673 at arrival rate 0.50, 2.6454 at 0.90, 5.9275 at 0.99. (Table 1, page 1101, image)

## Visuals worth redrawing

- Fig. 1: the supermarket model with d = 2.
- Fig. 2: average time vs arrival rate for d = 2 against one choice.

## My notes

- The model assumes fresh queue lengths at the moment of choice. Real
  balancers see stale counts; the paper's reference [27] ("How Useful
  is Old Information?") covers that, not opened.
- Time units: service time is exponential with mean 1, so "5.5" means
  5.5 average service times.
