---
id: cardinality
title: Metric cardinality
depth: short
phase: 14
note: >-
  Why a user ID in a metric label breaks the metrics system.
needs: [metrics]
leads_to: []
compare_with: []
---

# Metric cardinality

A metric's cardinality is how many separate time series it turns into:
one for every distinct combination of label values. Each series costs
memory, CPU, disk and network in the metrics system, and the count
multiplies with every label you add. Put a label with unbounded values
on a metric, like a user id, and one line of code can create millions
of series.

## Every label combination is a series

In Prometheus a time series is a metric name plus a set of labels (see
[[metrics]]). Change any label value and you have a different series.
So a request counter with a `method` label and a `code` label has one
series for every method-and-code pair that has occurred, and adding a
`handler` label multiplies that again by the number of handlers.

Here's how that scales. The node exporter reports free space for
every mounted filesystem, so each machine has some tens of series for
`node_filesystem_avail`:

![Three rows. First row: one node reports tens of filesystem series. Second row: times 10,000 nodes gives roughly 100,000 series, which Prometheus handles fine. Third row: adding a per-user label with 10,000 users multiplies that into tens of millions of series, which is too many for one Prometheus.](img/cardinality-multiplication.svg)

*How one extra label multiplies the series count. Adapted from the Prometheus authors, "Instrumentation" (Prometheus docs).*

- On 10,000 machines that's roughly 100,000 series. Prometheus
  handles that fine.
- Now add a label for per-user quota. With 10,000 users on 10,000
  machines you're into the tens of millions of series, which is too
  many for Prometheus.

Nothing about the code changed except one label. The cost is the
product of every label's distinct values, so the label with the most
values dominates.

## What a series costs

Each extra series has RAM, CPU, disk and network costs. One series is
nothing. Hundreds of label combinations on hundreds of servers add up
fast. There's an opportunity cost too: the room a runaway metric takes
is room other, more useful metrics don't get.

A metrics system is built to be cheap because it merges many events
into a few numbers. A high-cardinality label undoes that: the system
ends up storing close to one series per user or per request, which is
the job of a log store, done badly.

## Rules of thumb

The Prometheus guidance is blunt:

- Most metrics should have no labels at all.
- Keep a metric's cardinality below 10. The few that go above that
  should be a handful across your whole system.
- If a metric has over 100 series, or could grow that large, reduce
  its dimensions or move the analysis out of monitoring into a
  general-purpose processing system.
- When unsure, start with no labels and add them when a real question
  needs one.

- Never put user ids, email addresses or other unbounded sets of
  values in labels.

A test that catches most mistakes: can you list the label's possible
values today? HTTP method, status code, route template, region: yes.
User id, request id, full URL path with ids in it, error message
text: no. Those go in log events and trace spans, which are built to
hold one record per request (see [[structured-logging]] and
[[distributed-tracing]]).

## Where it gets tricky

**It creeps in by accident.** Nobody adds a `user_id` label on purpose
after reading this. The usual leak is a label whose value looked
bounded: a raw URL path instead of a route template, an error string
that includes an id, a label copied from request headers.

**Small labels multiply.** Each label can look harmless on its own.
The counts multiply, so several modest labels on one metric can
produce more series than one obviously big one, and the real number
is whatever combinations your traffic happens to produce.

**Other kinds of store make a different trade.** Whether keeping raw
events instead of pre-aggregated series gets around this, and what it
costs instead, is part of the debate in [[observability]].

## What this means when you build

- Label only with values you could list in advance.
- Use route templates, not raw paths, and status codes, not messages.
- Keep per-user and per-request detail in logs and traces.
- Watch the series count per metric in your metrics system, and treat
  a jump in it like any other regression.

## Further reading

- [Instrumentation](https://prometheus.io/docs/practices/instrumentation/), Prometheus docs (3.15). The "Do not overuse labels" section: costs, the below-10 and over-100 guidance, and the node exporter example.
- [Metric and label naming](https://prometheus.io/docs/practices/naming/), Prometheus docs (3.15). The warning against user ids, emails and unbounded values in labels.
