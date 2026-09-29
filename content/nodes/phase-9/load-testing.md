---
id: load-testing
title: Load testing
depth: deep
phase: 9
note: >-
  Open vs closed workload models, and designing a test that finds the
  real limit.
needs: [latency-percentiles, littles-law]
leads_to: [coordinated-omission, benchmarking-pitfalls, capacity-planning]
compare_with: []
---

# Load testing

A load test sends made-up traffic at a service to see how its latency
and errors change as the load goes up, and where it breaks. The
numbers you get depend less on the tool than on one design choice most
people never make on purpose: does the load generator wait for a reply
before sending the next request, or not? Get that wrong and the test
reports a p99 far better than your users will ever see.

## Two ways to decide when to send

Every load generator has a loop that decides when the next request
goes out. There are two kinds.

**Closed.** A fixed number of clients (virtual users, threads,
connections). Each one sends a request, waits for the reply, maybe
pauses ("think time"), and sends again. A new request only starts when
an old one finishes. The simplest benchmark loop you'd write without
thinking is closed:

```
loop:
  send request
  wait for response
  record the time
```

**Open.** Requests arrive on a schedule of their own, say 1,000 a
second, whether or not earlier ones have finished. The loop sends on a
timer and records each reply when it comes back, on another thread or
callback.

![Two diagrams. Closed: a box of N clients sends into a queue and a server, and the reply loops back to the clients, who wait for it before sending again; a note says a slow server means fewer sends. Open: many arrows enter the queue at a set rate regardless of the server, and finished requests leave; a note says a slow server means the queue grows.](img/load-testing-open-closed.svg)

*Closed and open load. Adapted from Bianca Schroeder, Adam Wierman and Mor Harchol-Balter, "Open Versus Closed: A Cautionary Tale" (NSDI 2006), figure 1.*

Tools support one or both, under different names. In k6, the
"arrival-rate" executors are open, and the others, such as
`constant-vus`, are closed. In a 2006 survey of web load
generators, most were closed, and their docs often didn't say which
model they used.

## Why the closed loop flatters your server

Watch what happens when the server slows down.

