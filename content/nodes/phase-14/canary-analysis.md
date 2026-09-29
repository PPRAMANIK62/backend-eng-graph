---
id: canary-analysis
title: Canary analysis
depth: short
phase: 14
note: >-
  Comparing a canary's metrics with the old version's, and rolling back
  on its own when it's worse. The phase 14 build's rollback.
needs: [deployment-strategies, alerting, sli-slo-sla]
leads_to: []
compare_with: [error-budgets]
---

# Canary analysis

Canary analysis is the step of a [[deployment-strategies|canary
deploy]] where something decides whether the new version is worse than
the old one, and rolls it back if it is. Done by a person staring at
graphs, it's slow and inconsistent. Done by a machine, it has to
answer a statistics question: is this difference real, or just noise?

## Compare like with like

Say the order service runs on 40 copies and v2 goes to a canary. You
want to know whether v2 is worse than v1. The obvious comparison is
the canary against the other 39 copies, but those have been running
for days: warm caches, a settled heap, long-lived connections. A copy
that started five minutes ago looks worse even on the old code.

So the careful setup starts two fresh groups at the same moment, the
same size, getting the same kind of traffic:

![Three groups of servers behind a load balancer. Production: many copies running v1, taking most of the traffic, not part of the comparison. Baseline: a few fresh copies running v1, started at the same time as the canary. Canary: the same number of fresh copies running v2. Baseline and canary each get the same small share of traffic. Their metrics, tagged by group, feed a judge that compares them metric by metric and gives pass, marginal or fail; fail triggers rollback.](img/canary-analysis-baseline.svg)

*Canary compared with a fresh baseline, not with the warm production fleet. Adapted from the Spinnaker canary docs.*

- **Baseline**: new copies of v1, the version already in production.
- **Canary**: the same number of new copies of v2.

Now the two groups differ only in version; warm-up, time of day and
traffic mix hit both equally. This also rules out
the tempting shortcut of comparing the whole service after the deploy
with the whole service before it. Metrics move with time anyway (a
Monday isn't a Saturday), so a before/after comparison mixes up your
change with everything else that changed.

## Choosing what to compare

Start from the service's SLIs (see [[sli-slo-sla]]): error rate and
latency first, because users feel those. Then maybe saturation. Keep
it to a handful, no more than about a dozen. Each extra metric is
another chance for a false alarm.

- **Split every metric by group.** A canary with 5% of traffic failing
  20% of its requests moves the service-wide error rate by only 1%.
  If your dashboards can't break metrics down by canary and baseline,
  you won't see it.
- **Leave out client errors.** A 404 spike can be a broken link on a
  forum. Exclude 4xx; probe the URLs that must exist instead.
- **Avoid machine-wide numbers.** CPU usage can rise without hurting
  anyone. Noisy metrics cause false alarms, and false
  alarms get the whole canary process ignored.
- **Match the window to the canary.** An "errors per hour" metric
  can't judge a 30-minute canary.

## Deciding "worse"

Each metric gives two sets of numbers, baseline and canary. The
question is whether they really differ. Spinnaker's default judge,
which works with the Kayenta canary service, answers it with a
Mann-Whitney U test. The test doesn't assume the numbers follow a bell
curve, and it flags a metric as higher
or lower only when it's 98% confident the difference is real and the
difference is bigger than a threshold you set.

The per-metric results roll up into a score from 0 to 100. Spinnaker's
suggested starting points: a run scoring below 75 fails the canary at
once, and the final run needs 95 or more to pass. Mark a metric critical, and failing
it fails the whole canary no matter what the others say, so an error
spike can't hide behind twenty healthy metrics.

Statistics needs data. The judge wants at least 50 data points per
metric, which in practice means a canary runs for hours: three hours,
checked every hour, is Spinnaker's suggested starting point.

## Rolling back without a person

The output of the analysis is a decision: continue, stop and roll
back, or ask a human. In an automated pipeline the rollback is wired
straight to it. Facebook's config canary compared the error logs of 20
servers on a new config with the rest of production, saw error logs
growing fast, and aborted the rollout before an outage.

A comparison only catches the canary being worse than the baseline.
If both get worse together, say through a shared database, it sees
nothing. So also watch the SLO itself: a burn-rate [[alerting|alert]]
can stop a rollout too.

## Where it gets tricky

**False positives train people to override.** At Facebook, a canary
rejected a config change for crashing servers. The engineer decided it
was a false positive, overrode it, and caused more crashes. The change
was correct; it exposed a race condition in the code.

**Isolation is never perfect.** Canary and baseline share databases,
caches and clients. A bad canary can hurt the baseline, and one user's
request can land on the canary and change what the next request does
on the baseline. A failed canary means "stop and look", not proof that
v2 is at fault.

**Small canaries miss load problems.** A handful of servers can't
create enough load to reveal a change that overloads a shared backend.
Facebook added a cluster-sized stage after one such miss.

**Configs rot.** Thresholds and metrics need tuning per service, and
again as it changes. Retrospective runs over past data make tuning
faster.

## What this means when you build

- Compare against a fresh baseline of the old version, started at the
  same time, not against the warm fleet or against "before".
- Tag every metric with the version or group that produced it.
- Start with error rate and latency; mark error rate critical.
- Plan for canaries that last hours, and stage them from small to
  large.
- Keep an absolute SLO alert as a second tripwire for rollback.

## Further reading

- [Canarying Releases](https://sre.google/workbook/canarying-releases/), Alec Warner and Štěpán Davidovič, *The Site Reliability Workbook*, Google, 2018. Choosing canary metrics, why before/after is risky, and isolation problems.
- [How canary judgment works](https://spinnaker.io/docs/guides/user/canary/judge/), Spinnaker docs. The default judge step by step, including the Mann-Whitney U test.
- [Best practices for configuring canary](https://spinnaker.io/docs/guides/user/canary/best-practices/), Spinnaker docs. Baseline vs production, run length, thresholds and metric groups.
- [Holistic Configuration Management at Facebook](https://sigops.org/s/conferences/sosp/2015/current/2015-Monterey/printable/008-tang.pdf), Chunqiang Tang et al., SOSP 2015. Real incidents a canary caught, missed, or was overridden on.
