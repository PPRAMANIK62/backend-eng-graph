---
id: fowler-event-sourcing-2005
title: Event Sourcing
author: Martin Fowler
url: https://martinfowler.com/eaaDev/EventSourcing.html
kind: blog
primary: true
---

## Summary

The pattern write-up that named event sourcing (draft, from Fowler's
mid-2000s enterprise patterns work). Every change is captured as an
event object and the events are stored in order; state can be rebuilt,
queried at a past time, or corrected by replay. Covers snapshots,
reversing events, and the trouble with external systems during replay.

## Key claims

- Definition: every change to state is captured as an event, stored in order, for as long as the state itself. "The fundamental idea of Event Sourcing is that of ensuring every change to the state of an application is captured in an event object, and that these event objects are themselves stored in the sequence they were applied for the same lifetime as the application state itself." (How it Works)
- The key guarantee: all changes to domain objects are initiated by events. "The key to Event Sourcing is that we guarantee that all changes to the domain objects are initiated by the event objects." (How it Works)
- Complete rebuild: throw the state away and replay the log. "We can discard the application state completely and rebuild it by re-running the events from the event log on an empty application." (How it Works)
- Temporal query: the state at any past point. "We can determine the application state at any point in time." (How it Works)
- Event replay to correct a wrong past event. (How it Works)
- Version control systems are a common example. "A common example of an application that uses Event Sourcing is a version control system." (How it Works)
- Replaying from empty is slow with many events; keep the current state and snapshots, replay from a snapshot after a crash. "It's equally simple to see why this is a slow process, particularly if there are many events." (Application State Storage)
- Either the event log or the current state can be the system of record. "The official system of record can either be the event logs or the current application state." (Application State Storage)
- Events as differences (add $10 to an account) reverse easily; events that set an absolute value ($110) do not. (Reversing Events)
- Replays must not resend messages to external systems; wrap them in gateways that know about replay. "if these events cause update messages to be sent to external systems, then things will go wrong because those external systems don't know the difference between real processing and replays." (External Updates)
- External queries during replay need the answer from the original time (exchange rate example); gateways may have to remember responses. (External Queries)
- Code changes: new features, bug fixes and time-dependent rules complicate replay. (Code Changes)
- Accounting ledgers are event sourcing. "an Account is itself an example of Event Sourcing." (Events and Accounts)
- Not a natural choice; many find it awkward. "Packaging up every change to an application as an event is an interface style that not everyone is comfortable with, and many find to be awkward." (When to Use It)
- Readers fed by an event stream can lag the master. "The reader systems are liable to be out of sync with the master (and each other) due to differences in timing with event propagation." (When to Use It)

## Visuals worth redrawing

- Figures 3 and 4: ship tracker state only, versus state plus event log.

## My notes

- The page itself says it's a draft that won't be updated.
