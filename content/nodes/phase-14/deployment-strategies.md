---
id: deployment-strategies
title: Deployment strategies
depth: deep
phase: 14
note: >-
  Rolling, blue-green and canary deploys, and rolling back.
needs: [load-balancing, health-checks, graceful-shutdown, ci-cd]
leads_to: [canary-analysis]
compare_with: [zero-downtime-migrations, feature-flags, schema-evolution]
---

# Deployment strategies

A deployment strategy is the order in which you swap old copies of a
service for new ones: all at once, a few at a time, a whole second
environment, or a small test slice first. The choice decides how many
users a bad version can hurt before you notice, how fast you can undo
it, and how much spare capacity the deploy needs. It also decides how
long two versions of your code run side by side, which is where most
deploy bugs hide.

## The starting point

Take the order service: four copies behind a [[load-balancing|load
balancer]], version 1 everywhere, and version 2 built and tested by
the [[ci-cd]] pipeline. Every strategy below gets you from four copies
of v1 to four copies of v2. They differ in what happens in between.

![Four rows of four copies each, shown at four moments from left to right. Recreate: all old, then nothing running, then all new. Rolling: one copy switches to the new version, then three, then all four, so old and new serve together. Blue-green: the blue set serves the old version while a green set of new copies starts with no traffic; the router switches all traffic to green, and blue stays running, idle, for rollback. Canary: one new copy is compared with the old ones, the pipeline waits and watches, then all copies move to the new version.](img/deployment-strategies-compared.svg)

*Four ways to replace a fleet. Adapted from the Kubernetes Deployments docs, Martin Fowler's "BlueGreenDeployment" and Danilo Sato's "CanaryRelease".*

## Recreate: stop everything, start again

Kill all four v1 copies, then start four v2 copies. Simple, and
there's never a moment when both versions run. But nothing serves
traffic in between, so it's only for things that can take downtime,
or that truly can't run two versions at once. Kubernetes calls this
strategy `Recreate`.

## Rolling: a few at a time

A rolling update replaces copies in batches. Start one v2 copy, wait
until it's ready, take one v1 copy out, and repeat. Old and new serve
side by side for the length of the deploy.

Two numbers control it. In Kubernetes they're `maxSurge` (how many
extra copies may exist above the target) and `maxUnavailable` (how
many may be missing), both 25% by default. With four replicas that
means the total stays between three and five: at least three
available at any moment, at most five running. Amazon's pipelines use
the same idea with different numbers: at most a third of a region's
copies are replaced at once, so at least two thirds keep serving.
Since every service there is sized to survive losing an Availability
Zone, two thirds is enough.

A rolling update leans on three other pieces:

- **Readiness.** A new copy only gets traffic after its readiness
  [[health-checks|health check]] passes. Kubernetes can also require
  it to stay ready for `minReadySeconds` before counting it as
  available.
- **Draining the old copy.** The balancer has to stop sending to a v1
  copy before it exits, and the copy has to finish what it's doing:
  [[graceful-shutdown]].
- **Capacity.** Surge copies need room; unavailable copies mean the
  remaining ones carry more load.

If new copies never become ready, say because the image won't pull,
the rollout stalls instead of killing more old copies, because it
never gets past `maxUnavailable`. Kubernetes marks a rollout that
hasn't progressed in 600 seconds (the default deadline) as failed,
and then does nothing else. Rolling back is a separate step:
`kubectl rollout undo`, which runs another rolling update back to the
previous pod template.

## Blue-green: two full environments

Keep two production environments, as identical as you can make them.
Blue is live with v1. Deploy v2 to green, test it there, then switch
the router so all traffic goes to green. If something's wrong, switch
back. Blue sits idle as the rollback, then becomes the place you
stage the next release.

The appeal is the instant, all-at-once cut-over and the equally fast
rollback. There are no mixed versions serving users. The costs: you
pay for a second full environment, and anything written while green
was live (orders, sessions) has to survive the switch back to blue.
And if both environments share one database, the schema has to work
for both versions at once, which brings back the compatibility problem
rolling updates have. The usual answer is to ship the schema change
first, in a form both versions can use.

## Canary: a small slice first

Send v2 to a small part of production first, compare it with the rest,
and only continue if it looks as healthy. The name comes from the
canaries miners carried: the bird got sick before the people did.

The slice can be one copy out of many, a percentage of requests, a
group of users (employees first, then a random sample), or one region.
Amazon's pipelines start every production wave with a one-box stage: a
single VM or container that serves at most a tenth of a region's
requests. Then comes a rolling deploy to the rest of that region, then
the next region.

The value is in the arithmetic. If v2 fails 20% of requests and you
send it 5% of traffic, users see 1% errors instead of 20%, and you
spend a twentieth of the [[error-budgets|error budget]] a full deploy
would have. How you decide the canary is "worse", automatically and
with statistics, is [[canary-analysis]].

