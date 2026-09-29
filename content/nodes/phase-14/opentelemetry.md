---
id: opentelemetry
title: OpenTelemetry
depth: short
phase: 14
note: >-
  The standard API and wire format for traces, metrics and logs.
needs: [distributed-tracing, metrics]
leads_to: []
compare_with: []
---

# OpenTelemetry

OpenTelemetry (OTel) is a vendor-neutral standard for producing
telemetry: an API your code calls to record traces, metrics and logs,
SDKs that implement it, and a wire protocol, OTLP, that carries the
results to whatever backend you choose. It doesn't store or display
anything. Its point is that you instrument your code once and can change
backends without touching it.

## One request, instrumented

Take a Go service handling `GET /orders/42`. The HTTP library it uses has
OTel instrumentation, so a span starts when the request arrives and ends
when the response goes out. Your handler adds a child span around the database query and
bumps a request counter. (Spans and how they link across services are
[[distributed-tracing]]; counters and histograms are [[metrics]].)

None of that code knows where the data goes. It talks only to the
OpenTelemetry **API**. The **SDK**, set up once in `main` by whoever owns
the application, implements the API: it collects the spans and metric
points and exports them over OTLP. Usually they go to a
**Collector** running next to the service, which sends them on to one or
more backends.

![Three columns. Left, your service: your code and libraries call the OpenTelemetry API, which is implemented by the SDK installed by the app owner. An arrow labelled OTLP, gRPC port 4317 or HTTP port 4318, goes to the middle column, the Collector (agent or standalone service), where receivers feed processors (batch, filter, scrub personal data) which feed exporters. Arrows go from the exporters to the right column: a trace store, a metrics store, logs and vendors. A note says storage and UI are left to other tools.](img/opentelemetry-pipeline.svg)

*Where OpenTelemetry sits, from a span in your code to a backend.*

## API and SDK are split on purpose

Telemetry is a cross-cutting concern: the same calls end up inside your
web framework, your database driver and your own code. If a library
pulled in a particular exporter or backend client, every application
using that library would inherit the choice. So the specification draws
a hard line. Instrumentation, including every library, depends only on
the API. The SDK is chosen, configured and installed by the application
owner. A library author is not allowed to reference the SDK at all.

Two more pieces make the data comparable across teams:

- **Semantic conventions** fix the keys and values for common concepts,
  protocols and operations, so the same thing gets the same name in
  every language and library.
- **Resources** describe what produced the telemetry: the service, the
  host, and in [[kubernetes]] the cluster, namespace, pod and container.
  They're attached to everything the process sends.

Signals share one context mechanism. **Propagators** write the current
span's context (a 16-byte trace ID, an 8-byte span ID and flags) into
outgoing request headers and read it back on the other side, which is
what stitches spans from different services into one trace. **Baggage**
uses the same path to carry your own name/value pairs downstream.

## OTLP, the wire format

OTLP is [[protobuf|Protobuf]] messages sent as one Export request per
batch, over either transport:

- **[[grpc|gRPC]]**, default port 4317.
- **HTTP**, default port 4318, at `/v1/traces`, `/v1/metrics` and
  `/v1/logs`, with the body as binary Protobuf or as JSON.

The rules for failure are the part worth knowing, because they're the
same problems your own services have. A server that's overloaded answers
with a retryable error (HTTP 429 or 503, or gRPC `UNAVAILABLE`), perhaps
with a `Retry-After`, and the client must slow down: that's
[[backpressure]]. Without a hint, the client retries with
[[retries-with-backoff|exponential backoff]]. Over HTTP only 429, 502, 503 and 504
are retried; for any other error the data is dropped. A
partial success (some spans rejected) is never retried.

OTLP accepts duplicates on purpose. If a connection drops before the
acknowledgement arrives, the client can't know whether the batch landed,
so it sends it again. For telemetry, an occasional duplicate is a better
deal than losing data. The acknowledgement also covers one hop only.
From your app through an agent and a collector to a backend, OTLP promises
nothing end to end.

## The Collector

The Collector is a separate program that receives telemetry (OTLP, and
other formats such as Jaeger and Prometheus), processes it, and exports
it. Processing is where you batch, add attributes, filter, and scrub
personal data before it leaves your network. It can also sample (see
[[trace-sampling]]).

It runs two ways: as an **agent**, a daemon next to the application, or
as a standalone service. Exporting
straight from the service to a backend is fine to start with. The
general advice is to run a Collector next to the service anyway, so the
service hands data off quickly and the Collector deals with retries,
batching and encryption. The SDKs' default OTLP exporters already assume
a local Collector.

## Where it gets tricky

**Maturity differs by signal and by component.** OTLP is stable for
traces, metrics and logs; profiles are still in development. The
Collector's status is "mixed": each component has its own stability
level. Check the exact signal and component you depend on.

**It isn't a backend.** OTel gets the data out in a standard shape.
Storing, querying and showing it are left to other tools, and choosing
them is a separate decision.

**It replaced two older projects.** OpenTracing and OpenCensus both tried
to solve this, and neither managed it alone, so they merged into
OpenTelemetry. Old code and blog posts may use either one.

## What this means when you build

- Instrument against the API only. Configure the SDK in one place, at
  startup.
- Use the semantic convention names instead of inventing your own.
- Run a Collector next to each service and keep backend choices in its
  config, not in your code.
- Treat telemetry export like any other client: back off on 429 and
  503, and count the data you drop.
- In this lab, the phase 14 build instruments every service with OTel so
  one request can be followed from the proxy to the storage engine. The
  backend is a decision record of its own.

## Further reading

- [What is OpenTelemetry?](https://opentelemetry.io/docs/what-is-opentelemetry/), OpenTelemetry authors. What the project is and isn't, its components, and where it came from.
- [Overview](https://opentelemetry.io/docs/specs/otel/overview/), OpenTelemetry specification 1.61.0. The API/SDK split, signals, resources, propagation and the Collector, as the spec defines them.
- [OTLP Specification](https://opentelemetry.io/docs/specs/otlp/), OTLP 1.11.0. Transports, ports, retries, throttling and duplicates.
- [Collector](https://opentelemetry.io/docs/collector/), OpenTelemetry authors. What the Collector is for and when to run one.
