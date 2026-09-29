---
id: majors-observability-2-0-2024
title: "It's Time to Version Observability: Introducing Observability 2.0"
author: Charity Majors (Honeycomb)
url: https://www.honeycomb.io/blog/time-to-version-observability-signs-point-to-yes
kind: blog
primary: true
---

## Summary

Honeycomb's CTO (2024) argues that "three pillars" tooling (separate
metrics, logs and traces) should be called observability 1.0, and that
tools built on wide structured events stored once, aggregated at read
time, are 2.0. Written by a vendor selling the second kind, so it's one
side of a real design debate, not a neutral survey.

## Key claims

- Honeycomb took the term from control theory in 2016. "In 2016, we at Honeycomb first borrowed the term “observability” from the wikipedia entry for control systems observability" (opening)
- Observability 2.0 is built on wide structured events as one source of truth. "Tools like Honeycomb, which are built based on arbitrarily-wide structured log events, a single source of truth—that’s observability 2.0." (opening)
- Vendors took up the three pillars framing because they sold one product per pillar. "Vendors, because they (coincidentally!) had metrics products, logging products, and tracing products to sell." (opening)
- In 1.0, aggregation happens at write time, so questions must be chosen in advance. "Aggregation is done at write time, so you have to decide upfront which data points to collect and which questions you want to be able to ask." (1.0 vs 2.0 comparison)
- In 2.0, aggregation happens at read time and raw events are kept. "Aggregation is done at read time, and preserves raw events for ad hoc querying." (1.0 vs 2.0 comparison)
- Wide events are often called canonical logs, with trace and span IDs added. "Data gets stored in arbitrarily-wide structured log events (often called “canonical logs,” or what AWS internally refers to as “service logs”), often with trace and span IDs appended." (1.0 vs 2.0 comparison)
- Metrics throw away context at write time and can't take high cardinality. "you have to discard all that valuable context at write time, and they don’t support high-cardinality data." (metrics section)
- Metrics are still good for cheap summaries. "Metrics are a great tool for cheaply summarizing vast quantities of data." (metrics section)
- Metrics tools cost more as cardinality grows. "If you use metrics-based products, your costs go up based on cardinality." (cost section)
- Event tools control cost with sampling. "You have powerful, surgical options for controlling costs via head-based or tail-based dynamic sampling." (cost section)
- With separate stores you copy ids between tools to follow a request. "You may find yourself eyeballing graph shapes and assuming they must be the same data, or copy-pasting IDs around from logging to tracing tools and back." (1.0 vs 2.0 comparison)
- The claimed win is precision. "In a word, precision. O11y 1.0 can only ever give you aggregates and random exemplars." (opening)

## Visuals worth redrawing

None.

## My notes

- Says "In 2018, Peter Bourgon wrote a blog post proposing that
  observability has three pillars". Bourgon's post opened for this
  project is from 2017 and doesn't use the phrase.
- The page shows a later "Updated" line; only the year of writing is
  used here.
