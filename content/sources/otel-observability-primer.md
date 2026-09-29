---
id: otel-observability-primer
title: Observability primer
author: OpenTelemetry authors
url: https://opentelemetry.io/docs/concepts/observability-primer/
kind: docs
primary: true
---

## Summary

The OpenTelemetry project's introduction to observability. It defines
observability as being able to ask new questions of a system from the
outside, names traces, metrics and logs as the telemetry an
instrumented program emits, and introduces spans and traces with an
example table of span attributes.

## Key claims

- Observability means asking questions from outside, including about problems nobody predicted. "Observability lets you understand a system from the outside by letting you ask questions about that system without knowing its inner workings." (What is Observability?)
- It's aimed at new problems. "it allows you to easily troubleshoot and handle novel problems, that is, “unknown unknowns”." (What is Observability?)
- Properly instrumented means you don't need to add instrumentation to debug. "An application is properly instrumented when developers don’t need to add more instrumentation to troubleshoot an issue, because they have all of the information they need." (What is Observability?)
- Telemetry comes as traces, metrics and logs. "The data can come in the form of traces, metrics, and logs." (Reliability and metrics)
- Metrics are numeric aggregations over time. "Metrics are aggregations over a period of time of numeric data about your infrastructure or application." (Reliability and metrics)
- A log is a timestamped message not necessarily tied to a request. "A log is a timestamped message emitted by services or other components. Unlike traces, they aren’t necessarily associated with any particular user request or transaction." (Logs)
- Logs are more useful when tied to a trace and span. "They become far more useful when they are included as part of a span, or when they are correlated with a trace and a span." (Logs)
- A span is one unit of work. "A span represents a single unit of work or operation." (Spans)
- A trace records one request's path through many services. "A distributed trace, more commonly known as a trace, records the path taken by a single request (made by an application or end user) as it propagates through multiple services" (Distributed traces)
- The root span covers the request from start to finish. "Each root span represents a request from start to finish." (Distributed traces)
- Backends show traces as waterfalls. "Many Observability backends visualize traces as waterfall diagrams" (Distributed traces)

## Visuals worth redrawing

- The waterfall of a sample trace (root span with nested children).

## My notes

- The span attributes table uses the HTTP semantic conventions
  (`http.request.method`, `http.route`, `http.response.status_code`).
