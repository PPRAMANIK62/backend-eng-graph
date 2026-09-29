---
id: otel-what-is-opentelemetry
title: What is OpenTelemetry?
author: OpenTelemetry authors
url: https://opentelemetry.io/docs/what-is-opentelemetry/
kind: docs
primary: true
---

## Summary

The project's own one-page explanation: a vendor-neutral framework for
generating, exporting and collecting traces, metrics and logs, which is
deliberately not a backend. Lists the components and the project's
history as the merger of OpenTracing and OpenCensus.

## Key claims

- What it covers: generation, export and collection of traces, metrics and logs. "of telemetry data such as traces, metrics, and logs." (What is OpenTelemetry?, list)
- It isn't a backend. "OpenTelemetry is not an observability backend itself." (What is OpenTelemetry?)
- Storage and visualization are left to others. "The backend (storage) and the frontend (visualization) of telemetry data are intentionally left to other tools." (What is OpenTelemetry?)
- Works with open source backends such as Jaeger and Prometheus, and with commercial ones. (What is OpenTelemetry?)
- Two principles. "You own the data that you generate. There’s no vendor lock-in." and "You only have to learn a single set of APIs and conventions." (Why OpenTelemetry?)
- Components: a specification, a protocol (OTLP), semantic conventions, APIs, language SDKs, instrumentation libraries, automatic instrumentation, and the Collector. "The OpenTelemetry Collector, a proxy that receives, processes, and exports telemetry data" (Main OpenTelemetry components)
- History: a CNCF project formed by merging OpenTracing and OpenCensus. "As neither project was fully able to solve the problem independently, they merged to form OpenTelemetry and combine their strengths while offering a single solution." (History)

## Visuals worth redrawing

None.

## My notes

- Unversioned docs page.
