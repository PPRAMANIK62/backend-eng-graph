---
id: grafana-k6-breakpoint-testing
title: Breakpoint testing (Grafana k6 docs)
author: Grafana Labs
url: https://grafana.com/docs/k6/latest/testing-guides/test-types/breakpoint-testing/
kind: docs
primary: true
---

## Summary

k6's guide to the test that ramps load until the system fails, to find
its limits. Covers when to run one, what counts as failure, and why an
arrival-rate executor suits it.

## Key claims

- Purpose. "Breakpoint testing aims to find system limits." (intro)
- Other names. "In some testing conversation, it’s also known as capacity, point load, and limit testing." (intro)
- Turn off autoscaling. "The elastic environment may grow as the test moves further, finding only the limit of your cloud account bill." (Considerations)
- Ramp slowly. "A sudden increase may make it difficult to pinpoint why and when the system starts to fail." (Considerations)
- Failure has levels; the first is "Degraded performance. The response times increased, and user experience decreased." (Considerations; then troublesome performance, timeouts, errors, system failure)
- Run it last. "Run breakpoints only when the system is known to perform under all other test types." (Considerations)
- Load keeps rising as the system slows. "Different from other load test types, which should be stopped when the system degrades to a certain point, breakpoint load increases even as the system starts to degrade." (Breakpoint testing in k6; hence ramping-arrival-rate)
- It has to break. "A breakpoint test must cause system failure." (Results analysis)

## Visuals worth redrawing

None.

## My notes

- Pairs with the open-vs-closed page: a closed (VU-based) ramp would
  slow its own arrival rate as the server slows.
