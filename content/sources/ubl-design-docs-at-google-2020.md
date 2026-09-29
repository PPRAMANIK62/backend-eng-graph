---
id: ubl-design-docs-at-google-2020
title: Design Docs at Google
author: Malte Ubl
url: https://www.industrialempathy.com/posts/design-docs-at-google/
kind: blog
primary: true
---

## Summary

A Google engineer's description (2020) of how design docs work there:
what goes in one (context, goals and non-goals, the design, APIs, data
storage, alternatives, cross-cutting concerns), how long they are, when
not to write one, and how they're reviewed and kept up.

## Key claims

- A design doc records the strategy and the trade-offs behind it. "The design doc documents the high level implementation strategy and key design decisions with emphasis on the trade-offs that were considered during those decisions." (intro)
- Its value is catching design problems while change is cheap. "Early identification of design issues when making changes is still cheap." (intro list)
- Non-goals are things that could reasonably be goals but are chosen not to be. "non-goals aren’t negated goals like “The system shouldn’t crash”, but rather things that could reasonably be goals, but are explicitly chosen not to be goals." (Goals and non-goals)
- The design section is where trade-offs are written down. "The design doc is the place to write down the trade-offs you made in designing your software." (The actual design)
- Sketch the API, don't paste formal definitions. "one should withstand the temptation to copy-paste formal interface or data definitions into the doc" (APIs)
- Systems that store data should say how, in rough form. "Systems that store data should likely discuss how and in what rough form this happens." (Data storage)
- Alternatives considered is one of the most important sections. "this section is one of the most important ones as it shows very explicitly why the selected solution is the best given the project goals" (Alternatives considered)
- Cross-cutting concerns: security, privacy, observability. "This is where your organization can ensure that certain cross-cutting concerns such as security, privacy, and observability are always taken into consideration." (Cross-cutting concerns)
- Length: around 10 to 20 pages for a larger project; 1 to 3 page mini docs also work. "The sweet spot for a larger project seems to be around 10-20ish pages." (The length of a design doc)
- Skip the doc when there's no ambiguity. "At the center of that decision lies whether the solution to the design problem is ambiguous–because of problem complexity or solution complexity, or both." (When not to write a design doc)
- A doc with no trade-offs is an implementation manual. "If a doc basically says “This is how we are going to implement it” without going into trade-offs, alternatives, and explaining decision making (or if the solution is so obvious as to mean there were no trade-offs), then it would probably have been a better idea to write the actual program right away." (When not to write a design doc)
- A prototype is a strong argument. "“I tried it out and it works” is one of the best arguments for choosing a design." (When not to write a design doc)
- Review's value is timing. "The primary value of the review isn’t that issues get discovered per-se, but rather that this happens relatively early in the development lifecycle when it is still relatively cheap to make changes." (Review)
- Update the doc when reality differs, at least before the system ships. "If the designed system hasn’t shipped yet, then definitely update the doc." (Implementation and iteration)
- A system-context diagram places the design among the systems around it. "Such a diagram shows the system as part of the larger technical landscape" (The actual design)
- The standard sections include context and scope. "This section should be entirely focused on objective background facts." (Context and scope)

## Visuals worth redrawing

- The system-context diagram idea (the new system among the ones around it).

## My notes

- Primary for Google's practice (the author worked there), not a rule
  book; Ubl says the format is informal.
