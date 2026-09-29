---
id: sigelman-dapper-2010
title: Dapper, a Large-Scale Distributed Systems Tracing Infrastructure
author: Benjamin H. Sigelman, Luiz André Barroso, Mike Burrows, Pat Stephenson, Manoj Plakal, Donald Beaver, Saul Jaspan, Chandan Shanbhag (Google)
url: https://research.google/pubs/dapper-a-large-scale-distributed-systems-tracing-infrastructure/
kind: paper
primary: true
---

## Summary

Google's technical report (dapper-2010-1, 2010) on Dapper, its
production tracing system at the time. It introduced the trace tree of
spans linked by trace id, span id and parent id that most tracing
systems still use, and showed that tracing can be always on if the
instrumentation lives in shared RPC and threading libraries and only a
small sample of requests is recorded. Read from the PDF linked on the
page.

## Key claims

- The problem: one search query touches many services and an engineer can't tell which is slow. "An engineer looking only at the overall latency may know there is a problem, but may not be able to guess which service is at fault, nor why it is behaving poorly." (1 Introduction)
- Tracing must be always on because odd behaviour is hard to reproduce. "monitoring should always be turned on, because it is often the case that unusual or otherwise noteworthy system behavior is difficult or impossible to reproduce." (1 Introduction)
- Design goals: low overhead, application-level transparency, scalability. "Low overhead: the tracing system should have negligible performance impact on running services." (1 Introduction)
- Sampling one request in thousands was enough for many uses. "we have found that a sample of just one out of thousands of requests provides sufficient information for many common uses of the tracing data." (1 Introduction)
- Annotation-based tracing tags every record with a global id tying it to the originating request. "Annotation-based schemes [3, 12, 9, 16] rely on applications or middleware to explicitly tag every record with a global identifier that links these message records back to the originating request." (2 Distributed Tracing in Dapper)
- Traces are modelled as trees of spans. "Formally, we model Dapper traces using trees, spans, and annotations." (2 Distributed Tracing in Dapper)
- A span is a log of timestamped records: start, end, RPC timing, annotations. "a span is also a simple log of timestamped records which encode the span’s start and end time, any RPC timing data, and zero or more application-specific annotations" (2.1)
- Spans without a parent are root spans; all spans share a trace id; ids are random 64-bit. "Spans created without a parent id are known as root spans. All spans associated with a specific trace also share a common trace id" (2.1)
- The ids are 64-bit. "All of these ids are probabilistically unique 64-bit integers." (2.1)
- One span per RPC; each tier adds depth. "In a typical Dapper trace we expect to find a single span for each RPC, and each additional tier of infrastructure adds an additional level of depth to the trace tree." (2.1)
- An RPC span holds both client and server annotations, so clock skew matters; send/receive order bounds it. "we have to be mindful of clock skew." (2.1)
- The trace context lives in thread-local storage and is small. "A trace context is a small and easily copyable container of span attributes such as trace and span ids." (2.2)
- Callbacks carry their creator's trace context so async paths are followed. "Dapper ensures that all such callbacks store the trace context of their creator" (2.2)
- Span and trace ids travel from client to server on RPCs. "The span and trace ids are transmitted from client to server for traced RPCs." (2.2)
- Annotations have a per-span volume cap. "individual trace spans have a configurable upper-bound on their total annotation volume." (2.3)
- Collection is out of band: local log files, pulled by daemons, written to Bigtable. "First, span data is written (1) to local log files." (2.5)
- Median collection latency under 15 seconds. "is less than 15 seconds." (2.5, median latency for trace data collection)
- In-band collection would distort traffic and assumes perfect nesting. "in-band collection schemes assume that all RPCs are perfectly nested." (2.5.1)
- No RPC payloads are logged, for privacy. "Dapper stores the name of RPC methods but does not log any payload data at this time." (2.6)
- Span creation cost: 204 ns for a root span, 176 ns otherwise, on a 2.2 GHz x86 server. "Root span creation and destruction takes 204 nanoseconds on average, while the same operation for non-root spans takes 176 nanoseconds." (4.1)
- An annotation on an unsampled span costs about 9 ns. "consisting of a thread-local lookup in the Dapper runtime, averaging about 9 nanoseconds." (4.1)
- Each span is about 426 bytes; collection is under 0.01% of network traffic. "each span in our repository corresponding to only 426 bytes on average." (4.2)
- Table 2: on a web search cluster, tracing every request raised average latency 16.3%; at 1/16 and below the effect was within experimental error. "the latency and throughput penalties associated with sampling frequencies less than 1/16 are all within the experimental error." (4.3)
- 1/1024 was still enough data for high-volume services. "we have found that there is still an adequate amount of trace data for high-volume services when using a sampling rate as low as 1/1024." (4.3)
- The first version sampled uniformly, one in 1024. "averaging one sampled trace for every 1024 candidates." (4.4)
- Low-traffic workloads miss events at that rate. "lower traffic workloads may miss important events at such low sampling rates" (4.4)
- Adaptive sampling targets a rate of sampled traces per unit time, and records the probability used. "parameterized not by a uniform sampling probability, but by a desired rate of sampled traces per unit time." (4.4)
- A pattern that shows up once in a high-throughput system shows up thousands of times. "If a notable execution pattern surfaces once in such systems, it will surface thousands of times." (4.5)
- Low-volume services can trace everything. "Services with lower volume – perhaps dozens rather than tens of thousands of requests per second – can afford to trace every request" (4.5)
- A second sampling at collection hashes the trace id so whole traces are kept or dropped. "By depending on the trace id for our sampling decision, we either sample or discard entire traces rather than individual spans within traces." (4.6)
- Limitation: batched work gets blamed on one traced request. "if multiple traced requests are batched together, only one of them will appear responsible for the span" (Other Lessons Learned, Coalescing effects)
- Limitation: a request may be slow because others were queued ahead of it. "a request may be slow not because of its own behavior, but because other requests were queued ahead of it." (Other Lessons Learned, Finding a root cause)
- Each trace is stored as one Bigtable row, one column per span. "A trace is laid out as a single Bigtable row, with each column corresponding to a span." (2.5)
- Traces can have thousands of spans while responses stay small. "it is not uncommon to find traces with thousands of spans." (2.5.1)
- Some middleware returns before its backends finish. "We find that there are many middleware systems which return a result to their caller before all" (2.5.1, continued in the next column: "of their own backends have returned a final result.")
- Clock skew is bounded because a request is sent before it is received. "we take advantage of the fact that an RPC client always sends a request before a server receives it, and vice versa for the server response." (2.1)
- One universal search query can need thousands of machines. "In total, thousands of machines and many different services might be needed to process one universal search query." (1 Introduction)
- The engineer may not know which services are in use. "First, the engineer may not be aware precisely which services are in use" (1 Introduction)
- Nor be an expert on each one. "Second, the engineer will not be an expert on the internals of every service; each one is built and maintained by a different team." (1 Introduction)
- Slowness may come from another application sharing the machine. "a performance artifact may be due to the behavior of another application." (1 Introduction)
- Programmers shouldn't need to know about tracing. "Application-level transparency: programmers should not need to be aware of the tracing system." (1 Introduction)
- Instrumentation lives in a few common libraries (thread-local context, callback library, RPC library). "relying almost entirely on instrumentation of a few common libraries" (2.2 Instrumentation points)
- Responses near the root are small, so in-band trace data would dwarf them. "RPC responses – even near the root of such large distributed traces – can still be comparatively small: often less than ten kilobytes." (2.5.1)

## Visuals worth redrawing

- Figure 1: a request X through front end A, middle tiers B and C,
  backends D and E.
- Figure 2: five spans in a trace tree drawn against time, with parent
  ids.

## My notes

- Overhead numbers are from 2010 hardware (a 2.2 GHz x86 server).
