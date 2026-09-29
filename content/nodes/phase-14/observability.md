---
id: observability
title: Observability
depth: deep
phase: 14
note: >-
  Logs, metrics and traces: which question each one answers.
needs: []
leads_to: [structured-logging, metrics, distributed-tracing]
compare_with: [alerting, sli-slo-sla]
---

# Observability

Observability is how well you can work out what your running system is
doing, and why, from the data it gives off. In practice that data comes
in three kinds: metrics, logs and traces. Each one answers a different
question, costs a different amount to keep, and fails you in a
different way, so knowing which to reach for is most of the skill.

## One slow request, three kinds of record

Take one checkout request. It enters through a proxy, goes to an API
service, which calls a payment service, which queries a database. It
takes four seconds and the user gives up. Here is what each kind of
telemetry records about it, if the code is instrumented:

![One request, drawn as a bar through proxy, API, payment and database, produces three records. A metric: the request counter goes up by one and one latency histogram bucket goes up by one, merged with every other request. A log event: one line with fields such as route, status, user and trace id, for this request only. A trace: four nested spans sharing one trace id, showing the database span took most of the time. On the right, the question each answers: is something wrong, what happened to this request, and where did the time go.](img/observability-three-signals.svg)

*The same request as a metric, a log event and a trace. The idea of one defining property per signal is adapted from Peter Bourgon, "Metrics, tracing, and logging" (2017).*

**A metric** adds one to a request counter and one to a bucket in a
[[histograms|latency histogram]]. Nothing about this particular request
survives. It's merged with every other request in the same few
seconds. That's what makes [[metrics]] cheap: you can add counts from
many requests and many servers and the storage doesn't grow with
traffic. The defining property of a metric is that it can be
aggregated. A counter aggregates by adding, a gauge by keeping the last
value, a histogram by adding bucket counts.

**A log event** records this one request: its route, status, user,
how long it took. Logs are about discrete events. That makes them
flexible. You can ask questions later that nobody planned for, like
"which users hit this error?" It also makes them expensive: a busy
service can write more log data than the traffic it serves. How to
make log lines something a machine can query is
[[structured-logging]].

**A trace** records this request's path through every service, as a
tree of timed pieces of work called spans, all sharing one trace id.
The defining property is that it's scoped to one request. It answers
the question the other two can't: of those four seconds, which service
spent them? That's [[distributed-tracing]].

On cost, the three sit on a gradient. Metrics compress well and are the
cheapest to keep. Logs are the heaviest. Traces sit in between; keeping
only some of them is [[trace-sampling]].

## What each one is good for

**Metrics tell you something is wrong.** A request rate, an error rate
and a latency distribution per service (the [[red-method]]) are enough
to notice that checkout got slow, and to page someone. Google's SRE
book calls latency, traffic, errors and saturation the four golden
signals: if you can measure only four things about a user-facing
system, measure those. Metrics are what [[alerting]] and
[[sli-slo-sla|SLOs]] are built on, because they're cheap enough to keep
for every request and every server.

What they can't tell you is which requests. The counter doesn't know
who the user was. You can split a metric by a label, such as route or
status code, but the cost grows with every distinct label value, so a
label like user id is off the table. That limit has its own
node: [[cardinality]].

**Logs tell you what happened to one request.** When you know
something is wrong but not what, you search events: all requests with
status 500 in the last ten minutes, grouped by route. Because each event
keeps its details, you can slice by anything that was recorded,
including high-cardinality fields like user id.

**Traces tell you where the time went.** A service can be slow because
it's slow, or because something three calls away is. In a system where
one user request fans out to many services, an engineer looking only at
the total latency may know there's a problem but not which service is
at fault. That's the problem Google built its Dapper tracing system to
solve.

## Tying the three together

The three are most useful when you can jump from one to the other: from
a spike on a latency graph, to some slow requests, to the trace of one
of them, to the log lines written during it.

The thread that ties them is the trace context: a trace id and span id
passed along with every request. Tracing libraries can put the current
trace and span id into every log record, so a log line leads to its
trace, and a trace leads to its log lines. The same context can link
metrics to traces too (see [[metrics]]). All of it depends on the
context being passed on every call, which is [[distributed-tracing]]'s
job, and in practice [[opentelemetry]]'s.

## Monitoring and observability

The words overlap, and people use them loosely. The useful distinction
is about which questions you can answer.