Canaries also go further than one step. Amazon deploys in waves of
growing size, starting with a low-traffic region, one Availability
Zone or [[cell-based-architecture|cell]] at a time, so a bad change
can't hit two zones or two regions at once. Between waves the pipeline
waits and watches, called bake time: at least an hour after a one-box
stage, 12 hours after the first regional wave, and two to four hours
after later ones. Some damage burns slowly and isn't visible right
after the deploy. With those waits, a change takes about four or five
business days to reach every region.

## Rolling back is a deploy too

Every strategy except recreate has old and new versions running at
once, and every rollback runs them together again in the other
direction. That's where rollbacks fail.

The most common reason a rollback can't be done is a protocol change.
Suppose v2 writes order records in JSON where v1 wrote XML. While the
rollout is in progress, v1 copies read records v2 just wrote and
choke. Roll back, and v1 still can't read the JSON already written.
Even a harmless-looking number can do it: raise the heartbeat interval
between servers from 5 to 10 seconds, and v1 copies, still expecting
one every 5, decide their v2 peers are dead and drop the connections.

The fix is to split the change into two deploys, each one safe to
undo on its own:

1. **Prepare.** Every copy learns to read both XML and JSON, but still
   writes XML. Check that every single server has it.
2. **Activate.** Copies start writing JSON. Rolling back is fine now,
   because the previous version can read JSON too.

Wait days between the two, because once both are out, you can't roll
back past the first. When rolling forward, readers go before writers;
when rolling back, writers go before readers. This is the same shape
as expand/contract for [[zero-downtime-migrations]], and the same
rules as [[schema-evolution]] for messages.

## Where it gets tricky

**Blue-green hides a before/after comparison.** Everything switches
at once, so the only way to judge v2 is to compare metrics after the
switch with metrics before it. Time of day, a weekday versus a
weekend, and other changes all move metrics too, so a slow regression
can hide in the noise. Running blue and green together with a traffic
split turns it back into a canary.

**Kubernetes doesn't roll back for you.** A stalled Deployment only
gets a status condition. Something above it (a pipeline, a rollout
controller, a human) has to watch for that, and for anything subtler,
like higher latency from pods that are "ready" but slow.

**A test environment with one copy of each service can't catch
mixed-version bugs.** Every deploy there is effectively atomic. Amazon
hit this once, and now runs several servers from different zones
behind each service in test, as in production.

**Small canaries miss load problems, and quiet hours miss everything.**
Performance bugs often show up only under heavy load, so a canary on a
few servers at night can pass a change that falls over at peak. That's
why canaries grow in stages and bake for hours.

**Deploy and release aren't the same thing.** A deploy strategy
decides which servers run v2. [[feature-flags|Feature flags]] decide
which users take the new code path inside servers that already run it.
You usually want both: deploy the code switched off with a rolling or
canary deploy, then turn it on gradually with a flag.

## What this means when you build

- Use rolling updates by default, with readiness checks and graceful
  shutdown in place, and enough spare capacity for the surge.
- Put a canary step in front of any change that reaches a lot of
  users, and grow it in stages across zones or cells.
- Wire rollback to alarms, so it doesn't wait for a person.
- Make every change safe to run next to the previous version, both
  directions. Split format and protocol changes into prepare and
  activate.
- Deploy to test the same way you deploy to production, with more than
  one copy of each service.

## Further reading

- [Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/), Kubernetes docs (v1.35). Rolling updates, maxSurge and maxUnavailable, revisions, rollback and progress deadlines.
- [BlueGreenDeployment](https://martinfowler.com/bliki/BlueGreenDeployment.html), Martin Fowler, 2010. The original short description of blue-green, including the database caveat.
- [CanaryRelease](https://martinfowler.com/bliki/CanaryRelease.html), Danilo Sato, 2014. What a canary release is, ways to pick the first users, and why it isn't A/B testing.
- [Automating safe, hands-off deployments](https://builder.aws.com/content/3ErTKQOTKc5NIw031UePBPxTQ6I/automating-safe-hands-off-deployments), Clare Liguori, Amazon Builders' Library. One-box, rolling, waves, bake time and alarm-driven rollback at Amazon's scale.
- [Ensuring rollback safety during deployments](https://builder.aws.com/content/3F04j2yRAAMBuPSPs50xwXZqg01/ensuring-rollback-safety-during-deployments), Sandeep Pokkunuri, Amazon Builders' Library. Why rollbacks fail with mixed versions, and the two-phase deploy.
- [Canarying Releases](https://sre.google/workbook/canarying-releases/), Alec Warner and Štěpán Davidovič, *The Site Reliability Workbook*, Google, 2018. Canary vs control, the error budget arithmetic, and why blue-green is a before/after canary.
