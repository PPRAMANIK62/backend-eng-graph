---
id: spinnaker-canary-judge
title: How canary judgment works (Spinnaker docs)
author: Spinnaker project
url: https://spinnaker.io/docs/guides/user/canary/judge/
kind: docs
primary: true
---

## Summary

How Spinnaker's default canary judge (NetflixACAJudge, used with
Kayenta) decides whether a canary is worse than its baseline: collect
metrics, handle missing data, remove outliers, compare each metric with
a Mann-Whitney U test, then score.

## Key claims

- Canary and baseline metrics are compared for significant degradation. "To assess the quality of a canary deployment against a baseline, metrics from both deployments are compared in order to check for significant degradation." (intro)
- Metric collection is Kayenta's job; the judge only analyses. "The judge merely receives timeseries from Kayenta and analyzes those." (Metric collection)
- Missing error data can mean zero errors. "Use nanStrategy: replace for error metrics where no data means zero errors." (Step 1)
- Outliers can be removed with IQR fences; default factor 3.0. "The default outlierFactor is 3.0." (Step 2)
- The test asks whether two sets of numbers differ. "It uses a statistical test that answers: “Are these two sets of numbers meaningfully different?”" (Mann-Whitney U test)
- 98% confidence before flagging. "The judge needs to be 98% confident there’s a real difference before flagging a metric" (Mann-Whitney U test)
- No assumption of a bell curve. "The test doesn’t assume your data follows any particular pattern (like a bell curve)" (Mann-Whitney U test)
- A metric is High or Low only if the interval is outside a tolerance band and the effect size passes a threshold. "The 98% confidence interval falls entirely outside a tolerance band" (Mann-Whitney U test, technical details)
- Group scores are the share of passing metrics, times 100. "Group Score = (Pass count / Total count) × 100" (Step 4: Score computation)

## Visuals worth redrawing

None.

## My notes

- Pluggable judges; this is only the default one.
