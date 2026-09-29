---
id: otel-sampling
title: Sampling
author: OpenTelemetry authors
url: https://opentelemetry.io/docs/concepts/sampling/
kind: docs
primary: true
---

## Summary

OpenTelemetry's concept page on trace sampling: why you'd keep only
some traces, when not to, and the two families. Head sampling decides
at the start, usually from the trace id; tail sampling decides after
seeing most of the trace, which lets it keep errors and slow requests
but needs a stateful service to hold spans while it waits.

## Key claims

- Terminology: sampled means kept and exported. "Sampled: A trace or span is processed and exported." (Terminology)
- Most traffic is healthy, so you don't need every trace. "you do not need 100% of your traces to meaningfully observe your applications and systems." (intro)
- At high volume, 1% or lower can be representative. "For high-volume systems, it is quite common for a sampling rate of 1% or lower to very accurately represent the other 99% of data." (Why sampling?)
- Consider sampling at 1000 or more traces per second. "You generate 1000 or more traces per second." (When to sample)
- Don't sample if you generate little data. "You generate very little data (tens of small traces per second or lower)." (When not to sample)
- Or if regulation forbids dropping data. "You are bound by circumstances such as regulation that prohibit dropping data" (When not to sample)
- Sampling has its own costs, including missing critical information. "The indirect opportunity cost of missing critical information with ineffective sampling techniques." (When not to sample)
- Head sampling decides as early as possible, without seeing the whole trace. "Head sampling is a sampling technique used to make a sampling decision as early as possible." (Head Sampling)
- The common form decides from the trace id and a percentage, so whole traces are kept. "a sampling decision is made based on the trace ID and the desired percentage of traces to sample. This ensures that whole traces are sampled - no missing spans - at a consistent rate" (Head Sampling)
- Head sampling can't guarantee error traces are kept. "you cannot ensure that all traces with an error within them are sampled with head sampling alone." (Head Sampling)
- Tail sampling decides after seeing all or most of the trace. "Tail sampling is where the decision to sample a trace takes place by considering all or most of the spans within the trace." (Tail Sampling)
- Examples: keep all errors, sample on latency. "Always sampling traces that contain an error" (Tail Sampling)
- Large systems almost always need tail sampling. "For larger systems that must sample telemetry, it is almost always necessary to use Tail Sampling to balance data volume with the usefulness of that data." (Tail Sampling)
- Tail samplers are stateful and can need many nodes. "Depending on traffic patterns, this can require dozens or even hundreds of compute nodes that all utilize resources differently." (Tail Sampling)
- They may fall back to cheaper sampling under load. "a tail sampler might need to “fall back” to less computationally intensive sampling techniques if it is unable to keep up with the volume of data it is receiving." (Tail Sampling)
- Head and tail can be combined, head first to protect the pipeline. "This is often done in the interest of protecting the telemetry pipeline from being overloaded." (Tail Sampling)
- Three costs: compute, engineering upkeep, missed data. "The indirect engineering cost of maintaining effective sampling methodologies as more applications, systems, and data are involved." (When not to sample)
- Head sampling can run anywhere in the pipeline. "Can be done at any point in the trace collection pipeline" (Head Sampling)
- Tail rules can use attributes, for example a newly deployed service. "sampling more traces originating from a newly deployed service" (Tail Sampling)
- Tail samplers need monitoring of their own. "it is critical to monitor tail-sampling components to ensure that they have the resources they need to make the correct sampling decisions." (Tail Sampling)
- Tail sampling is often vendor-specific. "Tail samplers often end up as vendor-specific technology today." (Tail Sampling)

## Visuals worth redrawing

- Spans flowing from a root span into a tail sampling processor that
  decides after the spans complete.

## My notes

- The OpenTelemetry spec has a probability-sampling design using
  `tracestate`; not opened here.
