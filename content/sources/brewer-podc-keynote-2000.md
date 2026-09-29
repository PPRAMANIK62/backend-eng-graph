---
id: brewer-podc-keynote-2000
title: "Towards Robust Distributed Systems (PODC keynote slides)"
author: Eric Brewer
url: https://people.eecs.berkeley.edu/~brewer/cs262b-2004/PODC-keynote.pdf
kind: talk
primary: true
---

## Summary

The slides of Brewer's PODC 2000 keynote, where the CAP conjecture was
first presented to that community. The CAP slides state it as a
theorem about "shared-data systems" and give example systems for each
property you forfeit. Also the ACID versus BASE slide.

## Key claims

- The claim as first stated. "Theorem: You can have at most two of these properties for any shared-data system" (slide "The CAP Theorem")
- Brewer saw ACID vs BASE as a spectrum. "But I think it’s a spectrum" (slide "ACID vs. BASE")
- Forfeiting availability: distributed databases, locking, majority protocols. "Make minority partitions unavailable" (slide "Forfeit Availability", traits)
- Every corner of the trade-off has real uses. "The whole space is useful" (slide "These Tradeoffs are Real")

## Visuals worth redrawing

- The C, A, P triangle with an example list per forfeited property.

## My notes

- The slide examples (Coda, web caching, DNS for forfeiting
  consistency; distributed databases, distributed locking, majority
  protocols for forfeiting availability) are lists without sentences, so
  they're recorded here rather than quoted.
