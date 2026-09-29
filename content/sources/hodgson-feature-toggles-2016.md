---
id: hodgson-feature-toggles-2016
title: Feature Toggles (aka Feature Flags)
author: Pete Hodgson (on martinfowler.com)
url: https://martinfowler.com/articles/feature-toggles.html
kind: blog
primary: false
---

## Summary

The standard long article on feature flags (2016, revised 2017). The
parts of a flag system (toggle point, router, configuration), four
categories by how long a flag lives and how dynamic it is, how to store
flag config, how to test flagged code, and the carrying cost of flags.

## Key claims

- Feature flags change behaviour without changing code. "allowing teams to modify system behavior without changing code" (summary)
- The core idea: ship two code paths in one deployable and choose at runtime. "being able to ship alternative codepaths within one deployable unit and choose between them at runtime." (Categories of toggles)
- Two axes: how long it lives, how dynamic the decision is. "Feature toggles can be categorized across two major dimensions: how long the feature toggle will live and how dynamic the toggling decision must be." (Categories of toggles)
- Release toggles ship unfinished code switched off. "Release Toggles allow incomplete and un-tested codepaths to be shipped to production as latent code which may never be turned on." (Release Toggles)
- Separate release from deployment. "the Continuous Delivery principle of “separating [feature] release from [code] deployment.”" (Release Toggles)
- Release toggles should be short-lived. "They should generally not stick around much longer than a week or two" (Release Toggles)
- Experiment toggles put each user in a stable cohort. "Each user of the system is placed into a cohort and at runtime the Toggle Router will consistently send a given user down one codepath or the other" (Experiment Toggles)
- Ops toggles as kill switches, a manual circuit breaker. "These types of long-lived Ops Toggles could be seen as a manually-managed Circuit Breaker." (Ops Toggles)
- Ops toggles must flip fast, without a release. "needing to roll out a new release in order to flip an Ops Toggle is unlikely to make an Operations person happy." (Ops Toggles)
- A canary cohort from a modulo of user ID. "A cohort of canary users is created via a random sampling of 1% of the user base - perhaps using a modulo of user ID." (Canary releasing)
- Keep the decision logic out of the toggle point. "One common mistake with Feature Toggles is to couple the place where a toggling decision is made (the Toggle Point) with the logic behind the decision (the Toggle Router)." (De-coupling decision points)
- Prefer static flag config in source control when possible. "Managing toggle configuration via source control and re-deployments is preferable, if the nature of the feature flag allows it." (Prefer static configuration)
- Distributed stores push changes to every node. "Configuration can be modified dynamically whenever required, and all nodes in the cluster are automatically informed of the change" (Distributed Toggle Configuration)
- Expose the current flag state. "Any system using feature flags should expose some way for an operator to discover the current state of the toggle configuration." (Expose current feature toggle configuration)
- Flags multiply test combinations. "With multiple toggles in play we have a combinatoric explosion of possible toggle states." (Feature Toggles introduce validation complexity)
- Test what will be live plus the fallback. "It's most important to test the toggle configuration which you expect to become live in production" (validation complexity)
- Off means old behaviour, on means new. "a good convention is to enable existing or legacy behavior when a Feature Flag is Off and new or future behavior when it's On." (validation complexity)
- Flags are inventory with a carrying cost. "Savvy teams view their Feature Toggles as inventory which comes with a carrying cost, and work to keep that inventory as low as possible." (Managing the carrying cost)
- Some teams add time bombs that fail tests after an expiry. "Some go as far as creating “time bombs” which will fail a test (or even refuse to start an application!) if a feature flag is still around after its expiration date." (Managing the carrying cost)
- Knight Capital as a warning. "Knight Capital Group's $460 million dollar mistake serves as a cautionary tale on what can go wrong when you don't manage your feature flags correctly (amongst other things)." (Managing the carrying cost)
- Distributed stores named. "services like Zookeeper, etcd, or Consul." (Distributed Toggle Configuration)
- Permissioning toggles can live for years; examples are paying, internal and beta users. "a Permissioning Toggle may be very-long lived compared to other categories of Feature Toggles - at the scale of multiple years." (Permissioning Toggles)
- Experiment toggles last until results are significant. "An Experiment Toggle needs to remain in place with the same configuration long enough to generate statistically significant results." (Experiment Toggles)
- Removal tasks and expiry dates. "Some teams have a rule of always adding a toggle removal task onto the team's backlog whenever a Release Toggle is first introduced. Other teams put "expiration dates" on their toggles." (Managing the carrying cost)

## Visuals worth redrawing

- The chart placing toggle categories on longevity vs dynamism axes.
  Redraw as a 2x2.

## My notes

- The SEC order on Knight Capital couldn't be opened, so nothing beyond
  Hodgson's one sentence is used about it.
