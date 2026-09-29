---
id: metrics
title: Metrics
depth: deep
phase: 14
note: >-
  Counters, gauges and histograms. Pull vs push.
needs: [observability, histograms]
leads_to: [cardinality, alerting, autoscaling, opentelemetry, exemplars]
compare_with: []
---

# Metrics

A metric is a number about your system, recorded over and over as time
passes: requests served so far, requests in flight, memory in use, how
long requests took. Metrics are the cheapest of the three kinds of telemetry in
[[observability]] to keep,
because a service can count a million requests into one number and
report only that. They're what your dashboards, [[alerting|alerts]] and
[[autoscaling]] run on.

## A number with a name and labels

Say an API server counts the HTTP requests it has handled. In
Prometheus's data model, that count is a time series named by a metric
name plus a set of labels:

```
http_requests_total{method="POST", handler="/messages"}
```

Every few seconds the series gets a new sample: a number (a 64-bit
float) and a timestamp in milliseconds. POST requests to `/messages`
and GET requests to `/users` are two different series under the same
name, because any change to any label value makes a new series.

Labels are how you slice a metric later. Instead of separate metrics
called `http_responses_500_total` and `http_responses_403_total`, you
make one `http_responses_total` with a `code` label, then sum it, filter
it or group it by code in a query. The rule that goes with that: no
part of a metric name should ever be generated from data. That's what
labels are for.

Labels aren't free. Each distinct combination of label values is one
more series to store and query, which is why putting a user id in a
label goes badly. That's [[cardinality]].

## Four types, and what each is for

Prometheus client libraries offer four metric types. The server itself
mostly forgets the type once the data arrives and stores plain float
series, so choosing the right one matters in your code.

**Counter.** A number that only goes up, or resets to zero when the
process restarts. Requests served, errors, bytes sent. The raw value
is rarely interesting: a total since the process started says little
on its own. What you graph is its rate, how fast it's rising, which is
what PromQL's `rate()` computes. Never use a counter for something that
can go down.

**Gauge.** A number that goes up and down: requests in flight, queue
length, free memory, temperature. You read its current value. Taking
the rate of a gauge makes no sense. The rule of thumb for picking
between the two: if the value can go down, it's a gauge.

**Histogram.** Counts of observations in buckets, plus their sum and
count, usually for request durations or sizes. It's a bundle of
counters, one per bucket. A classic Prometheus histogram is exposed as
several series: one `_bucket` series per upper bound (named in an `le`
label, and cumulative, so each bucket counts everything at or below its
bound), plus `_sum` and `_count`. Newer native histograms store the
whole thing as one sample, with buckets you don't have to configure.
Because
bucket counts from many servers can be added up, histograms are how you
get [[latency-percentiles]] across a fleet. How the buckets work, and
the error they bring, is [[histograms]].

**Summary.** Also tracks durations, but computes chosen quantiles (say
the p99) inside your process over a sliding time window. That sounds
convenient, but it has a catch when you run more than one server; see
[[histograms]].

One more habit: to track "time since something happened", export the
Unix timestamp when it happened, as a gauge, and subtract in the query.
Then there's no update loop in your code that can get stuck.

## What to measure

A good default for any service that answers requests: how many
requests it handled, how many failed, and how long they took, plus how
many are in progress right now. That's the [[red-method]] in metric
form. A few rules from Prometheus's instrumentation guide:

- **Count requests when they finish,** so the count lines up with the
  error and latency figures.
- **Measure on both sides of a call.** If the client and server
  disagree about latency or errors, the difference is a clue.
- **Count failures and attempts,** so you can compute a failure ratio.
- **Add a counter next to every log line** you care about, so you can
  see how often it happens and since when.
- **For a batch job, record when it last succeeded.** That's the
  number that tells you it has stopped running.
- **Export zero for series you know will exist.** A series that only
  appears after the first error is awkward to query and easy to
  misread.

## Pull or push

The service has the numbers. How do they get to the metrics system?

![Two panels. On the left, pull: three service instances each keep a counter in memory and expose it at /metrics; a Prometheus server scrapes each one every 15 to 30 seconds, and records up=1 or up=0 for each scrape, so a dead instance shows up as up=0. On the right, push: a short-lived batch job pushes its result to a Pushgateway, which Prometheus then scrapes; the gateway keeps the series until someone deletes it, and there is no up signal for the job itself. Below it, an OpenTelemetry SDK exporting to a collector at a fixed interval.](img/metrics-pull-vs-push.svg)

*Pull and push paths for metrics. Drawn from the Prometheus docs, "When to use the Pushgateway", and Julius Volz, "Pull doesn't scale - or does it?" (2016).*

**Pull.** Prometheus asks each service for its current numbers. The
service keeps counters in memory and exposes them over HTTP; the server
scrapes every 15 or 30 seconds (whatever you configure) and stores each
value with the scrape's timestamp. The service can count hundreds of
thousands of requests a second without sending any monitoring traffic
at all.

