---
id: bourgon-metrics-tracing-logging-2017
title: Metrics, tracing, and logging
author: Peter Bourgon
url: https://peter.bourgon.org/blog/2017/02/21/metrics-tracing-and-logging.html
kind: blog
primary: true
---

## Summary

A short post (2017) written after the Distributed Tracing Summit. It
draws metrics, logging and tracing as three overlapping circles and
picks one defining property for each: metrics can be aggregated, logs
are discrete events, traces are scoped to one request. It ends with a
cost gradient: metrics are cheapest to keep, logs the most expensive,
traces in between.

## Key claims

- Metrics are defined by being aggregatable. "the defining characteristic of metrics is that they are aggregatable" (paragraph 3)
- How each metric type aggregates: a gauge by last write, a counter by addition, a histogram by buckets. "the current depth of a queue could be modeled as a gauge, whose updates aggregate with last-writer-win semantics; the number of incoming HTTP requests could be modeled as a counter, whose updates aggregate by simple addition" (paragraph 3)
- Logs are defined by discrete events. "the defining characteristic of logging is that it deals with discrete events." (paragraph 4)
- Tracing is defined by request scope. "the single defining characteristic of tracing, then, is that it deals with information that is request-scoped." (paragraph 5)
- Examples of request-scoped data: an RPC's duration, the SQL text, a correlation ID. "the duration of an outbound RPC to a remote service; the text of an actual SQL query sent to a database; or the correlation ID of an inbound HTTP request." (paragraph 5)
- Not everything is request-scoped, so not all of it fits in a tracing system. "not all instrumentation is bound to request lifecycles" (paragraph 7)
- Metrics are cheapest to manage because they compress well. "metrics tend to require the fewest resources to manage, as by their nature they “compress” pretty well." (paragraph 9)
- Logging volume can exceed the traffic it describes. "logging tends to be overwhelming, frequently coming to surpass in volume the production traffic it reports on." (paragraph 9)
- Tracing sits between the two on cost. "we observe that tracing probably sits somewhere in the middle." (paragraph 9)

## Visuals worth redrawing

- The Venn diagram of metrics, logging and tracing with labelled
  overlaps, and the version with a volume gradient from metrics (low) to
  logging (high).

## My notes

- Majors (2024) credits Bourgon with the "three pillars" phrase in a
  2018 post. This 2017 post doesn't use that phrase.