**Monitoring** is collecting, aggregating and showing numbers about a
system in real time, and alerting on them. It's built around questions
you knew to ask: the metrics and the dashboards that show them are
designed in advance, and are hard to query in ways nobody planned.
Two distinctions help:

- **Symptoms versus causes.** Monitoring should answer "what's broken?"
  (the symptom, such as serving errors) and "why?" (the cause, such as
  database servers refusing connections). Alert on symptoms. Causes are
  for debugging.
- **Black-box versus white-box.** Black-box monitoring tests what a user
  would see from outside, so it only catches problems that are
  happening now. White-box monitoring reads the system's internals,
  metrics and logs, so it can catch problems that are about to happen,
  and failures hidden by retries.

**Observability** is the ability to ask new questions from the outside,
including about problems nobody predicted, without shipping new code
to answer them. A system counts as well instrumented when you don't
need to add instrumentation to debug an issue, because the data you
need is already there. Monitoring is one use of that data.

## Where it gets tricky

**Three pillars, or one source of truth.** A common picture is three
separate systems: a metrics store, a log store, a tracing store. One
camp argues this is the problem. Each store aggregates or drops
different things at write time, so you must decide in advance which
questions you'll ask, then copy ids between tools to follow one
request. The alternative is to record one wide, structured event per
request per service (the same idea as a canonical log line), with the
trace and span id on it, and derive metrics, logs and traces from that
at read time. The case for it is flexibility and exact answers. The
case against is cost: per-request events grow with traffic, the way logs
do, while metrics compress well. Tools built on events handle that by
sampling. The loudest case for this view comes from a vendor that sells
such a tool, but the trade-off it describes is real.

**One person's symptom is another's cause.** A slow database is a
symptom to the team running the database and a cause to the team
running the website on top of it. Whether a signal is a symptom or a
cause depends on whose service you're looking at.

**Logs without context don't join up.** A log line that says "timeout
talking to payments" doesn't say which request, which user or which
trace. Unless the line carries fields and a trace id, you can read it
but not connect it to anything else.

**"Observability" is also a sales word.** Honeycomb borrowed the term
from control theory in 2016, and the "three pillars" framing spread
partly because vendors had a product to sell for each pillar. When
someone says a tool "gives you observability", ask which of the three
questions it answers, what it drops at write time, and what it costs
per request.

**Collecting more isn't free.** Metrics get more expensive with the
number of distinct label values, logs with traffic. Adding telemetry
without deciding what questions it serves fills storage and bills
without making anything easier to debug.

## What this means when you build

- Instrument every service for rate, errors and duration as metrics
  from day one. Alert on those, on symptoms users feel.
- Log one structured event per request per service, with the fields
  you'd want in an incident, and the trace id.
- Pass trace context on every call, including through queues, so a
  request can be followed end to end.
- Keep high-cardinality detail (user id, request id) in logs and
  traces, never in metric labels.
- Decide what each signal costs before turning it on: metric series
  count, log volume, trace sample rate.

## Further reading

- [Metrics, tracing, and logging](https://peter.bourgon.org/blog/2017/02/21/metrics-tracing-and-logging.html), Peter Bourgon, 2017. The short post that gives each signal one defining property, and the cost gradient between them.
- [Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/), Rob Ewaschuk, Google SRE book, chapter 6. Monitoring definitions, symptoms versus causes, black-box versus white-box, and the four golden signals.
- [Observability primer](https://opentelemetry.io/docs/concepts/observability-primer/), OpenTelemetry docs. The OpenTelemetry project's definitions of observability, telemetry, spans and traces.
- [Dapper, a Large-Scale Distributed Systems Tracing Infrastructure](https://research.google/pubs/dapper-a-large-scale-distributed-systems-tracing-infrastructure/), Benjamin Sigelman and others, Google, 2010. Why tracing exists: total latency alone can't tell you which service is at fault.
- [Context propagation](https://opentelemetry.io/docs/concepts/context-propagation/), OpenTelemetry docs. How one trace context links traces, logs and metrics across services.
- [Fast and flexible observability with canonical log lines](https://stripe.com/blog/canonical-log-lines), Brandur Leach, Stripe, 2019. Why logs answer questions metrics dashboards can't, and the one-wide-line-per-request pattern.
- [It's Time to Version Observability: Introducing Observability 2.0](https://www.honeycomb.io/blog/time-to-version-observability-signs-point-to-yes), Charity Majors, Honeycomb, 2024. The argument for wide events as one source of truth, from a vendor that sells them.
