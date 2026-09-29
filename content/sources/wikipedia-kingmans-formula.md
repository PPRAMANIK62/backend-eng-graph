---
id: wikipedia-kingmans-formula
title: "Kingman's formula"
author: Wikipedia contributors
url: https://en.wikipedia.org/wiki/Kingman%27s_formula
kind: docs
primary: false
---

## Summary

A short encyclopedia article on Kingman's formula, an approximation for
the mean wait in a single-server queue with any arrival and service
distributions (G/G/1). The wait is a product of a utilization term, a
variability term and the mean service time.

## Key claims

- What it is. "Kingman's formula, also known as the VUT equation, is an approximation for the mean waiting time in a G/G/1 queue." (lead)
- Its three terms. "The formula is the product of three terms which depend on utilization (U), variability (V) and service time (T)." (lead)
- Origin: John Kingman's 1961 paper "The single server queue in heavy traffic". (lead)
- Accuracy. "It is known to be generally very accurate, especially for a system operating close to saturation." (lead)
- The formula: E(Wq) ≈ (ρ/(1−ρ)) × ((ca² + cs²)/2) × τ, where τ is the mean service time, ρ the utilization, and ca, cs the coefficients of variation (standard deviation over mean) of the times between arrivals and of service times. (Statement of formula)

## Visuals worth redrawing

None.

## My notes

- Secondary, but the formula is standard. Kingman's 1961 paper is
  behind a publisher's paywall and wasn't opened.
- With Poisson arrivals and exponential service, both coefficients of
  variation are 1, so the middle term is 1 and it reduces to the M/M/1
  wait, ρ/(1−ρ) × τ.
