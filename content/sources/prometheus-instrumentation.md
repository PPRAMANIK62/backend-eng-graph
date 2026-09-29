---
id: prometheus-instrumentation
title: Instrumentation
author: Prometheus authors
url: https://prometheus.io/docs/practices/instrumentation/
kind: docs
primary: true
---

## Summary

Prometheus's opinionated guide to instrumenting code (docs for
Prometheus 3.15): what to measure for online services, offline
pipelines, batch jobs, libraries, thread pools and caches; how to pick
counter vs gauge; and how many labels a metric can afford.

## Key claims

- Instrument everything. "The short answer is to instrument everything." (How to instrument)
- For online-serving systems: queries, errors, latency, and in-progress requests. "The key metrics in such a system are the number of performed queries, errors, and latency." (Online-serving systems)
- Measure on both client and server. "Online-serving systems should be monitored on both the client and server side." (Online-serving systems)
- A difference between client and server views helps debugging. "If the two sides see different behaviors, that is very useful information for debugging." (Online-serving systems)
- Count queries when they end, so counts line up with errors and latency. "When they end is suggested, as it will line up with the error and latency stats, and tends to be easier to code." (Online-serving systems)
- For a batch job, the key metric is when it last succeeded. "The key metric of a batch job is the last time it succeeded." (Batch jobs)
- A counter for every line of logging code. "As a general rule, for every line of logging code you should also have a counter that is incremented." (Logging)
- Count failures along with total attempts. "When reporting failures, you should generally have some other metric representing the total number of attempts." (Failures)
- One metric with a label beats several metric names. "rather than http_responses_500_total and http_responses_403_total, create a single metric called http_responses_total with a code label for the HTTP response code." (Use labels)
- Never generate metric names from data. "As a rule of thumb, no part of a metric name should ever be procedurally generated (use labels instead)." (Use labels)
- Each labelset is a series with its own cost. "Each labelset is an additional time series that has RAM, CPU, disk, and network costs." (Do not overuse labels)
- Small per series, but it adds up. "Usually the overhead is negligible, but in scenarios with lots of metrics and hundreds of labelsets across hundreds of servers, this can add up quickly." (Do not overuse labels)
- A big metric crowds out others. "Even with smaller numbers, there's an opportunity cost as you can't have other, potentially more useful metrics on this machine any more." (Do not overuse labels)
- Keep per-metric cardinality below 10. "As a general guideline, try to keep the cardinality of your metrics below 10, and for metrics that exceed that, aim to limit them to a handful across your whole system." (Do not overuse labels)
- Most metrics should have no labels. "The vast majority of your metrics should have no labels." (Do not overuse labels)
- Above 100, look for another approach. "If you have a metric that has a cardinality over 100 or the potential to grow that large, investigate alternate solutions such as reducing the number of dimensions or moving the analysis away from monitoring and to a general-purpose processing system." (Do not overuse labels)
- node_exporter reports every mounted filesystem, tens of series per node. "node_exporter exposes metrics for every mounted filesystem. Every node will have in the tens of timeseries for, say, node_filesystem_avail." (Do not overuse labels)
- Worked example: filesystem metrics on 10,000 nodes are about 100,000 series, fine. "If you have 10,000 nodes, you will end up with roughly 100,000 timeseries for node_filesystem_avail, which is fine for Prometheus to handle." (Do not overuse labels)
- Adding per-user quota for 10,000 users makes it tens of millions, too many. "If you were to now add quota per user, you would quickly reach a double digit number of millions with 10,000 users on 10,000 nodes. This is too much for the current implementation of Prometheus." (Do not overuse labels)
- Start with no labels. "If you are unsure, start with no labels and add more labels over time as concrete use cases arise." (Do not overuse labels)
- If it can go down, it's a gauge. "if the value can go down, it is a gauge." (Counter vs. gauge, summary vs. histogram)
- Raw counters are rarely useful; take rate(). "Raw counters are rarely useful. Use the rate() function to get the per-second rate at which they are increasing." (Counter vs. gauge, summary vs. histogram)
- Never rate() a gauge. "You should never take a rate() of a gauge." (Counter vs. gauge, summary vs. histogram)
- Export the time something happened, not the time since. "export the Unix timestamp at which it happened - not the time since it happened." (Timestamps, not time since)
- A Java counter increment costs 12 to 17 ns. "A Java counter takes 12-17ns [] to increment depending on contention." (Inner loops)
- Export 0 for series you know may exist, so they aren't missing. "export a default value such as 0 for any time series you know may exist in advance." (Avoid missing metrics)
- In-progress requests are worth tracking too. "The number of in-progress requests can also be useful." (Online-serving systems)
- Exporting a timestamp removes update logic that could get stuck. "removing the need for update logic and protecting you against the update logic getting stuck." (Timestamps, not time since)
- Hot code is code called more than 100k times a second. "For code which is performance-critical or called more than 100k times a second inside a given process, you may wish to take some care as to how many metrics you update." (Inner loops)
- Cache label lookups in hot loops. "limit the number of metrics you increment in the inner loop and avoid labels (or cache the result of the label lookup, for example, the return value of With() in Go or labels() in Java) where possible." (Inner loops)
- Reading the time can be a syscall. "Beware also of metric updates involving time or durations, as getting the time may involve a syscall." (Inner loops)
- Series that appear only when something happens are awkward to query. "Time series that are not present until something happens are difficult to deal with, as the usual simple operations are no longer sufficient to correctly handle them." (Avoid missing metrics)

## Visuals worth redrawing

None.

## My notes

- The 12-17 ns figure links to a benchmark not opened here.
