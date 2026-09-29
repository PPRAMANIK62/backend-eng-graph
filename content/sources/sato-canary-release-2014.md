---
id: sato-canary-release-2014
title: CanaryRelease
author: Danilo Sato (on martinfowler.com)
url: https://martinfowler.com/bliki/CanaryRelease.html
kind: blog
primary: false
---

## Summary

Bliki entry (2014) on canary releases: roll the new version to a small
subset of users first, grow it, roll back by rerouting. Also how it
differs from A/B testing and where it's hard.

## Key claims

- Definition. "Canary release is a technique to reduce the risk of introducing a new software version in production by slowly rolling out the change to a small subset of users before rolling it out to the entire infrastructure and making it available to everybody." (first paragraph)
- Ways to pick the first users. "a simple strategy is to use a random sample; some companies choose to release the new version to their internal users and employees before releasing to the world" (choosing users)
- Rollback is rerouting. "the rollback strategy is simply to reroute users back to the old version until you have fixed the problem." (rollback)
- Also known as phased or incremental rollout. "Sometimes it is referred to as a phased rollout or an incremental rollout." (naming)
- Partition by region or brand at scale. "if you have geographically distributed users, you can rollout the new version to a region or a specific location first" (large scenarios)
- Don't mix canaries with A/B tests: days vs minutes. "it can take days to gather enough data to demonstrate statistical significance from an A/B test, while you would want a canary rollout to complete in minutes or hours." (A/B testing)
- Drawback: several versions at once. "One drawback of using canary releases is that you have to manage multiple versions of your software at once." (drawbacks)
- Automatic rollback on business metrics was IMVU's "cluster immune system". "The technique of monitoring business metrics and automatically rolling back a release on a statistically significant regression is known as a cluster immune system and was pioneered by IMVU." (note 2)
- Where the name comes from. "The name for this technique originates from miners who would carry a canary in a cage down the coal mines." (note 1)

## Visuals worth redrawing

- Router sending a few users to the new version, then more.

## My notes

- The IMVU post isn't opened.
