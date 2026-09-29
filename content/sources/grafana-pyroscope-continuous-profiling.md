---
id: grafana-pyroscope-continuous-profiling
title: What is continuous profiling? (Grafana Pyroscope documentation)
author: Grafana Labs
url: https://grafana.com/docs/pyroscope/latest/introduction/continuous-profiling/
kind: docs
primary: true
---

## Summary

Grafana's introduction to continuous profiling for its Pyroscope
product. Contrasts on-demand profiling with always-on sampling stored
in a database, and gives an overhead range for its own profilers.

## Key claims

- On-demand profiling is the traditional way. "Traditionally, profiling is used to debug applications on an as-needed basis." (What is continuous profiling?)
- Continuous profiling stores sampled profiles for later. "It uses low-overhead sampling to collect profiles from production systems and stores the profiles in a database for later analysis." (What is continuous profiling?)
- Overhead range for Pyroscope's sampling profilers. "By using sampling profilers, Pyroscope and Cloud Profiles can collect data with minimal overhead (~2-5% depending on a few factors)." (Reduced operational costs)

## Visuals worth redrawing

None.

## My notes

- A vendor page with marketing tone; used only for the overhead range,
  which is the vendor's own figure for its own profilers, conditions
  not stated.
