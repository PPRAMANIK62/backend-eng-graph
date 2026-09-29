---
id: red-method
title: The RED method
depth: short
phase: 9
note: >-
  Rate, errors, duration for every service.
needs: [latency-percentiles, histograms]
leads_to: [sli-slo-sla, alerting]
compare_with: [use-method]
---

# The RED method

The RED method says what to measure for every service: its **R**ate of
requests, the **E**rrors among them, and the **D**uration they take.
Those three describe the service the way its callers see it: how much
work it's getting, how much of it fails, and how long it makes people
wait. Tom Wilkie came up with it in 2015 as a monitoring rule for
microservices.

## Three numbers per service

Take an online shop with a checkout service that calls a payments
service and an inventory service. For each of the three, you record:

- **Rate:** requests per second.
- **Errors:** how many of those requests are failing.
- **Duration:** how long the requests take, as a distribution, not one
  number.

The last point matters most. An average duration hides the slow requests
that people notice, so duration is read as [[latency-percentiles]]: p50,
p99 and so on. To get those from a live service, you count requests in
latency buckets and read percentiles from the counts later (see
[[histograms]]).

The value comes from doing the same three for every service. You get
one consistent view of how the whole system behaves, and someone on
call can look at a service they've never worked on and still tell
whether it's healthy. When checkout gets slow,
you look at the duration of payments and inventory next and follow the
slowness down the call chain.

## Why requests and not resources

The older [[use-method|USE method]] asks about utilization, saturation
and errors for each resource: CPUs, disks, network links. That fits
hardware well. Wilkie found it awkward for services, where it's not
obvious what the "resource" is, and even for memory, where it's unclear
what counts as used (do caches count?).

RED skips that question and looks at requests instead. It's also a
decent stand-in for how happy users are. A high error rate means users
see errors. A high duration means the site feels slow. That makes these
three good numbers to [[alerting|alert on]] and to write service level objectives
against (see [[sli-slo-sla]]).

## RED, USE and the four golden signals

Google's SRE book has a similar list, the four golden signals: latency,
traffic, errors and saturation. Latency is duration, traffic is rate,
so it's RED plus saturation, meaning how full the service is. A service
has no single saturation number. One stand-in is the CPU it uses as a
fraction of its quota. Another is rising latency, which often warns
that something is filling up.

The two methods split the work. RED reports symptoms, what users feel.
USE reports causes, which machine or resource is struggling. A common
approach is to alert on the RED numbers, and reach for USE, and then
[[profiling]], once you know something is wrong.

## Where it gets tricky

**Failed requests distort duration.** A request that fails at once with
a 500, because the database connection is gone, is very fast. Mix those
into the duration and the service looks faster while it's failing.
Track the duration of failed requests separately. A slow error is worse
than a fast one.

**"Error" needs a definition.** Some failures are explicit, like an HTTP
500. Some are implicit: a 200 with the wrong content. Some are by
policy: if you promised one-second responses, a two-second success can
count as an error. A load balancer sees the first kind; only end-to-end
checks see the second.

**The mean still hides the tail.** The SRE book's illustration: a
service with an average latency of 100 ms at 1,000 requests per second
might easily have 1% of requests taking 5 seconds. Record counts per
latency bucket, with bucket edges growing roughly exponentially (the
book's example grows them by about 3x each step), so the tail stays
visible.

**RED has no saturation.** Rate tells you how much work arrives, not how
close the service is to its limit. That's what the fourth golden
signal, or USE on the machines underneath, is for.

## What this means when you build

- Give every service the same three metrics with the same names.
- Record duration as a histogram, never only as an average, and keep
  failed requests' duration apart from successful ones.
- Decide what counts as an error before you alert on it, including
  "too slow".
- Alert on RED. Diagnose with USE and profiles.

## Further reading

- [The RED Method: How to Instrument Your Services](https://grafana.com/blog/2018/08/02/the-red-method-how-to-instrument-your-services/), Grafana Labs, 2018. Tom Wilkie's reasons for RED, quoted from his talk, and how it sits next to USE and the golden signals.
- [Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/), Rob Ewaschuk, Google SRE book, chapter 6. The four golden signals, error latency, what counts as an error, and latency buckets.
