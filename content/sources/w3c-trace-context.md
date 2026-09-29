---
id: w3c-trace-context
title: Trace Context
author: Sergey Kanzhelev, Morgan McLean, Alois Reitbauer, Bogdan Drutu, Nik Molnar, Yuri Shkuro (editors), W3C Distributed Tracing Working Group
url: https://www.w3.org/TR/trace-context/
kind: spec
primary: true
---

## Summary

The W3C Recommendation (Level 1, 2021 revision) that standardises two
HTTP headers for passing trace context between services:
`traceparent` (fixed format: version, trace id, parent id, flags) and
`tracestate` (vendor-specific key-value pairs). It also sets rules for
the sampled flag, what to do with a missing or broken header, and
privacy and security limits. Level 2 (a Candidate Recommendation Draft,
2024) was opened too; it adds a random-trace-id flag.

## Key claims

- Before this spec, each tracing vendor propagated context its own way, so traces broke between vendors. "Today, trace context propagation is implemented individually by each tracing vendor." (2.1 Problem Statement)
- Two headers: traceparent for position in the trace, tracestate for vendor data. "traceparent describes the position of the incoming request in its trace graph in a portable, fixed-length format." (2.3 Design Overview)
- The minimum a tool must do is forward both headers. "At a minimum they MUST propagate the traceparent and tracestate headers and guarantee traces are not broken." (2.3)
- traceparent has four fields. "It has four fields:" (3.2) followed by version, trace-id, parent-id, trace-flags.
- Example header. "traceparent: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01" (3.1)
- trace-id is 16 bytes, all zeros forbidden. "trace-id         = 32HEXDIGLC  ; 16 bytes array identifier. All zeroes forbidden" (3.2.2.2)
- parent-id is 8 bytes. "parent-id        = 16HEXDIGLC  ; 8 bytes array identifier. All zeroes forbidden" (3.2.2.2)
- parent-id is the caller's id for this request, what many systems call the span id. "This is the ID of this request as known by the caller (in some tracing systems, this is known as the span-id, where a span is the execution of a client request)." (3.2.2.4)
- Flags are recommendations, not rules. "These flags are recommendations given by the caller rather than strict rules to follow" (3.2.2.5)
- Level 1 defines one flag, sampled. "The current version of this specification (00) only supports a single flag called sampled." (3.2.2.5.1)
- Recording only a subset of requests breaks traces. "Only recording a subset of requests results in broken traces." (3.2.2.5.1)
- Sampling techniques listed: probability, delayed decision, deferred. "Delayed decision (make collection decision based on duration or a result of a request)" (3.2.2.5.1)
- Every hop must forward traceparent and typically replaces parent-id with its own. "A vendor receiving a traceparent request header MUST send it to outgoing requests." (3.4)
- Updating parent-id is the default mutation. "This is the most typical mutation and should be considered a default." (3.4)
- No traceparent received: start a new trace. "the vendor creates a new trace-id and parent-id that represents the current request." (4.2)
- No personal data in the headers. "Tracing vendors MUST NOT use traceparent and tracestate fields for any personally identifiable or otherwise sensitive information." (6 Privacy Considerations)
- Services may restart the trace at trust boundaries. "Some services initiating or receiving a request MAY choose to restart a traceparent field to eliminate those risks completely." (6.1)
- Blindly honouring the sampled flag on a public API is a denial-of-service risk. "When distributed tracing is enabled on a service with a public API and naively continues any trace with the sampled flag set, a malicious attacker could overwhelm an application with tracing overhead" (7.2)
- Random trace ids let tools sample on the id alone. "Randomness also allows tracing vendors to base sampling decisions on trace-id field value and avoid propagating an additional sampling context." (8.2)
- Level 2 adds a random-trace-id flag. "This new version adds considerations for the generation of the trace-id and span-id fields, and adds the random trace ID flag." (Level 2, Status of This Document) [from https://www.w3.org/TR/trace-context-2/]
- Two fields, for interoperability and vendor extensions. "Trace context is split into two individual propagation fields supporting interoperability and vendor-specific extensibility" (2.3 Design Overview)
- tracestate holds vendor data as name/value pairs. "tracestate extends traceparent with vendor-specific data represented by a set of name/value pairs." (2.3)
- The Level 1 page is a revision of the 2020 Recommendation. "This specification includes editorial updates since the [2020] W3C Recommendation." (Status of This Document)

## Visuals worth redrawing

- The `traceparent` layout: `version-trace-id-parent-id-trace-flags`.

## My notes

- The URL is the "latest" Level 1 alias; it served the Recommendation
  whose status line says it includes editorial updates since the 2020
  Recommendation.
