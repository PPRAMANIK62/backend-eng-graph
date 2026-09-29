---
id: prometheus-alerting-practices
title: Alerting (Prometheus best practices)
author: Prometheus authors
url: https://prometheus.io/docs/practices/alerting/
kind: docs
primary: true
---

## Summary

The Prometheus project's short guide on what to alert on. Summarises
Ewaschuk's philosophy, then gives rules per kind of system: online
serving, offline processing, batch jobs, capacity, and monitoring the
monitoring.

## Key claims

- Summary of the approach. "keep alerting simple, alert on symptoms, have good consoles to allow pinpointing causes, and avoid having pages where there is nothing to do." (Alerting)
- Few alerts, on end-user pain. "Aim to have as few alerts as possible, by alerting on symptoms that are associated with end-user pain rather than trying to catch every possible way that pain could be caused." (What to alert on)
- Allow slack for blips. "Allow for slack in alerting to accommodate small blips." (What to alert on)
- Page on latency at one point only. "Only page on latency at one point in a stack." (Online serving systems)
- Low-traffic request types can be drowned out and may need their own alerts. "problems in a low-traffic type of request would be drowned out by high-traffic requests." (Online serving systems)
- Offline processing: alert on how long data takes to get through. "For offline processing systems, the key metric is how long data takes to get through the system" (Offline processing)
- Batch jobs: page if it hasn't succeeded recently enough, at least two full runs. "This should generally be at least enough time for 2 full runs of the batch job." (Batch jobs)
- Worked example: a job every 4 hours taking an hour gets a 10-hour threshold. "For a job that runs every 4 hours and takes an hour, 10 hours would be a reasonable threshold." (Batch jobs)
- Monitor the monitoring, preferably end to end. "a blackbox test that alerts are getting from PushGateway to Prometheus to Alertmanager to email is better than individual alerts on each." (Metamonitoring)

- An outside black-box check catches what internal monitoring can't, and covers for it failing entirely. "Supplementing the whitebox monitoring of Prometheus with external blackbox monitoring can catch problems that are otherwise invisible, and also serves as a fallback in case internal systems completely fail." (Metamonitoring)
- A slow lower layer with fine user latency needs no page. "If a lower-level component is slower than it should be, but the overall user latency is fine, then there is no need to page." (Online serving systems)

## Visuals worth redrawing

None.

## My notes

- Unversioned docs page; read as it stood when this was written.