In a closed test, each client is stuck waiting on its slow reply, so
it sends less. The request rate drops exactly when the server is in
trouble, and the server gets a break it would never get from real
users. [[littles-law|Little's law]] says requests in flight = arrival
rate × time in the system. In a closed test the number in flight is
capped at the number of clients, so when latency goes up, the arrival
rate has to go down.

In an open test the arrival rate stays fixed. When latency goes up, the
number in flight goes up with it: a queue forms, every request that
arrives during the slow period waits in it, and the queue has to drain
after. Those waiting requests are what real users experience.

The difference is big:

- At the same load, the mean response time of an open system can be an
  order of magnitude or more above the closed one.
- Adding more closed clients doesn't close the gap quickly. When
  request sizes varied a lot, even 1,000 closed clients still saw much
  lower response times than the open system.
- Variability in how long requests take matters much more in an open
  system, because in a closed one few short requests are ever stuck
  behind a long one.

A simulation makes it concrete. Take a server that answers in 0.1 ms
99.9% of the time and 10 ms 0.1% of the time, busy 80% of the time. A
single closed client sees a p99 under 1 ms, because no queue can ever
form behind it. Open arrivals at the same load see a p99 over 25 ms.
A closed benchmark underestimated the p99 by at least 25 times. That
blind spot has a name, [[coordinated-omission]].

## Which model matches your traffic

Neither is exactly right for most real systems, so ask which one your
traffic is closer to.

- **Many independent users,** each making a few requests and leaving:
  open. A public API or website is here. A rule of thumb from the
  study: sessions of 5 requests or fewer behave open, and more than
  1,000 simultaneous users suggests open.
- **A fixed set of callers** that each wait for a reply: closed. A pool
  of workers pulling jobs, or a batch job with fixed concurrency, is
  here. Sessions of 10 or more requests behave closed.
- **Think time doesn't decide it,** despite what you'd guess. The
  number of requests per session does.

Real clients also muddy the picture. A closed client that retries on
timeout adds requests when latency rises, and the arrival rate goes up
instead of down. Stable production systems usually end up closer to
closed, because something caps their concurrency or their rate. That's
the job of [[load-shedding]] and [[admission-control]].

## Sizing the generator

An open generator still needs enough concurrency to keep its schedule.
By Little's law, requests in flight = rate × latency. In the k6 docs'
example, 1 iteration a second against an endpoint that takes about 6
seconds had 11 virtual users allocated to keep up.

If the generator runs out, it can't send on time. k6's arrival-rate
executors then skip the iteration and count it in `dropped_iterations`.
A skipped request is never sent and never timed, so it's missing from
your latency numbers. A few drops at the start mean you need more
virtual users. Many drops late in the test usually mean the server has
slowed down so much that every virtual user is stuck waiting, which is
exactly the period you most wanted to measure.

The load generator can also be the bottleneck. Watch it while it runs,
like any other part of the test; see [[benchmarking-pitfalls]].

## Finding the real limit

The usual test for the limit is a ramp, also called a breakpoint,
capacity or limit test:

1. Make sure the system passes normal-load tests first.
2. Turn off autoscaling for the test. Otherwise you find the limit of
   your cloud bill, not of the system.
3. Use an open, arrival-rate load. A closed ramp would back off as the
   server slows and never push it over.
4. Raise the rate slowly. A jump makes it hard to see when and why
   things started to go wrong.
5. At each step, record the rate actually served, the
   [[latency-percentiles]] (p50, p99, p99.9) and the error rate.
6. Keep going past the point where it degrades. Note each stage: slower
   responses, responses slow enough to hurt users, timeouts, errors,
   collapse.

The result is a curve of latency against throughput. The number worth
reporting is the highest rate at which the p99 still meets your
target, with the rate and the percentile side by side. The phase 7
[[storage-benchmarks]] article uses the same curve for databases.

## Where it gets tricky

**Open isn't the whole truth either.** An open model assumes arrivals
don't depend on the server at all. Real clients [[timeouts|time out]] and retry. In
the same simulation, adding a retry after 15 ms (still far above the
server's usual p99) made the queue grow without bound: each retry adds
load, which raises latency, which causes more retries. If your clients
retry, test with their real retry policy, or you'll miss the collapse.
More on that in [[retries-with-backoff]] and [[metastable-failures]].

**Closed isn't always wrong.** If production really is a fixed pool of
callers, a closed test models it well, and an open test would
overstate the tail.

**Dropped requests look like success.** An open-model tool that skips
requests when it can't keep up hides the slowest period, the same way a
closed loop does. Make dropped requests fail the test.

**The model is often chosen by accident.** Most people use whatever
their tool does by default, and most tools don't say. Check before you
compare numbers.

## What this means when you build

- Decide on purpose: open for independent users, closed for a fixed
  pool of callers. Write the choice next to the results.
- For latency under load, use an open generator that times each request
  from when it was supposed to be sent.
- Give the generator enough concurrency (rate × expected latency, with
  room for slow periods), and treat dropped requests as failures.
- Ramp slowly to find the limit, and report the rate and the p99
  together.
- Include your real client timeouts and retries in at least one test.

## Further reading

- [Open Versus Closed: A Cautionary Tale](https://www.usenix.org/legacy/event/nsdi06/tech/full_papers/schroeder/schroeder.pdf), Bianca Schroeder, Adam Wierman and Mor Harchol-Balter, NSDI 2006. The open, closed and partly-open models, how differently they behave, and how to pick one.
- [Open and Closed, Omission and Collapse](https://brooker.co.za/blog/2023/05/10/open-closed.html), Marc Brooker, 2023. A simulation of both models, the p99 a closed benchmark misses, and how retries push an open system into collapse.
- [Telling Stories About Little's Law](https://brooker.co.za/blog/2018/06/20/littles-law.html), Marc Brooker, 2018. Little's law and how closed clients, open clients and retrying clients change arrival rate as latency grows.
- [Open and closed models](https://grafana.com/docs/k6/latest/using-k6/scenarios/concepts/open-vs-closed/), Grafana k6 docs. How one popular tool maps its executors to the two models.
- [Breakpoint testing](https://grafana.com/docs/k6/latest/testing-guides/test-types/breakpoint-testing/), Grafana k6 docs. Designing a ramp to find the limit.
- [Dropped iterations](https://grafana.com/docs/k6/latest/using-k6/scenarios/concepts/dropped-iterations/), Grafana k6 docs. What happens when an open-model generator can't keep up.
