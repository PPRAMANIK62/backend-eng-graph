---
id: envoy-outlier-detection
title: Outlier detection (Envoy architecture overview)
author: Envoy Project Authors
url: https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/outlier
kind: docs
primary: true
---

## Summary

Envoy's passive health checking, read from the docs for Envoy
1.40.0-dev: watching real responses and connection failures, ejecting
hosts that stand out, and bringing them back after a growing timeout.

## Key claims

- Outlier detection finds hosts performing unlike the rest and removes them from the balancing set. "Outlier detection and ejection is the process of dynamically determining whether some number of hosts in an upstream cluster are performing unlike the others and removing them from the healthy load balancing set." (Outlier detection)
- It is passive health checking, and can run with active checks or alone. "Outlier detection is a form of passive health checking." (Outlier detection)
- Two kinds of error: from the upstream (an HTTP 500) and local (timeout, reset, connect failure). "Examples of locally originated errors are timeout, TCP reset, inability to connect to a specified port, etc." (Outlier detection)
- The TCP proxy can only see local errors, because it doesn't understand anything above TCP. "the tcp proxy filter does not understand any protocol above the TCP layer and reports only locally originated errors." (Outlier detection)
- A cap on how many hosts can be ejected. "If the number of ejected hosts is above the threshold, the host is not ejected." (Ejection algorithm, step 2)
- The cap is `max_ejection_percent`. "It checks to make sure the number of ejected hosts is below the allowed threshold (specified via the outlier_detection.max_ejection_percent setting)." (Ejection algorithm, step 2)
- Ejection time is the base time multiplied by the number of ejections in a row. "The number of milliseconds is equal to the outlier_detection.base_ejection_time value multiplied by the number of times the host has been ejected in a row." (Ejection algorithm, step 3)
- Ejection time grows with each ejection in a row, up to a max. "This causes hosts to get ejected for longer and longer periods if they continue to fail." (Ejection algorithm, step 3)
- Ejected hosts come back automatically. "An ejected host will automatically be brought back into service after the ejection time has been satisfied." (Ejection algorithm, step 4)
- A passing active check can uneject a host too early if the check doesn't test real traffic. "If your active health check is not validating data plane traffic then in situations where active health checking passes but the traffic is failing, the endpoint will be unejected prematurely." (Ejection algorithm, note)
- Detection types: consecutive 5xx, consecutive gateway failures (502, 503, 504), consecutive local failures, success rate (statistical), failure percentage (fixed threshold). (Detection types)

## Visuals worth redrawing

None.

## My notes

- This is per-host circuit breaking under another name.
