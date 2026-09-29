---
id: grafana-k6-open-vs-closed
title: Open and closed models (Grafana k6 docs)
author: Grafana Labs
url: https://grafana.com/docs/k6/latest/using-k6/scenarios/concepts/open-vs-closed/
kind: docs
primary: true
---

## Summary

How k6's executors map to the two workload models. VU-based executors
are closed: a virtual user starts its next iteration only after the
last one ends, so a slow server slows the test down. The arrival-rate
executors are open.

## Key claims

- Closed. "In short, in the closed model, VU iterations start only when the last iteration finishes." (intro)
- Open. "In the open model, on the other hand, VUs arrive independently of iteration completion." (intro)
- A stressed server slows a closed test. "when the target system is stressed and starts to respond more slowly, a closed model load test will wait, resulting in increased iteration durations and a tapering off of the arrival rate of new VU iterations." (Drawbacks of using the closed model)
- They name it. "In some testing literature, this problem is known as coordinated omission." (Drawbacks of using the closed model)
- Open executors. "k6 implements the open model with two arrival rate executors:" (Open model; constant-arrival-rate and ramping-arrival-rate)
- Example output for 1 iteration per second against an endpoint that takes about 6 s, showing 11 VUs in use. `running (1m09.3s), 000/011 VUs, 60 complete and 0 interrupted iterations` (Open model)
- Which executors are which. "Some executors use the closed model, while the arrival-rate executors use the open model." (intro; the closed example uses `constant-vus`)

## Visuals worth redrawing

None.

## My notes

- 1 per second × 6 s ≈ 6 in flight by Little's law; k6 had 11 VUs
  allocated. The page doesn't explain the gap.
