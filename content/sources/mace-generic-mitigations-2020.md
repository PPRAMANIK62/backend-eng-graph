---
id: mace-generic-mitigations-2020
title: Generic mitigations
author: Jennifer Mace (Google SRE), published by O'Reilly
url: https://www.oreilly.com/content/generic-mitigations/
kind: blog
primary: true
---

## Summary

A short, cartoon-illustrated essay by a Google SRE (2020) arguing that
every service needs a few ready-made "panic buttons": mitigations that
reduce user pain without understanding the outage first. Lists the
common patterns and warns that unpractised ones don't work.

## Key claims

- A mitigation is anything that reduces impact. "a mitigation is any action you might take to reduce the impact of a breakage, generally in production." (Hold up, hang on)
- Generic means useful for many outages. "A generic mitigation, then, is one that is useful in mitigating a wide variety of outages." (Hold up, hang on)
- Rollback is the most common. "a binary rollback is probably the most common generic mitigation" (Hold up, hang on)
- The key property. "You don’t need to fully understand your outage to use it." (Hold up, hang on)
- Understand the outage after mitigating it. "you want to understand your outage after it is mitigated" (I mean, don't we want to understand our outages?)
- Measure time to mitigate, not time to fix. "It is far easier to build mitigations with broad application than it is to make root-causing faster." (same section)
- Patterns: rollback, data rollback, degrade, upsize, block list, drain, quarantine. "Isolate a given unit of your usage—a hot DB row, a spammy user, a poisoned traffic stream—so whatever bug it is hitting stops breaking others." (patterns list, Quarantine)
- Building a degraded mode during the fire fails. "Attempts to create a new degradation mechanism while your system burns will always bite you." (patterns list, Degrade)
- Many teams find out during an outage that rollback isn't safe. "Far too many think they have safe rollbacks, only to learn otherwise during an outage." (patterns list, Rollback)
- You still need enough diagnosis to pick the right one. "None of these are magic: you need to diagnose to the level of understanding the kind of failure scenario you’re dealing with." (Those aren't really all that generic)
- Unused mitigations don't work. "If you don’t use them, they won’t work." (same section)
- The visible stretch is the expensive one. "The most expensive stretch of an outage is the time when users can see it." (Alright, boil it down for me)

- Draining one instance for a bad release just moves the errors to the next instance that upgrades. "Yeah, you’d look pretty silly if you drained an instance because a recent release triggered errors, only to see the same errors 30 minutes later when the next instance upgrades." (Those aren't really all that generic)

## Visuals worth redrawing

- The two-timeline figure: problem created, damage starts, on-call
  paged, then either "apply a generic mitigation" (user impact stops,
  then investigate, final fix, apply fix) or investigate first (impact
  continues until the perfect fix is applied). (early in the post)

## My notes

- Pairs with the GKE case study in google-sre-workbook-incident-response.
