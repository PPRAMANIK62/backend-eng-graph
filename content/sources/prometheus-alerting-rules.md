---
id: prometheus-alerting-rules
title: Alerting rules (Prometheus documentation)
author: Prometheus authors
url: https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/
kind: docs
primary: true
---

## Summary

How an alert is defined in Prometheus: a PromQL expression, an optional
`for` duration (pending before firing), an optional `keep_firing_for`,
labels such as severity, and annotations for summaries and runbook
links. Prometheus only decides what's firing; the Alertmanager sends
the notifications.

## Key claims

- An alert is active while its expression returns results. "Whenever the alert expression results in one or more vector elements at a given point in time, the alert counts as active for these elements' label sets." (Alerting rules)
- The `for` clause makes an alert wait in pending state. "Elements that are active, but not firing yet, are in the pending state." (Defining alerting rules)
- Without `for`, an alert fires on the first evaluation. "Alerting rules without the for clause will become active on the first evaluation." (Defining alerting rules)
- `keep_firing_for` keeps an alert firing after the condition clears, against flapping. "This can be used to prevent situations such as flapping alerts, false resolutions due to lack of data loss, etc." (Defining alerting rules)
- Annotations hold descriptions and runbook links. "The annotations clause specifies a set of informational labels that can be used to store longer additional information such as alert descriptions or runbook links." (Defining alerting rules)
- Prometheus is not a full notification system; Alertmanager adds the rest. "Another layer is needed to add summarization, notification rate limiting, silencing and alert dependencies on top of the simple alert definitions." (Sending alert notifications)

## Visuals worth redrawing

None.

## My notes

- The page is under /latest/, so it tracks the current Prometheus
  release; no version number is printed on it.
