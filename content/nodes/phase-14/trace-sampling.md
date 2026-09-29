---
id: trace-sampling
title: Trace sampling
depth: short
phase: 14
note: >-
  Keeping only some traces: head vs tail sampling, and what each one
  misses.
needs: [distributed-tracing]
leads_to: []
compare_with: [tail-latency]
---

# Trace sampling

Trace sampling means keeping only some of the traces your system
produces, because recording and storing every request's trace costs
too much. The two families differ in when they decide. Head sampling
decides when the request starts, which is cheap but blind to how the
request turns out. Tail sampling decides after the request is done,
which lets it keep the errors and slow requests, but needs a service
that holds every span in memory until it decides.

## Why keep only some

Most requests in a healthy system are alike: they succeed, at normal
speed, down the same code paths. Thousands of traces of the same fast
request teach you little that a handful didn't. At high volume
a sample of 1% or less usually represents the rest well.

A rough guide: consider sampling once you produce a thousand or more
traces per second, and don't bother at tens per second or less.
Don't sample if a rule or regulation says you can't drop the data.

Sampling has costs of its own: the compute to do it, the engineering
time to keep the rules right as the system changes, and the traces you
needed but dropped.

Terms are easy to mix up. A **sampled** trace is one that's kept and
exported. **Not sampled** means dropped.

## Head sampling: decide at the start

The first service to see a request makes the call, before anything has
happened. The common form is to keep a fixed percentage, say 5%,
decided from the [[distributed-tracing|trace id]] itself. Every
service that sees the same id reaches the same answer, so all the services
keep or drop the same traces. You get whole traces with no missing
spans.

It's easy to set up, cheap, and can happen anywhere in the pipeline.
What it can't do is look at the outcome. At the moment of the decision
nobody knows whether this request will fail or be very slow. A
rare error gets dropped with the same probability as a boring success.

## Tail sampling: decide at the end

Tail sampling waits until all or most of a trace's spans have arrived,
then decides with the whole trace in view. That allows rules like:

- keep every trace that contains an error;
- keep traces slower than some threshold (the slow requests behind
  your [[tail-latency]]);
- keep traces with a given attribute, such as ones from a newly
  deployed service;
- keep a small percentage of everything else.

![Two pipelines. Head sampling: the decision is made from the trace id before anything happens, so every service reaches the same keep-or-drop answer; one request that later fails had already been dropped, so its trace is lost. Tail sampling: every service sends all its spans to a load-balancing layer that routes by trace id, so all spans of one trace reach the same tail sampler; the sampler holds them for a wait period, 30 seconds by default, then applies rules: keep errors, keep slow traces, keep a few percent of the rest; only kept traces go to storage.](img/trace-sampling-head-vs-tail.svg)

*Where each method makes its decision. Adapted from the OpenTelemetry authors, "Sampling", and the Collector's "Tail Sampling Processor" README.*

The OpenTelemetry Collector's tail sampling processor is a typical
implementation. It groups incoming spans by trace id, keeps them in
memory for a fixed wait (`decision_wait`, 30 seconds by default), holds
up to a set number of traces at once (`num_traces`, 50,000 by
default), and then runs its policies. Its README is marked beta for
traces (contrib release v0.162.0 when this was written).

## What each one misses

**Head sampling misses outcomes.** Errors and slow requests are kept
only as often as everything else. You can't guarantee that every
failing request has a trace.

**Tail sampling misses what doesn't fit in its window, and costs a lot
to run.**

- **One trace, one machine.** Every span of a trace must reach the same
  sampler instance, or no instance sees the whole trace. At scale that
  means two layers: collectors that route spans by trace id, then the
  samplers.
- **Memory and state.** The sampler holds every span of every trace in
  flight until it decides. Depending on traffic that can mean dozens or
  hundreds of machines, and those machines need monitoring of their
  own.
- **Traces longer than the wait.** A span that arrives after its trace
  was decided and left memory can only be handled right if the sampler
  keeps a cache of past decisions.
- **Overload.** If more traces arrive than the buffer holds, the oldest
  are pushed out before they're judged, and under heavy load a sampler
  may fall back to simpler, cheaper rules.
- **Vendor lock-in.** The most capable tail sampling is often a
  vendor's product.

A common compromise uses both: head sampling in the services to cut
volume to something the pipeline can carry, then tail sampling later
to pick the interesting traces from what's left.

## Where it gets tricky

**"Slow" is measured roughly.** The Collector's latency rule takes the
earliest start and latest end among the spans it has, and ignores
what happened in between. Missing spans shorten the trace it measures.

**Don't count from traces.** A sampled set of traces isn't a count of
requests, especially after tail rules that keep all errors. Get rates
and error ratios from [[metrics]], and use traces to explain them.

## What this means when you build

- At tens of traces a second, keep everything.
- From around a thousand a second, start with head sampling on the
  trace id at a fixed rate.
- Add tail sampling when you need every error or every slow request,
  and budget for the collectors it needs.
- Route spans by trace id before any tail sampler.

## Further reading

- [Sampling](https://opentelemetry.io/docs/concepts/sampling/), OpenTelemetry docs. When to sample, head vs tail, and the costs of each.
- [Tail Sampling Processor README](https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/processor/tailsamplingprocessor/README.md), OpenTelemetry Collector contrib (v0.162.0 when read). How a real tail sampler buffers, decides, scales and drops traces.
