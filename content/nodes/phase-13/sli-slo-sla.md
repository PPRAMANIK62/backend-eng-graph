---
id: sli-slo-sla
title: SLIs, SLOs and SLAs
depth: deep
phase: 13
note: >-
  What you measure, what you aim for, and what you promise.
needs: [latency-percentiles, availability-math, red-method]
leads_to: [error-budgets, alerting, chaos-engineering, canary-analysis]
compare_with: [observability]
---

# SLIs, SLOs and SLAs

Three terms for three different jobs. A service level indicator (SLI)
is what you measure, a service level objective (SLO) is the target you
aim for, and a service level agreement (SLA) is what you promise a
customer, with a penalty if you miss. Getting them right gives you a
number that says whether users are happy, and a way to decide between
shipping features and fixing reliability.

## Three words, one example

Take a checkout API. Here are the three layers for it:

- **SLI:** the share of checkout requests in the last four weeks that
  returned a non-5XX response. A number between 0% and 100%.
- **SLO:** that share should be at least 99.9%. An internal target
  that your team watches and acts on.
- **SLA:** a contract with your paying customers saying that if
  availability drops below some lower number in a month, they get a
  credit on their bill.

The quick way to tell an SLO from an SLA: ask what happens when it's
missed. If nothing is written down, it's an SLO. If money or a contract
is involved, it's an SLA. In practice, people say "SLA" when they mean
SLO. A real SLA breach is a legal matter, and engineers rarely write
SLAs; business and legal teams do, with engineers helping to judge
whether the numbers are reachable.

A service can have SLOs without any SLA. Google Search, for example, has
no contract with the public, but going down still costs reputation and
ad revenue, so it still has SLOs.

## Picking the indicator

Start from what users care about, not from what's easy to graph. What
users care about depends on what kind of system it is:

- **Request-driven** (an HTTP or gRPC API): did the request succeed
  (availability), how long did it take (latency), and was the answer
  full or [[graceful-degradation|degraded]] (quality).
- **Pipeline** (a batch or stream job): how old is the data
  (freshness), how much of the input got processed (coverage), and was
  the output right (correctness).
- **Storage:** can you read back what you wrote (durability), plus
  availability and latency.

Pick a handful, five kinds or fewer. Too many and nobody knows which
one matters.

The form that works best is a ratio: good events divided by valid
events. "Requests that succeeded / all requests." "Requests that
finished in under 300 ms / all requests." Every SLI then reads the same
way: 100% means nothing is broken, 0% means nothing works. The same
alerting, dashboards and budget math work for all of them.

Latency fits this form too. Instead of "p99 under 900 ms", you count
the share of requests faster than 900 ms. It's the same idea as a
[[latency-percentiles|percentile]] written the other way around, and it
lets you set more than one threshold: 90% of requests under 100 ms and
99% under 400 ms catches both the typical user and the slow tail.
Counting slow requests directly beats estimating them from
[[histograms|histogram]] buckets, if your server can record it.

The [[red-method|RED metrics]] (rate, errors, duration) you already
collect are usually the raw material. Errors and duration become the
numerators of availability and latency SLIs.

## Where you measure changes what you see

The same SLI can be measured in several places, and each one misses
something. Split it into two parts. The **specification** is what you
care about: "home page requests that load in under 100 ms". The
**implementation** is how you count it:

- **Server logs.** Cheap and already there. But a request that never
  reaches your server, because DNS or the [[load-balancing|load
  balancer]] failed, never shows up.
- **The load balancer.** Closer to the user's experience than the
  application's own logs, and the metrics are often already there.
- **Probes** (synthetic requests from outside). Catch requests that
  can't reach your network at all, but can miss problems that hit only
  some users.
- **Client instrumentation** (code in the browser or app that reports
  back). Closest to what the user feels, and the most work to build.

Each trades quality (how close to the real experience), coverage (how
many users it sees) and cost. Start with what you already have, often
the load balancer's metrics, and move closer to the user when the
numbers and the complaints don't line up.

![A vertical scale of availability, higher at the top. From top to bottom: what you actually deliver, measured by the SLI; the internal SLO, a tighter target your team acts on; the published SLO, what you tell users to expect; and the SLA, a looser contractual floor with credits if you fall below it. The gaps between them are labelled as your safety margins. A note at the top warns that delivering far above the published SLO teaches users to depend on it.](img/sli-slo-sla-ladder.svg)

*The ladder from measurement to contract. Each step down is a margin that lets you fix problems before the next one is broken.*

## Setting the objective

A simple way to start: measure what you have, then round down. One
worked example, a mobile game's API over four weeks:

- 3,663,253 requests, 97.123% of them successful.
- The 90th percentile latency was 432 ms, the 99th was 891 ms.
- Proposed SLOs: 97% availability, 90% of requests under 450 ms, 99%
  under 900 ms.

Starting from current performance is fine if you plan to revisit it.
Don't let it trap you, though: a target copied from how the system
behaves today, without thinking, can commit you to heroic efforts to
keep meeting it. Start loose and
tighten it; relaxing a target that turned out to be impossible is
harder.

**Never 100%.** Users can't tell 99.99% from 100%, because their phone,
Wi-Fi and ISP fail more often than that. Change is the top source of
outages, so a 100% target means never shipping. And once the target is
100%, all your team can do is react to failures, which are guaranteed.
[[availability-math]] shows what each target allows in minutes, and
why your dependencies cap what you can promise.

