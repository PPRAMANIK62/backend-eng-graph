---
id: prometheus-naming
title: Metric and label naming
author: Prometheus authors
url: https://prometheus.io/docs/practices/naming/
kind: docs
primary: true
---

## Summary

Prometheus's naming conventions (docs for Prometheus 3.15): prefixes,
base units, unit and `_total` suffixes, and what labels are for. Its
caution box is the standard warning against high-cardinality labels.

## Key claims

- A metric name refers to one unit. "...MUST refer to a single unit (e.g. do not mix seconds with milliseconds) and to a single quantity" (Metric names)
- Base units. "...SHOULD use base units (e.g. seconds, bytes, meters - not milliseconds, megabytes, kilometers)." (Metric names)
- Summing or averaging across all labels should make sense. "As a rule of thumb, either the sum() or the avg() over all dimensions of a given metric should be meaningful (though not necessarily useful)." (Metric names)
- Every label combination is a new series; no unbounded values in labels. "Remember that every unique combination of key-value label pairs represents a new time series, which can dramatically increase the amount of data stored." (Labels, caution)
- User IDs and emails are the named examples. "Do not use labels to store dimensions with high cardinality (many different label values), such as user IDs, email addresses, or other unbounded sets of values." (Labels, caution)

## Visuals worth redrawing

None.

## My notes

- Prometheus keeps unit and type suffixes in names; the page notes
  OpenTelemetry conventions don't.
