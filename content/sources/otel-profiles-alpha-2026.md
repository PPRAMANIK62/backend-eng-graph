---
id: otel-profiles-alpha-2026
title: OpenTelemetry Profiles Enters Public Alpha
author: Alexey Alexandrov, Ivo Anjo, Felix Geisendörfer, Christos Kalkanis, Florian Lehner, Damien Mathieu (OpenTelemetry Profiling SIG)
url: https://opentelemetry.io/blog/2026/profiles-alpha/
kind: blog
primary: true
---

## Summary

The OpenTelemetry blog post (2026) announcing that the Profiles signal
reached public alpha: a data format based on pprof, an eBPF profiling
agent donated by Elastic that runs as a Collector receiver, and
profile samples that can carry trace and span IDs.

## Key claims

- The industry lacked a common protocol. "Historically, the industry lacked a common framework and protocol for continuous profiling, even with formats like JFR and pprof being popular." (Production profiling for all)
- Stacks are deduplicated. "The stack representation is deduplicated so that each unique callstack is stored only once, allowing efficient encoding of diverse profiling data." (Standardizing the data representation)
- Samples can carry trace IDs. "Profile samples can be further associated with the Tracing trace_id / span_id attributes, enabling cross-signal correlation of the data." (Standardizing the data representation)
- Lossless pprof round trip. "Data in the original pprof format can be round-trip converted to/from OTLP Profiles with no loss of information." (Standardizing the data representation)
- Elastic donated an eBPF agent; whole-system profiling on Linux without instrumentation. "low-overhead whole-system continuous profiling on Linux with support of the most widely-used language runtimes without any additional instrumentation is available to every OpenTelemetry user." (Frictionless insights with the eBPF Profiling Agent)
- The eBPF agent runs as a Collector receiver. "The eBPF agent now works as an OpenTelemetry Collector receiver" (Frictionless insights)
- Needs Collector v0.148.0 or newer. (What's next)
- Production backends don't exist yet. "As the signal is still under development, production-ready backends have not yet emerged but multiple vendors are working on supporting OpenTelemetry Profiles." (Getting started)
- Not for critical production yet. "Note that with the Alpha status of the release, the signal should not be used for critical production workloads." (What's next)
- Symbolization is still being standardized. "Symbolization is a key component of every production profiling stack, so we are discussing standardizing the API, the storage format and publishing a reference implementation for it." (What's next)
- The eBPF agent came from Elastic. "With the Elastic donation of its eBPF profiling agent to OpenTelemetry and its integration with the OTel Collector" (Frictionless insights with the eBPF Profiling Agent)

## Visuals worth redrawing

None.

## My notes

- Status is a moving target: alpha when this was written; check the
  OTLP spec's status line for profiles.
