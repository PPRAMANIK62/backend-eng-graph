---
id: prometheus-alertmanager
title: Alertmanager (Prometheus documentation)
author: Prometheus authors
url: https://prometheus.io/docs/alerting/latest/alertmanager/
kind: docs
primary: true
---

## Summary

The concepts page for Alertmanager, the service that takes firing
alerts from Prometheus and turns them into notifications: grouping,
inhibition, silences, routing to receivers, and high availability.

## Key claims

- What it does. "It takes care of deduplicating, grouping, and routing them to the correct receiver integration such as email, PagerDuty, or OpsGenie." (Alertmanager)
- Grouping turns many alerts into one notification. "Grouping categorizes alerts of similar nature into a single notification." (Grouping)
- Grouping matters in big outages. "This is especially useful during larger outages when many systems fail at once and hundreds to thousands of alerts may be firing simultaneously." (Grouping)
- Worked example: a partition leaves half the instances unable to reach the database; hundreds of alerts, one page wanted. "As a user, one only wants to get a single page while still being able to see exactly which service instances were affected." (Grouping)
- Inhibition mutes alerts while a related one fires. "Inhibition is a concept of suppressing notifications for certain alerts if certain other alerts are already firing." (Inhibition)
- Silences mute alerts for a time, matched by labels. "Silences are a straightforward way to simply mute alerts for a given time." (Silences)
- Don't load-balance between Prometheus and Alertmanagers. "It's important not to load balance traffic between Prometheus and its Alertmanagers, but instead, point Prometheus to a list of all Alertmanagers." (High Availability)
- Inhibition example: a whole cluster unreachable mutes the cluster's other alerts. "Alertmanager can be configured to mute all other alerts concerning this cluster if that particular alert is firing." (Inhibition)

## Visuals worth redrawing

None.

## My notes

- Unversioned (/latest/) concepts page.
