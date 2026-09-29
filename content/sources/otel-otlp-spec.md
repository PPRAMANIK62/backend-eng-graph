---
id: otel-otlp-spec
title: OpenTelemetry Protocol (OTLP) Specification
author: OpenTelemetry authors
url: https://opentelemetry.io/docs/specs/otlp/
kind: spec
primary: true
---

## Summary

The wire protocol for OpenTelemetry data (OTLP 1.11.0 when read).
Protobuf messages sent over gRPC or HTTP, one Export request per batch,
with rules for partial success, which errors to retry, throttling and
backpressure, and what delivery it does and doesn't promise.

## Key claims

- Status per signal. "Stable for the trace, metric and log signals." and "Development for the profiles signal." (Status)
- Scope. "The OpenTelemetry Protocol (OTLP) specification describes the encoding, transport, and delivery mechanism of telemetry data between telemetry sources, intermediate nodes such as collectors and telemetry backends." (introduction)
- Request/response with one request type. "OTLP is a request/response style protocol: the clients send requests, and the server replies with corresponding responses." (Protocol Details)
- Servers must support gzip and no compression. (Protocol Details)
- Delivery guarantees are per hop only. "End-to-end delivery guarantees in such systems is outside of the scope of OTLP." (OTLP/gRPC)
- Throughput formula with an example: 100 spans per request, 200 ms round trip, 300 ms server time gives 200 spans per second with one request in flight. "max_concurrent_requests * max_request_size / (network_latency + server_response_time)" (OTLP/gRPC Concurrent Requests)
- Partial success isn't retried. "The client MUST NOT retry the request when it receives a partial success response where the partial_success is populated." (Partial Success)
- Non-retryable errors drop the data. "The client MUST drop the telemetry data." (Failures)
- Backpressure. "The client MUST then throttle itself to avoid overwhelming the server." (OTLP/gRPC Throttling)
- Default ports. "The default network port for OTLP/gRPC is 4317." and "The default network port for OTLP/HTTP is 4318." (Default Port sections)
- OTLP/HTTP carries Protobuf as binary or JSON; same schema either way. "OTLP/HTTP uses Protobuf payloads encoded either in binary format or in JSON format." (OTLP/HTTP)
- Default paths /v1/traces, /v1/metrics, /v1/logs. "The default URL path for requests that carry trace data is /v1/traces" (OTLP/HTTP Request)
- Retryable HTTP codes are 429, 502, 503, 504; all other 4xx and 5xx must not be retried. "All other 4xx or 5xx response status codes MUST NOT be retried." (Retryable Response Codes)
- Honour Retry-After, else exponential backoff. "If the client receives a retryable error code (see table above) and the “Retry-After” header is not present in the response, then the client SHOULD implement an exponential backoff strategy between retries." (OTLP/HTTP Throttling)
- Duplicates are an accepted tradeoff. "This is a deliberate choice and is considered to be the right tradeoff for telemetry data." (Duplicate Data)
- No explicit protocol version numbers; evolves through Protobuf-compatible changes. "OTLP does not use explicit protocol version numbering." (Future Versions and Interoperability)
- HTTP overload answer: 429 or 503, maybe with Retry-After. "the server SHOULD respond with HTTP 429 Too Many Requests or HTTP 503 Service Unavailable and MAY include "Retry-After" header" (OTLP/HTTP Throttling)
- gRPC overload answer: Unavailable. "To signal backpressure when using gRPC transport, the server SHOULD return an error with code Unavailable" (OTLP/gRPC Throttling)
- Data goes in unary Export requests. "using unary requests using Export*ServiceRequest messages" (OTLP/gRPC)

## Visuals worth redrawing

None.

## My notes

- Profiles use a /v1development/profiles path while in development.
