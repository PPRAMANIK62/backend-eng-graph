---
id: otel-traces
title: Traces
author: OpenTelemetry authors
url: https://opentelemetry.io/docs/concepts/signals/traces/
kind: docs
primary: true
---

## Summary

OpenTelemetry's concept page for traces. It builds a small trace of
three spans to show how trace id and parent id form a tree, then lists
what a span holds (name, parent, timestamps, span context, attributes,
events, links, status) and the five span kinds.

## Key claims

- A root span has a trace id and no parent. "This is the root span, denoting the beginning and end of the entire operation. Note that it has a trace_id field indicating the trace, but has no parent_id." (hello span example)
- Shared trace id plus parent ids make the tree. "These three blocks of JSON all share the same trace_id, and the parent_id field represents a hierarchy." (example)
- A trace is like a set of structured logs with context and hierarchy, across processes. "One way to think of Traces is that they’re a collection of structured logs with context, correlation, hierarchy, and more baked in." (example)
- Context propagation is what lets spans from different places form one trace. "Context Propagation is the core concept that enables Distributed Tracing." (Context Propagation)
- What a span contains. "In OpenTelemetry, they include the following information:" (Spans) followed by name, parent span ID, start and end timestamps, span context, attributes, span events, span links, span status.
- Span context holds trace id, span id, trace flags and trace state, and is the part that gets propagated. "Span context is the part of a span that is serialized and propagated alongside Distributed Context and Baggage." (Span Context)
- Attributes added at span creation are visible to the sampler. "Prefer adding attributes at span creation to make the attributes available to SDK sampling." (Attributes)
- A span event marks a single point in time within a span. "a meaningful, singular point in time during the Span’s duration." (Span Events)
- Links connect spans across traces, for example for queued async work. "Links exist so that you can associate one span with one or more spans, implying a causal relationship." (Span Links)
- Status is Unset, Error or Ok; Unset means completed without error. "A span status that is Unset means that the operation it tracked successfully completed without an error." (Span Status)
- Five span kinds. "When a span is created, it is one of Client, Server, Internal, Producer, or Consumer." (Span Kind)
- A consumer span may start long after its producer span ended. "may start long after the producer span has already ended." (Consumer)

## Visuals worth redrawing

None beyond the JSON example.

## My notes

- The page's JSON is illustrative, not OTLP.
