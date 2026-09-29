---
id: mohan-gumbley-threat-modeling-2025
title: Threat Modeling Guide for Software Teams
author: Gayathri Mohan and Jim Gumbley
url: https://martinfowler.com/articles/agile-threat-modelling.html
kind: blog
primary: false
---

## Summary

A practical guide from two Thoughtworks practitioners on martinfowler.com
(2025): start from data flows, ask "what can go wrong?" at each one with
STRIDE as prompts, and do it in short, frequent team sessions rather than
one big workshop. Includes a worked example on an order management
feature.

## Key claims

- Start from where data enters and moves. "Start with following where the data enters your boundary." (Start from your Dataflows)
- Data flows turn vague worries into specific questions. "For example, “What happens if this API response is tampered with?” or “What if this model input is poisoned?”." (Start from your Dataflows)
- The core move. "follow each one of the data flows and ask “What can go wrong?”." (The Crux to Identifying Threats)
- STRIDE as prompts per data flow, e.g. for denial of service. "Denial of service: What if we smash it?" (STRIDE as a Practical Aid)
- Little and often beats a big-bang workshop. "This big-bang approach often overwhelms teams and rarely sticks as a consistent practice." (Work 'Little and Often')
- Short sessions on the feature in hand. "these informal 15-30 minute sessions focus on examining immediate security implications of features your team is currently developing." (Quick Team Threat Modeling)
- Assets are what would cause financial, reputational or legal loss. "the entities that lead to financial loss, reputation loss, or that results in legal disputes are highlighted as 'assets'" (Explain and Explore)
- In the worked example the UI is the least trusted part. "They also noted the UI component as the least trusted since it's exposed to external access during these discussions." (Explain and Explore)
- Threats should be specific. "Capture threats, one per sticky, with the mandate that the threat is specific such as “SQL injection from Internet” or “No encryption of customer data”." (Identify Threats)
- Attackers use the same paths as users. "Remember, attackers will use the same data flows as legitimate users, but in unexpected ways." (Identify Threats)
- Security specialists help but shouldn't block the session. "security specialists, who can provide valuable input but don't have to be blocked by their unavailability." (Approach and Preparation)
- No expertise needed to start. "Fresh eyes often spot risks that experts might miss" (It's a Team Sport!)
- Who attends. "It's great to get attendance from product owners, who know the business context" (Approach and Preparation)

## Visuals worth redrawing

- The whiteboard diagram of the order management system (UI, auth
  service, order service, databases, with assets and threats as stickies
  on data flows). Shown as an image carousel; the text describes it.

## My notes

- Only the first half of the page came through as text; the
  "Prioritize and fix" and platform workshop sections weren't read.
