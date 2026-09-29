---
id: feature-flags
title: Feature flags
depth: short
phase: 14
note: >-
  Shipping code switched off, and turning it on separately.
needs: [ci-cd]
leads_to: []
compare_with: [deployment-strategies, configuration]
---

# Feature flags

A feature flag is an `if` in your code whose answer comes from
configuration instead of the code itself. It lets you deploy new code
switched off, then turn it on later, for some users or all of them,
and turn it off again in seconds without a deploy. Deploying code and
releasing a feature become two separate steps.

## One `if`, three parts

Say you've rewritten the price calculation in the checkout service.
Instead of replacing the old function, you ship both:

```go
if flags.Enabled("new-pricing", user) {
    return newPrice(cart)
}
return oldPrice(cart)
```

That line has three parts worth naming:

- **The toggle point**: the `if` in the code.
- **The toggle router**: `flags.Enabled`, which decides. It might just
  read on/off from a file, or it might decide per request, using the
  user.
- **The toggle configuration**: where the answer lives. A file in the
  repository, a table in your database, or a store like etcd or
  ZooKeeper that pushes changes to every server.

A common convention is off means old behaviour, on means new. Then
"everything off" is always the safe fallback.

## Four kinds of flag

Flags look the same in code but live very different lives. Two
questions sort them: how long will the flag exist, and does the answer
change per request?

- **Release flags** hide unfinished work, so it can sit on the main
  branch and ship in releases while switched off. This is what makes
  daily merging in [[ci-cd]] possible. They should be gone within a
  week or two.
- **Experiment flags** put each user in a stable group (say, by user
  id) and send each group down a different path for an A/B test. They
  last as long as the experiment needs to reach a clear result.
- **Ops flags** let operators turn off an expensive feature fast, for
  example the recommendations panel during a traffic spike. A few
  become permanent kill switches, a manual kind of
  [[circuit-breakers|circuit breaker]] that feeds
  [[graceful-degradation]]. They must flip in seconds; needing a
  release to flip one defeats the point.
- **Permission flags** turn features on for certain users: employees,
  beta testers, paying customers. These can live for years.

Rolling a feature out to 1% of users, then 10%, then everyone, is a
canary done with a flag instead of with servers. Facebook's Gatekeeper
worked this way: new code shipped disabled, then was turned on for
employees, or for 1% of the users of one phone model, and could be
turned off quickly if something went wrong.

## Flags vs deploys

A flag and a [[deployment-strategies|canary or rolling deploy]] both
limit how many users see a change. They limit different things. A
deploy strategy controls which servers run new code, and rolling back
means redeploying. A flag controls which users take the new path
inside code that's already everywhere, and rolling back means flipping
a value. Flags are finer (per user, per feature) and faster to undo.
Deploys catch what flags can't: a crash at startup, a memory leak, a
bad library upgrade, anything outside the `if`.

## Where it gets tricky

**A flag change is a production change.** Flipping a flag for
everyone at once is a global deploy with no canary. Amazon runs flag
changes through a pipeline with the same staged rollout and automatic
rollback as code, because a bad flag change hurts production just as
much. See [[configuration]].

**Every flag doubles what you could be running.** One flag means two
paths to test; ten flags mean more combinations than anyone will test.
In practice you test what production will run, plus the flags you're
about to turn on, both on and off.

**Flags pile up.** Each flag is an old code path someone has to keep
working. Teams set expiry dates, add a removal task when the flag is
created, or write tests that fail once a flag is past its date. The
Knight Capital trading loss, $460 million, is the usual cautionary
tale about flags managed badly.

**Flag checks cost something.** At Facebook's scale, Gatekeeper ran
billions of checks per second and used a significant share of the
frontend fleet's CPU. They decided it was worth it.

**Keep decisions out of the call sites.** If fifty places in the code
check `"new-pricing"` directly, changing who gets the feature means
changing fifty places. Put the decision in one function and call that.

## What this means when you build

- Use release flags to merge unfinished work daily; delete them when
  the feature is out.
- Roll a flag out in steps and watch your metrics, as you would a
  deploy.
- Give each flag an owner and an expiry date.
- Expose the current flag state on an endpoint, so you can see what a
  server is actually doing.
- Keep a few kill switches for expensive, non-essential features.

## Further reading

- [Feature Toggles (aka Feature Flags)](https://martinfowler.com/articles/feature-toggles.html), Pete Hodgson, 2016 (revised 2017). The categories, the toggle point/router/config split, testing, and carrying cost.
- [Holistic Configuration Management at Facebook](https://sigops.org/s/conferences/sosp/2015/current/2015-Monterey/printable/008-tang.pdf), Chunqiang Tang et al., SOSP 2015. Gatekeeper: how flags worked for a very large site, and what they cost.
- [Automating safe, hands-off deployments](https://builder.aws.com/content/3ErTKQOTKc5NIw031UePBPxTQ6I/automating-safe-hands-off-deployments), Clare Liguori, Amazon Builders' Library. Why flag changes get their own safe pipeline.
