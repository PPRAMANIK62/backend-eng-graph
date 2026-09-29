---
id: otel-context-propagation
title: Context propagation
author: OpenTelemetry authors
url: https://opentelemetry.io/docs/concepts/context-propagation/
kind: docs
primary: true
---

## Summary

OpenTelemetry's concept page on context and propagation: how a trace id
and span id move from one service to the next (by default in the W3C
`traceparent` header), and how the same context links logs and metrics
to traces. Ends with security advice for context coming from, or going
to, services you don't trust.

## Key claims

- Context lets traces, metrics and logs be correlated. "With context propagation, signals (traces, metrics, and logs) can be correlated with each other, regardless of where they are generated." (intro)
- The caller sends trace id and span id; the callee makes a child span. "Service B uses these values to create a new span that belongs to the same trace, setting the span from Service A as its parent." (Context)
- Propagation serializes and deserializes the context. "Propagation is the mechanism that moves context between services and processes." (Propagation)
- It's usually done by instrumentation libraries. "Propagation is usually handled by instrumentation libraries and is transparent to the user." (Propagation)
- The default propagator uses W3C Trace Context headers. "The default propagator uses the headers specified by the W3C TraceContext specification." (Propagation)
- SDKs put trace and span ids into log records. "OpenTelemetry SDKs are able to automatically correlate logs with traces." (Logs)
- Inject on the sending side, extract on the receiving side. "On the side of the sender, the context is injected into the carrier, for example, into the headers of an HTTP request." (Custom Context Propagation)
- Forged incoming headers are a risk. "Malicious actors could send forged trace headers to manipulate your tracing data or potentially exploit vulnerabilities in context parsing." (Security best practices)
- Outgoing ids can reveal internal architecture. "Internal trace IDs, span IDs, or baggage items might reveal sensitive information about your internal architecture or business logic." (Security best practices)
- Baggage carries arbitrary key-value pairs; keep secrets and PII out of it. "Baggage allows you to propagate arbitrary key-value pairs." (Baggage)
- Baggage may be logged or sent downstream. "avoid putting sensitive information (like user credentials, API keys, or PII) in baggage, as it might be logged or sent to untrusted downstream services." (Baggage)

## Visuals worth redrawing

None.

## My notes

- The metrics example table on the page (calls per second by caller
  path) is illustrative.
