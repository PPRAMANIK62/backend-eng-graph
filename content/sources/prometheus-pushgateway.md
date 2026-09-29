---
id: prometheus-pushgateway
title: When to use the Pushgateway
author: Prometheus authors
url: https://prometheus.io/docs/practices/pushing/
kind: docs
primary: true
---

## Summary

Prometheus's guidance (docs for Prometheus 3.15) on its one push path,
the Pushgateway: use it only for the result of service-level batch jobs
that can't be scraped, because it loses pull's health checking and
never forgets what was pushed.

## Key claims

- The Pushgateway lets jobs that can't be scraped push metrics. "The Pushgateway is an intermediary service which allows you to push metrics from jobs which cannot be scraped." (intro)
- It's a single point of failure and a bottleneck. "the Pushgateway becomes both a single point of failure and a potential bottleneck." (Should I be using the Pushgateway?)
- You lose the per-scrape `up` health metric. "You lose Prometheus's automatic instance health monitoring via the up metric (generated on every scrape)." (Should I be using the Pushgateway?)
- It never forgets pushed series. "The Pushgateway never forgets series pushed to it and will expose them to Prometheus forever unless those series are manually deleted via the Pushgateway's API." (Should I be using the Pushgateway?)
- With pull, a vanished instance's metrics vanish too. "when an instance disappears (intentional or not), its metrics will automatically disappear along with it." (Should I be using the Pushgateway?)
- The only valid use: the outcome of a service-level batch job. "Usually, the only valid use case for the Pushgateway is for capturing the outcome of a service-level batch job." (Should I be using the Pushgateway?)
- Behind a firewall or NAT, move Prometheus or use PushProx. "consider moving the Prometheus server behind the network barrier as well." (Alternative strategies)

## Visuals worth redrawing

None.

## My notes

None.