**Choose a window.** The SLO holds over some period. A rolling window
matches what users remember: a big outage on the last day of a month
isn't forgotten on the first day of the next. A calendar window (a
month, a quarter) matches business planning. A four-week rolling window
is a good default. Use whole weeks, so every window has the same number
of weekends; weekend traffic often looks different.

**Get agreement.** Three groups have to sign off: product (this level
keeps users happy), developers (we'll slow down when we miss), and
whoever runs the service (we can hold this without burning out). If
they can't agree, the SLO is just a number on a dashboard.

## Internal targets, published targets, contracts

Most teams keep more than one number:

- An **internal SLO**, tighter than anything you publish, so you notice
  and fix problems before users do.
- A **published SLO**, what you tell users to expect. Being explicit
  stops users from guessing, whether they guess too high and depend on
  you too much, or too low and avoid you.
- An **SLA**, lower still, because missing it costs money. Google
  services that commit to less externally often still aim for 99.99%
  internally.

A real SLA shows how narrow the contract is. Amazon's EC2 SLA (the
version current when this was written) promises 99.99% monthly uptime
for a Region, if your instances run in two or more Availability Zones,
and 99.5% for a single instance. Miss 99.99% and you get 10% of that
month's EC2 bill back; below 99.0%, 30%; below 95.0%, all of it. The
credit only counts against future bills, you have to file a claim with
your own request logs as proof, and it's your only remedy.
"Unavailable" means no external connectivity. Slow, erroring or partly
broken doesn't count.

So an SLA tells you what the provider will pay back, not how often
you'll be down. Providers often run well above their SLAs, too, which
is why multiplying your dependencies' SLA numbers only gives a rough
guide.

## What an SLO is for

An SLO turns reliability into a control loop: measure the SLI, compare
it to the target, decide whether to act, act. Without the target you
don't know whether a rising latency graph needs anything done today.

The gap between 100% and the SLO is the [[error-budgets|error budget]]:
the failure you're allowed. Spending it on risky launches, and slowing
down when it's gone, is how the SLO decides between features and
reliability. The SLO is also what [[alerting]] should be built on, so
that someone hears about a threat to the budget before it's spent.

## Where it gets tricky

**Doing much better than your SLO is a problem too.** Users build on
what you deliver, not what you promise. Google's Chubby lock service
was so reliable that other teams added dependencies that assumed it
never failed, so real outages broke them. The fix was to take Chubby
down on purpose in any quarter where real failures hadn't already
brought it down to its target, to flush out those dependencies early.

**Averages hide the tail.** An SLI that averages latency can stay flat
all day while the tail moves a lot; in one Google example, 5% of
requests were twenty times slower than the typical one. Use thresholds or
percentiles (see [[latency-percentiles]]).

**Time or requests?** EC2's SLA counts minutes with no connectivity.
Most SLIs count failed requests. For a service that's partly up, the
two tell different stories, and the request count is usually closer to
what users feel. See [[availability-math]].

**Some things aren't yours to set.** You can't put an SLO on how many
requests per second users send. You can only set targets on how you
respond to them.

**Per-customer SLOs get noisy.** A customer who sends ten requests a
month is either at 100% or far below target after a single failure.
Tracking how many customers are in SLO is useful in aggregate, not one
customer at a time.

**The real target is a user journey.** "Search, add to cart, pay" is
what users care about, and no single request's SLI captures it. Joining
events into journeys is harder, so they usually come after the basic
per-endpoint SLIs are working.

**Two zones don't multiply out.** Running a 99.9% service in two zones
doesn't give you 99.9999%, because the copies share dependencies,
[[failure-domains]] and control planes.

## What this means when you build

- Write SLIs as good events over valid events, so every one reads 0 to
  100% and plugs into the same tooling.
- Start with availability and one or two latency thresholds for your
  main endpoints, measured at the load balancer.
- Pick a four-week rolling window, a target a bit below what you
  measure today, and write down why.
- Keep an internal SLO tighter than anything you publish, and don't
  promise in an SLA what you can't pay for.
- Read your providers' SLAs as refund terms, not as a forecast of
  their reliability.
- Revisit the SLO when outages don't show up in it, or when it fires
  and nobody cared.

## Further reading

- [Service Level Objectives](https://sre.google/sre-book/service-level-objectives/), Chris Jones, John Wilkes, Niall Murphy, Cody Smith, Google SRE book, 2016. The definitions of SLI, SLO and SLA, the Chubby story, and advice on choosing targets.
- [Implementing SLOs](https://sre.google/workbook/implementing-slos/), Steven Thurgood, David Ferguson, Alex Hidalgo, Betsy Beyer, Google SRE Workbook, 2018. A step-by-step recipe with a worked example, SLI types per system, where to measure, and time windows.
- [Embracing Risk](https://sre.google/sre-book/embracing-risk/), Marc Alvidrez, Google SRE book, 2016. Why 100% is the wrong target, and availability counted by time vs by requests.
- [The Calculus of Service Availability](https://static.googleusercontent.com/media/sre.google/en//static/pdf/calculus_of.pdf), Ben Treynor, Mike Dahlin, Vivek Rau, Betsy Beyer, ACM Queue, 2017. Internal targets tighter than external commitments, and how dependencies cap your SLO.
- [Amazon Compute Service Level Agreement](https://aws.amazon.com/compute/sla/), AWS. A real SLA: what's promised, what counts as down, and what you get back.
- [Availability and Beyond](https://docs.aws.amazon.com/whitepapers/latest/availability-and-beyond-improving-resilience/understanding-availability.html), Michael Haken, AWS, 2021. Why dependencies often beat their published SLAs, so multiplying SLA numbers gives only a rough guide.
