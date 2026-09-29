---
id: grafana-k6-dropped-iterations
title: Dropped iterations (Grafana k6 docs)
author: Grafana Labs
url: https://grafana.com/docs/k6/latest/using-k6/scenarios/concepts/dropped-iterations/
kind: docs
primary: true
---

## Summary

When k6's open-model executors can't start an iteration on schedule
because every virtual user is busy, they skip it and count it in the
`dropped_iterations` metric.

## Key claims

- The counter. "k6 tracks the number of unsent iterations in a counter metric, `dropped_iterations`." (intro)
- When open executors drop. "With `constant-arrival-rate` and `ramping-arrival-rate`, iterations drop if there are no free VUs." (Configuration-related iteration drops)
- Early in a test it points at the config. "If it happens at the beginning of the test, you likely just need to allocate more VUs." (Configuration-related iteration drops)
- Late in a test it points at the server. "If this happens later in the test, the dropped iterations might happen because SUT performance is degrading and iterations are taking longer to finish." (Configuration-related iteration drops)
- Many drops. "Many dropped iterations might indicate that your SUT has completely stopped responding." (SUT-related iteration drops)

## Visuals worth redrawing

None.

## My notes

- Dropped iterations are never sent, so they have no latency. A test
  that drops many has the same blind spot as a closed loop, unless the
  drops are treated as failures.
