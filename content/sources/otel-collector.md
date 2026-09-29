---
id: otel-collector
title: Collector (OpenTelemetry documentation)
author: OpenTelemetry authors
url: https://opentelemetry.io/docs/collector/
kind: docs
primary: true
---

## Summary

The landing page for the OpenTelemetry Collector: what it's for, when
to run one instead of exporting straight from the service, and its
stability status.

## Key claims

- Receives, processes and exports, independent of vendor. "The OpenTelemetry Collector offers a vendor-agnostic implementation of how to receive, process and export telemetry data." (Introduction)
- Accepts open source formats such as Jaeger, Prometheus and Fluent Bit and sends to one or more backends. (Introduction)
- Direct export is fine to start. "For trying out and getting started with OpenTelemetry, sending your data directly to a backend is a great way to get value quickly." (When to use a collector)
- The general recommendation: run one next to the service. "in general we recommend using a collector alongside your service, since it allows your service to offload data quickly and the collector can take care of additional handling like retries, batching, encryption or even sensitive data filtering." (When to use a collector)
- Default exporters point at a local collector. "the default OTLP exporters in each language assume a local collector endpoint" (When to use a collector)
- Components are receivers, processors, exporters, connectors and extensions. (Components link text)
- Stability is mixed. "The Collector status is: mixed, since core Collector components currently have mixed stability levels." (Status)

## Visuals worth redrawing

None.

## My notes

- Unversioned landing page.
