---
id: coordinated-omission
title: Coordinated omission
depth: short
phase: 9
note: >-
  How most load generators hide the worst latency, and how to measure it
  correctly.
needs: [load-testing, histograms]
leads_to: []
compare_with: []
---

# Coordinated omission

Coordinated omission is when the thing doing the measuring slows down
together with the thing being measured, and so skips measuring exactly
the requests that would have been slow. Gil Tene named it. It's the
default behavior of the simplest benchmark loop and of many load
generators, and in one example it made a p99 look 200 times better
than what users got.

## A stall, measured two ways

Say a test is supposed to send one request every 10 ms. For 100
seconds the server answers every request in 1 ms. Then it stalls for
100 seconds.

A closed-loop client (see [[load-testing]]) sends a request, waits for
the reply, then sends the next. During the stall it sends one request,
waits the whole 100 seconds, and records one value of 100 seconds. It
never sends the other requests the plan called for, so they're never
timed. Over the 200 seconds, the recorded data says about 99.99% of
requests took 1 ms or less.

A user who arrived at a random moment would disagree. Half of the 200
seconds was the stall. A request planned at the start of the stall
would have waited about 100 seconds, one planned halfway through about
50, and so on down. Counted that way, only about 50% of requests were
at 1 ms or below.

![Three rows over time. Plan: a tick for every scheduled send, with a server stall across the middle. Closed loop: short bars before and after, one tall bar for the single request that sat through the stall, and crosses where planned sends were never made or timed. Corrected: a bar for every tick, tallest at the start of the stall and shrinking toward its end.](img/coordinated-omission-stall.svg)

*What a closed loop records during a stall, and what the plan says users would have seen.*

The generator "coordinated" with the server: it backed off when the
server was slow, so the slow period is almost missing from the
[[histograms|histogram]].

## Two halves of the problem

**Not sending on schedule.** A generator with a fixed pool of workers,
each sending one request and waiting, is a closed system even if you
meant to simulate independent users. When requests slow down, each
worker sends fewer of them.

**Timing from the wrong moment.** Even a generator that catches up
after a stall usually times each request from when it actually went
out. From the users' point of view, the request should have gone out
on schedule, and the time it spent waiting to be sent is part of its
latency.

## Measuring it correctly

- **Send on a fixed schedule.** Decide ahead of time when each request
  should go out, for example a constant rate. If a worker falls behind,
  send the missed requests as soon as it can to get back on schedule,
  instead of skipping them.
- **Time from the intended send.** Latency = (time the reply arrived) −
  (time the request should have been sent). wrk2 does this with its
  `-R` rate option. YCSB does it with a `-target` rate and
  `measurement.interval=both`, which reports "intended" latencies next
  to the raw ones.
- **Or fill in the gaps afterwards.** If your tool drops the missed
  requests, HdrHistogram's `recordValueWithExpectedInterval` adds the
  missing samples: given a 100-second value and a 10 ms expected
  interval, it also records 99.99 s, 99.98 s and so on, down to about
  10 ms.
- **Fully asynchronous senders** avoid the first half, but only with
  protocols where you can send without waiting for the previous reply,
  or one request per connection.

## How big the error gets

In wrk2's own example, a 30-second test at 2,000 requests a second
against a web server paused once for 1.4 seconds. The corrected p99
was 1.27 s. The uncorrected p99 from the same run was 6.04 ms, about
200 times smaller. Even a quiet run with no pause showed a gap of about
2 times at the p99.

In a ScyllaDB engineer's YCSB run against one database core, the
closed-loop p99 for reads was 249 µs. With a target rate of 8,000
operations a second, which the database couldn't reach (it managed
about 6,400 to 6,500), the intended-time p99 for reads was about
665 ms.

## Where it gets tricky

**The correction assumes an open workload.** Timing from the intended
send models users who arrive whether or not the server is keeping up.
If production really is a closed pool of callers, the corrected number
overstates what they see. Pick the model that matches production first
([[load-testing]]).

**Falling short of the target rate is a signal.** If the generator
asked for 8,000 a second and the server did about 6,500, the test ran past
the server's limit. The corrected latencies then keep growing for as
long as the test runs, because the backlog never clears.

**Timer precision.** A rate-based generator sleeps between sends. wrk2
notes its latencies are only accurate to about ±1 ms because of OS
sleep behavior, so it can't see sub-millisecond effects well.

**It's not only load generators.** wrk2's author notes the same
measurement mistakes are common in monitoring code.

## What this means when you build

- Use a load generator that sends on a schedule and times from the
  intended send time, or turn that mode on (wrk2's `-R`, YCSB's
  `-target` with `measurement.interval=both`).
- Always check that the rate you got matches the rate you asked for.
- Compare corrected and uncorrected results. A big gap means the test
  hit stalls, and the corrected numbers are the ones users felt.
- Record into histograms that can take the correction.

## Further reading

- [wrk2](https://github.com/giltene/wrk2), Gil Tene. A load generator built to avoid coordinated omission; its README explains the problem and shows corrected and uncorrected percentiles from the same run.
- [On Coordinated Omission](https://www.scylladb.com/2021/04/22/on-coordinated-omission/), Ivan Prisyazhynyy, ScyllaDB, 2021. The two halves of the problem, the fixes, and YCSB runs showing how much the flags change the p99.
- [HdrHistogram](https://github.com/HdrHistogram/HdrHistogram), Gil Tene and contributors. The expected-interval correction and the 100-second stall example.
