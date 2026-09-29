---
id: shopify-modular-monolith-2019
title: "Deconstructing the Monolith: Designing Software that Maximizes Developer Productivity"
author: Kirsten Westeinde, Shopify
url: https://shopify.engineering/deconstructing-monolith-designing-software-maximizes-developer-productivity
kind: blog
primary: true
---

## Summary

Shopify's post (2019) on why it turned its large Rails monolith into a
modular monolith instead of microservices: one codebase and one
deployment, with enforced boundaries between business domains, checked
by a tool (Wedge) that flags calls across component boundaries.

## Key claims

- Scale of the codebase: worked on for over a decade by more than a thousand developers. "It has been worked on for over a decade by more than a thousand developers." (intro)
- The choice. "We chose to evolve Shopify into a modular monolith, meaning that we would keep all of the code in one codebase, but ensure that boundaries were defined and respected between different components." (intro)
- Monolith advantages: one repo, one pipeline, one database, direct calls. "Since all of the code is deployed in one application, the data can all live in a single shared database." (Advantages of Monolithic Systems)
- Direct calls avoid API versioning and network latency. "This means you don’t have to worry about API version management and backward compatibility, as well as potentially laggy calls." (Advantages of Monolithic Systems)
- The pain: coupling, fragile changes, slow tests, steep onboarding. "Making a seemingly innocuous change could trigger a cascade of unrelated test failures." (Disadvantages of Monolithic Systems)
- The cause was missing boundaries. "All of the issues we experienced were a direct result of a lack of boundaries between distinct functionality in our code." (Disadvantages of Monolithic Systems)
- Why not microservices: pipelines per service, network hops, harder cross-service refactors. "Since each service is deployed independently, communicating between services means crossing the network, which adds latency and decreases reliability with every call." (Microservice Architecture)
- Definition. "A modular monolith is a system where all of the code powers a single application and there are strictly enforced boundaries between different domains." (Modular Monoliths)
- Code reorganised by real-world concepts (orders, shipping, inventory, billing) instead of models, views, controllers; about 6000 classes labelled by hand. (Code Organization)
- Each component got a public API and exclusive ownership of its data. "Each component defined a clean dedicated interface with domain boundaries expressed through a public API and took exclusive ownership of its associated data." (Isolating Dependencies)
- Wedge flags boundary violations from a call graph collected in CI. "Cross-component associations are always violating componentization" (Enforcing Boundaries)
- The payoff example: the tax engine could be swapped out. "we were able to swap out our tax engine for a completely new tax calculation system." (Enforcing Boundaries)
- Re-architect as late as you can. "The best time to refactor and re-architect is as late as possible, as you are constantly learning more about your system and business domain as you build." (conclusion)

## Visuals worth redrawing

- Simon Brown's monolith / modular monolith / microservices picture
  (credited in the post to Brown).

## My notes

- "Outgrew" happened in 2016 by the post's account; the componentization
  team started in 2017.
