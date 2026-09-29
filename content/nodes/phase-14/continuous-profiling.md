---
id: continuous-profiling
title: Continuous profiling
depth: short
phase: 14
note: >-
  Profiling production all the time, cheaply.
needs: [profiling, flame-graphs, ebpf]
leads_to: []
compare_with: []
---

# Continuous profiling

Continuous profiling means running a sampling [[profiling|profiler]] on
production all the time, at a cost low enough that nobody notices, and
storing every profile with labels so you can query it later. Instead of
attaching a profiler when something is already slow, you already have
the profile from the moment it got slow, from last week, and from the
version before the deploy.

## Why a one-off profile isn't enough

The usual way to profile is on demand: something is slow, you attach a
profiler or pull a profile from one instance, and you read it. That
works when you can reproduce the problem. It fails for the incident that
happened at night and is gone by morning, for the slowdown that crept in
over ten releases, and for code that's a little hot in many programs but
not hot enough in any one of them to stand out.

Continuous profiling covers all three:

- **After an incident**, the profile from that hour is already stored.
- **Between versions**, you can compare this week's profile with last
  week's, or one release with the next, and see which functions changed.
- **Across a whole fleet**, you can add up profiles from every program.
  At Google this showed that the zlib compression library accounted for
  nearly 5% of all CPU cycles in the fleet, though it was a small share
  of any single program. A small speedup in a routine everyone uses
  saves money everywhere.

## How it stays cheap

The profiler is the same kind you'd run by hand: on a timer or hardware
event it records the current stack. The trick is how often and where it
runs. Owners of production services won't accept latency
getting more than a few percent worse, and at fleet scale any wasted
overhead is real money.

Google-Wide Profiling (GWP), described in 2010, samples in two
dimensions:

- **Across machines.** At any moment only a small random subset of the
  fleet is being profiled. A collector picks machines, profiles each
  one for a few minutes, and moves on.
- **Within a machine.** On a profiled machine, only some events are
  recorded, at a rate capped so that the machine pays at most a few
  percent.

![Left: a grid of eight hosts over twelve profiling rounds, where in each round two hosts at random are highlighted as being profiled and the rest are not profiled at all. Right: inside one profiled machine, tick marks along a running program show a stack being recorded every Nth event or timer tick, with the rate capped so the machine pays at most a few percent; the raw stacks are tagged with job, machine and datacenter and symbolized later elsewhere, then stored in a profile store queryable over time, with a fleet-wide cost under 0.01%.](img/continuous-profiling-two-dimensions.svg)

*Sampling in two dimensions. Adapted from Gang Ren and others, "Google-Wide Profiling" (IEEE Micro, 2010).*

Put together, GWP's cost across the whole fleet came to less than 0.01%.
Two more choices kept it there. It skipped full call stacks in its
machine-wide profiles, because [[stack-walking|unwinding stacks]] is expensive. And
it didn't turn addresses into function names on the profiled machines.
Production binaries usually ship without debug symbols, so GWP saved the
unstripped binaries in a central store and symbolized profiles later, on
other machines.

## Where the profiles come from

There are two ways to get profiles out of a program:

- **Pull.** The program serves its own profiles over HTTP and a
  collector asks for them. Go made this common with its built-in
  profiling endpoints, and GWP worked the same way through a shared
  library with a small HTTP server in each program.
- **Push from an agent.** An agent on the host profiles every process
  from outside, often with [[ebpf]], without any change to the programs.
  Parca's agent works this way, and so does the eBPF profiler Elastic
  donated to OpenTelemetry.

Either way, each profile is stored as a series identified by labels,
much like a metric, and you query by label: this service, this version,
this hour. The result is usually shown as a [[flame-graphs|flame graph]]
(or an icicle graph, the same thing upside down).

## Where it gets tricky

**Overhead numbers aren't comparable.** GWP's "under 0.01%" is an
average over a fleet where almost every machine isn't being profiled at
any given moment. Per profiled process, the cost is a few percent at
most; one vendor quotes about 2 to 5% for its own profilers. Ask which
one a number describes.

**Sampling misses things.** Any one sampled profile can miss parts of
the execution. Continuous collection answers this with volume: enough
samples over time become statistically meaningful.

**Symbols are the hard part.** A stack of raw addresses is useless
without the matching binary's symbols. Code generated at runtime, as in
Java, can't be symbolized afterwards, because that code isn't available
offline.

**The standard is still moving.** Formats like pprof and JFR are
popular, but there was no common protocol for continuous profiling.
OpenTelemetry's profiles signal entered public alpha in 2026 with a
format that converts to and from pprof without loss, and profile samples
that can carry a trace and span ID, so you can jump from a slow span to
the code that was running. Alpha means it shouldn't carry critical
production work yet, and production backends for it hadn't appeared
when this was written.

## What this means when you build

- Make every service expose its profiles (in Go, the pprof HTTP
  endpoints), so a collector can pull them.
- Tag profiles with service, version and host, so you can compare
  releases.
- Keep symbols for every binary you ship, or the profiles you collect
  won't be readable.
- Before a performance project, look at the fleet-wide profile to find
  what actually costs the most.

## Further reading

- [Google-Wide Profiling](https://research.google.com/pubs/archive/36575.pdf), Gang Ren, Eric Tune, Tipp Moseley, Yixin Shi, Silvius Rus, Robert Hundt, IEEE Micro, 2010. The design of an always-on profiler for a whole fleet: two-dimensional sampling, offline symbolization, and what the data was used for.
- [Parca overview](https://www.parca.dev/docs/overview), Parca authors. Why profile continuously, push vs pull, labels, and an eBPF whole-system agent.
- [What is continuous profiling?](https://grafana.com/docs/pyroscope/latest/introduction/continuous-profiling/), Grafana Labs. On-demand vs continuous, and a vendor's overhead figure for its own profilers.
- [OpenTelemetry Profiles Enters Public Alpha](https://opentelemetry.io/blog/2026/profiles-alpha/), OpenTelemetry Profiling SIG, 2026. The new standard format, the eBPF agent, links from profiles to traces, and what alpha means.
