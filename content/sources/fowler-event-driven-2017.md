---
id: fowler-event-driven-2017
title: What do you mean by "Event-Driven"?
author: Martin Fowler
url: https://martinfowler.com/articles/201701-event-driven.html
kind: blog
primary: false
---

## Summary

Martin Fowler's 2017 note sorting "event-driven" into four patterns:
event notification, event-carried state transfer, event sourcing and
CQRS. The part used here is event notification and its trap: a flow
that runs over several events isn't written down anywhere.

## Key claims

- In event notification, the sender doesn't much care about the response. "A key element of event notification is that the source system doesn't really care much about the response." (Event Notification)
- A flow spread over events is hard to see. "The problem is that it can be hard to see such a flow as it's not explicit in any program text." (Event Notification)
- Often only a live system shows you the flow. "Often the only way to figure out this flow is from monitoring a live system." (Event Notification)
- Decoupling can hide the larger flow. "it's very easy to make nicely decoupled systems with event notification, without realizing that you're losing sight of that larger-scale flow" (Event Notification)
- The "passive-aggressive command": an event used where a command was meant. "This happens when the source system expects the recipient to carry out an action, and ought to use a command message to show that intention, but styles the message as an event instead." (Event Notification)
- Replay in event sourcing gets hard when results depend on outside systems. "Replaying events becomes problematic when results depend on interactions with outside systems." (Event Sourcing)

## Visuals worth redrawing

None.

## My notes

- Doesn't use the words orchestration or choreography; it's the best
  short statement of choreography's main cost.
