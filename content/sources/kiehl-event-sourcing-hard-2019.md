---
id: kiehl-event-sourcing-hard-2019
title: "Don't Let the Internet Dupe You, Event Sourcing is Hard"
author: Chris Kiehl
url: https://chriskiehl.com/article/event-sourcing-is-hard
kind: blog
primary: false
---

## Summary

A practitioner's report after a year running an event-sourced system in
production: shared event streams couple services, lots of plumbing,
events go stale as requirements change, audit logs are noisy,
projections cost code and bring read lag, and a history table plus CQRS
without event sourcing often does the job.

## Key claims

- Letting many services subscribe to your raw events breaks service boundaries. "You wouldn't let two separate services reach directly into each other's data storage when not event sourcing" (The core selling point...)
- A web of services reading one stream becomes hard to follow. "how these system actually work and connect together will eventually be completely baffling." (The core selling point...)
- Lots of plumbing code: commands, handlers, validators, events, aggregates, projections. "the shear volume of plumbing code involved is staggering." (The upstart costs are large)
- The UI has to be task-based to produce small semantic events, but most UIs are forms. (Event sourcing needs the UI side to play along)
- Events go stale as requirements change; upcasting or rewriting costs you the exact past. "you've lost the ability to accurately produce the state of your system at the point in time of the rewrite." (Past system states...)
- Projections multiply the code that must change with each event type. "If you add, modify, or remove an event type, you're on the hook for spreading knowledge of that change to N different places." (Projections are not actually free)
- Reading from projections loses read-after-write consistency. "with this step comes materialization lag and the loss of read-after-write consistency." (You'll deal with materialization lag)
- A history table gets most of the value. "A good ol' fashion history table gets you 80% of the value of a ledger with essentially none of the cost." (So what now?)
- CQRS doesn't need event sourcing. "Similarly CQRS doesn't require event sourcing." (So what now?)

## Visuals worth redrawing

None.

## My notes

- One team's experience; the "80%" is his estimate, not a measurement.
