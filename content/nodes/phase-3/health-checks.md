---
id: health-checks
title: Health checks
depth: short
phase: 3
note: >-
  How a load balancer decides a backend is broken: probing it on a
  timer, or watching its real traffic, then taking it out and back in.
needs: [load-balancing]
leads_to: [service-discovery, deployment-strategies, cascading-failures, autoscaling]
compare_with: [failure-detection, circuit-breakers]
---

# Health checks

A [[load-balancing|load balancer]] should only send traffic to
backends that can serve it. Health checks are how it finds out. There
are two ways: ask each backend on a timer (active checks), or watch how
real requests to it go (passive checks). Most setups use both. Get the
thresholds or the meaning of "healthy" wrong, and the checks can cause
an outage instead of preventing one.

## Active checks: ask on a timer

The balancer sends a small probe to every backend every few seconds
and counts the answers. The probe can be:

- **A [[tcp|TCP]] connect.** Passes if the port accepts a connection. It proves
  a process is listening, not that it works.
- **An HTTP request** to a path like `/healthz`. Envoy expects a 200 by
  default; Kubernetes counts any status from 200 to 399 as a pass.
- **A protocol-specific call**, such as a [[grpc|gRPC]] health request or a
  Redis `PING`.

One failed probe doesn't take a backend out, and one success doesn't
bring it back. Thresholds smooth out blips. Kubernetes probes every 10
seconds by default, gives each probe 1 second, and acts after 3
failures in a row.

![State diagram. A backend in the healthy state moves to unhealthy after a set number of failed probes in a row (3 by default in Kubernetes). An unhealthy backend moves back to healthy after a set number of passed probes. Separately, passive checking ejects a backend after consecutive errors in real traffic; it returns after an ejection time that grows by one base time with each repeated ejection.](img/health-checks-states.svg)

*Active checks move a backend in and out with thresholds; passive checks eject it for a growing time.*

A backend can also fail its check on purpose. Returning a non-200 from
the health endpoint is a common way to drain a backend before a
deploy: the balancer stops sending it new requests.

## Passive checks: watch real traffic

Active checks only test the health endpoint, every few seconds. Real
traffic tests everything, all the time. In Envoy, passive checking is
called outlier detection. It watches every response and connection
attempt, and ejects a backend when it stands out:

- a number of 5xx responses in a row,
- a number of gateway errors (502, 503, 504) or local failures
  (timeouts, resets, refused connections) in a row,
- a success rate far below the rest of the pool, or below a fixed
  percentage.

An ejected backend comes back on its own after an ejection time. Each
time it's ejected again in a row, the time grows (base time multiplied
by the number of ejections, up to a cap), so a backend that keeps
failing spends longer and longer out.

A proxy that only forwards TCP can't see HTTP status codes at all; it
only knows whether connections worked. That's one of the practical
differences in [[l4-vs-l7]].

## Using both

The two cover each other's gaps. Passive checks react to real failures
as they happen, but they need traffic to notice anything. Active checks
cover idle backends too, but add load of their own: in a large mesh,
every proxy probing every backend adds up. Envoy's answer is to cache
health check answers in front of each backend, and with passive checks
on, it's common to run active checks on a long interval.

The combination has a trap. In Envoy, a passing active check brings an
ejected backend straight back. If the health endpoint passes while
real requests fail, the backend flaps in and out.

## Readiness is not liveness

Kubernetes splits the question in two, and mixing them up causes real
outages:

- **Readiness**: should this Pod get traffic? A failed readiness probe
  removes the Pod's address from the Service's endpoints, and the
  container keeps running. This is the load balancer's health check.
- **Liveness**: is this container stuck for good? A failed liveness
  probe restarts the container.

A liveness probe that fails under load is dangerous. The busiest
containers get restarted, the rest take their traffic, get slower, fail
their probes and restart too. The probe meant to catch a stuck
container ends up restarting healthy but busy ones.

## Where it gets tricky

**What should "healthy" check?** A readiness check that also tests the
backend's own dependencies keeps traffic away from a Pod that could
only return errors. But if a shared dependency goes down, every
backend fails its check at once and the pool is empty. Guard against
that with a cap: Envoy won't eject more than `max_ejection_percent` of
a pool. [[load-balancing]] covers the panic threshold, the same idea
for the whole pool.

**A pass doesn't prove it's the right backend.** In a pool where
addresses get reused, an address can vanish and come back as a
different service, which may happily answer `/healthz`. Envoy can check
a header naming the service to catch this.

## What this means when you build

- Use both: long-interval active checks plus passive ejection.
- Keep liveness probes cheap and local, with a high failure threshold.
  Put dependency checks, if any, in readiness.
- Cap how much of the pool health checks can remove.
- Fail your health endpoint on purpose to drain before shutdown.

## Further reading

- [Health checking](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/health_checking), Envoy docs (1.40.0-dev). Active check types, thresholds, draining, and the cost of checks at scale.
- [Outlier detection](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/outlier), Envoy docs (1.40.0-dev). Passive checks from real traffic and the ejection algorithm.
- [Liveness, Readiness, and Startup Probes](https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/), Kubernetes docs (1.37). Readiness vs liveness, probe types and defaults.
