---
id: spinnaker-canary-best-practices
title: Best practices for configuring canary (Spinnaker docs)
author: Spinnaker project
url: https://spinnaker.io/docs/guides/user/canary/best-practices/
kind: docs
primary: true
---

## Summary

Spinnaker's advice for automated canary analysis with Kayenta: compare
with a fresh baseline, run long enough, pick thresholds and metrics
carefully, share configs, and debug with retrospective analysis.

## Key claims

- One failing metric can hide in a big group. "If you have many metrics in a group and one fails while the rest pass, the group gets a passing score overall." (Don't put too many metrics in one group)
- Critical metrics fail the whole canary. "This causes the entire canary to fail immediately (score = 0) if that metric is classified as High or Low, regardless of group scores." (Don't put too many metrics in one group)
- Compare with a baseline started at the same time, not with production. "Instead always compare the canary against an equivalent baseline, deployed at the same time." (Compare canary against baseline)
- The baseline controls for warm-up and heap effects. "In this way, you control for version and configuration only, and you reduce factors that could affect the analysis, like the cache warmup time, the heap size, and so on." (Compare canary against baseline)
- At least 50 data points per metric; plan for hours. "You need at least 50 pieces of time series data per metric for the statistical analysis to produce accurate results." (Run the canary for enough time)
- Starting point: 3-hour lifetime, 1-hour interval. "A good starting point is to have a canary lifetime of 3 hours, an interval of 1 hour and no warm-up period" (Run the canary for enough time)
- Two thresholds, starting at marginal 75 and pass 95. (Carefully choose your thresholds)
- Use latency, errors and saturation. (Carefully choose the metrics to analyze)
- Configs need refining over time. "Keep in mind that your configuration will be refined over time." (Carefully choose your thresholds)
- Retrospective analysis replays past data to tune a config fast. "This analysis is based on past monitoring data, without having to wait for the data points to be generated." (Use retrospective analysis)
- The baseline matches the canary in time, size and traffic. "Same time of deployment Same size of deployment Same type and amount of traffic" (Compare canary against baseline, list)
- What the two thresholds mean. "If a canary run scores below this threshold, the whole canary fails immediately." (Carefully choose your thresholds, marginal); "The final canary run must score at or above this threshold for the analysis to be considered successful." (pass)

## Visuals worth redrawing

- Production, baseline and canary side by side, with the baseline and
  canary the same size.

## My notes

- Docs page carries a "Last modified" line; no version number.
