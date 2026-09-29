---
id: brooker-backoff-jitter-2015
title: Exponential Backoff And Jitter
author: Marc Brooker, AWS Architecture Blog
url: https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
kind: blog
primary: true
---

## Summary

A simulation of many clients contending on one row with optimistic
concurrency control, used to compare no backoff, capped exponential
backoff, and three kinds of jittered backoff (full, equal,
decorrelated). Written by an AWS engineer in 2015, with a later note
that most AWS SDKs now use backoff with jitter in their standard and
adaptive retry modes.

## Key claims

- The setup: a simulator of OCC against a remote database, network delay mean 10 ms. "In this simulation, the network introduces delay with a mean of 10ms and variance of 4ms." (Introducing OCC)
- With N contending clients total work grows with N squared. "With N clients contending, the total amount of work done by the system increases with N2." (Introducing OCC; the page renders N² as "N2")
- Capped exponential backoff: multiply by a constant each attempt, up to a maximum. "Capped exponential backoff means that clients multiply their backoff by a constant after each attempt, up to some maximum value." (Adding Backoff)
- The formula (shown as an image of code): `sleep = min(cap, base * 2 ** attempt)`. (Adding Backoff, figure 3)
- Backoff alone helps a little; calls still come in clusters. "The problem also stands out: there are still clusters of calls." (Adding Backoff)
- Backoff only adds quiet times. "Instead of reducing the number of clients competing in every round, we’ve just introduced times when no client is competing." (Adding Backoff)
- Full jitter (image of code): `sleep = random_between(0, min(cap, base * 2 ** attempt))`. (Adding Jitter, figure 6)
- With jitter the gaps disappear and calls arrive at a roughly steady rate. "The gaps are gone, and beyond the initial spike, there’s an approximately constant rate of calls." (Adding Jitter)
- With 100 contending clients jitter cut the call count by more than half. "In the case with 100 contending clients, we’ve reduced our call count by more than half." (Adding Jitter)
- Equal jitter (image of code): `temp = min(cap, base * 2 ** attempt)`, `sleep = temp / 2 + random_between(0, temp / 2)`. (Adding Jitter, figure 10)
- Decorrelated jitter (image of code): `sleep = min(cap, random_between(base, sleep * 3))`. (Adding Jitter, figure 11)
- Full and equal jitter do about the same work; decorrelated does more. "the number of calls is approximately the same for “Full” and “Equal” jitter, and higher for “Decorrelated”." (Which approach)
- No-jitter backoff is the clear loser in both work and time. "The no-jitter exponential backoff approach is the clear loser." (Which approach)
- Equal jitter is the loser of the jittered ones; full vs decorrelated is less clear. "The “Full Jitter” approach uses less work, but slightly more time." (Which approach)
- No-jitter backoff takes more work and more time; equal jitter does slightly more work than full and takes much longer. "It not only takes more work, but also takes more time than the jittered approaches." / "It does slightly more work than “Full Jitter”, and takes much longer." (Which approach)
- Jitter doesn't change the N squared nature of the problem. "It’s worth noting that none of these approaches fundamentally change the N2 nature of the work to be done" (Which approach)
- Jittered backoff should be standard for remote clients. "The return on implementation complexity of using jittered backoff is huge, and it should be considered a standard approach for remote clients." (Which approach)
- Update note: most AWS SDKs now do backoff with jitter. "Most AWS SDKs now support exponential backoff and jitter as part of their retry behavior when using standard or adaptive modes." (Update note at the top)

## Visuals worth redrawing

- The time series of calls with plain exponential backoff (clusters with
  gaps) against full jitter (a roughly flat rate). Redraw as a schematic,
  without the simulated numbers.

## My notes

- The numbers come from a simulation of OCC contention, not production
  traffic. The code is in the aws-arch-backoff-simulator project.
