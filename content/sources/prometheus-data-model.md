---
id: prometheus-data-model
title: Data model
author: Prometheus authors
url: https://prometheus.io/docs/concepts/data_model/
kind: docs
primary: true
---

## Summary

Prometheus's data model page (docs for Prometheus 3.15): everything is
a time series named by a metric name plus a set of labels, and each
sample is a number with a millisecond timestamp.

## Key claims

- All data is time series. "Prometheus fundamentally stores all data as time series: streams of timestamped values belonging to the same metric and the same set of labeled dimensions." (intro)
- A series is identified by metric name and labels. "Every time series is uniquely identified by its metric name and optional key-value pairs called labels." (Metric names and labels)
- Changing any label value makes a new series. "The change of any label's value, including adding or removing labels, will create a new time series." (Metric names and labels)
- Labels are the dimensional data model that queries filter and aggregate on. "The query language allows filtering and aggregation based on these dimensions." (Metric names and labels)
- A sample is a float64 (or native histogram) and a millisecond timestamp. "a millisecond-precision timestamp" (Samples)
- Notation example. "api_http_requests_total{method="POST", handler="/messages"}" (Notation)
- A sample value is a float64 or a native histogram. "a float64 or native histogram value" (Samples)

## Visuals worth redrawing

None.

## My notes

- UTF-8 metric and label names arrived in Prometheus v3.0.0.