Pull has some useful side effects. Every scrape either works or fails,
and Prometheus records that as an `up` series per target, so a dead
instance is visible at once. The server needs a list of what it should
scrape, usually from [[service-discovery]], which is the same list you
need anyway to notice an instance that never reports. You can run a
copy of production monitoring on a laptop, or two identical servers for
high availability, just by pointing them at the same targets.

The common objection is that pull can't scale. The Prometheus team's
answer is that who opens the connection doesn't matter; the real cost
is ingesting and storing samples. When they wrote that (2016), their
record was 800,000 samples per second into one server, measured at
SoundCloud; at a 10-second scrape interval and 700 series per host,
that's more than 10,000 machines per server. Google's Borgmon, which
inspired Prometheus, also pulls.

**Push.** The service sends its numbers to the metrics system. Some
systems are built around this: StatsD-style tools receive every event
and aggregate centrally, and OpenTelemetry SDKs export metrics to a
collector at a fixed interval.

Prometheus has one push path, the Pushgateway, and it's meant only for
the result of a batch job that can't be scraped because it has already
exited. Used more widely, it becomes a single point of
failure, you lose the `up` signal, and it keeps every series it was
ever sent until someone deletes it, long after the instance that sent
it is gone.

Where pull really struggles is networking: targets behind firewalls or
NAT that the server can't reach. The usual fix is to run the scraper
inside that network.

## Cumulative or delta

A counter can be reported two ways.

- **Cumulative:** each report is the total since the start. Prometheus
  works this way. If one scrape fails, the next one still has the full
  total, so nothing is lost; the gap just averages out. The cost is
  that the sender must remember a running total for every series it
  has ever seen, so its memory grows with [[cardinality]].
- **Delta:** each report is only what happened since the last one.
  StatsD works this way. The sender can forget after each report, so
  the cost of many series moves out of the process to whatever
  receives the data. A lost report is lost.

Restarts complicate cumulative counters: the process restarts and the
count drops to zero. The OpenTelemetry format carries a start time on
each point so a reader can tell a restart apart from a gap and compute
rates correctly.

## From a metric to a trace

A latency histogram tells you some requests took seconds. It can't
tell you which ones. OpenTelemetry's [[exemplars]] close part of that gap:
a metric point can carry a few recorded values, each with the trace id
and span id of the request it came from. From a slow bucket you can
jump to a real slow trace (see [[distributed-tracing]]).

## Where it gets tricky

**A gauge only exists at scrape time.** Prometheus collects the current
value every 15 or 30 seconds. A queue that fills and drains between two
scrapes never shows up. Counters don't have this problem, because
their total keeps rising either way; for anything spiky, count events
instead of sampling a level.

**Type information is mostly gone on the server.** Prometheus flattens
everything except native histograms into plain float series. Nothing
stops you from taking `rate()` of a gauge. The query just returns
nonsense.

**Hot paths pay per update.** Incrementing a counter in Prometheus's
Java client costs about 12 to 17 ns, depending on contention. Code called
more than a hundred thousand times a second should update few metrics,
and cache the result of looking up labelled children instead of
resolving labels every time. Reading the clock for durations can cost a
system call too.

**Pull vs push is less of a fight than it sounds.** OpenTelemetry is
built around SDKs pushing to a collector, and one of its standard
setups has collectors forward the data to Prometheus. Either way, what
matters is that something notices a target that stops reporting.

**Averages and precomputed percentiles mislead.** Record durations as
histograms, not as averages or per-server quantiles. Why is in
[[histograms]] and [[tail-latency]].

## What this means when you build

- Instrument every service with request count, error count and a
  latency histogram from day one. Count at completion.
- Pick counter or gauge by one question: can it go down?
- Put dimensions in labels, never in metric names, and keep label
  values bounded.
- Graph counters as rates. Never rate a gauge.
- Use pull where you can reach your targets; use the Pushgateway only
  for batch job results.
- Record the Unix time of the last success for anything periodic.

## Further reading

- [Data model](https://prometheus.io/docs/concepts/data_model/), Prometheus docs (3.15). Time series as a name plus labels, and what a sample holds.
- [Metric types](https://prometheus.io/docs/concepts/metric_types/), Prometheus docs (3.15). Counter, gauge, histogram and summary, and how each is exposed.
- [Instrumentation](https://prometheus.io/docs/practices/instrumentation/), Prometheus docs (3.15). What to measure for services, batch jobs and libraries; counter vs gauge; label and performance advice.
- [Pull doesn't scale - or does it?](https://prometheus.io/blog/2016/07/23/pull-does-not-scale-or-does-it/), Julius Volz, Prometheus blog, 2016. The case for pull, with SoundCloud's ingestion numbers.
- [When to use the Pushgateway](https://prometheus.io/docs/practices/pushing/), Prometheus docs (3.15). Why push is the exception in Prometheus, and what goes wrong when it isn't.
- [Metrics Data Model](https://opentelemetry.io/docs/specs/otel/metrics/data-model/), OpenTelemetry specification 1.61.0. Cumulative vs delta temporality, start times, and exemplars.
