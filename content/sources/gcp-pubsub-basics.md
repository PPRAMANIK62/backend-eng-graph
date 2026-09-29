---
id: gcp-pubsub-basics
title: Overview of the Pub/Sub service (Google Cloud Pub/Sub)
author: Google Cloud
url: https://cloud.google.com/pubsub/docs/pubsub-basics
kind: docs
primary: true
---

## Summary

Google's walk-through of its Pub/Sub model: publishers write to a
topic, each subscription attached to it gets a copy of every message,
and subscribers sharing one subscription split its messages between
them. Also the ack deadline and the three message states.

## Key claims

- Senders and receivers are decoupled. "Pub/Sub is a publish/subscribe (Pub/Sub) service, a messaging service where the senders of messages are decoupled from the receivers of messages." (intro)
- Every subscription gets a copy. "Each subscription receives a copy of A and B messages from the topic." (Pub/Sub service workflow, step 4)
- Subscribers on one subscription split the messages. "The two subscriber applications receive a subset of the messages from the topic." (step 5)
- Deleted once each subscription has acked. "After at least one subscriber for each subscription has acknowledged the message, Pub/Sub deletes the message from storage." (Message lifecycle)
- One outstanding delivery per subscription. "While a message is outstanding to a subscriber, Pub/Sub doesn't try to deliver it to any other subscriber on the same subscription." (Message lifecycle)
- Fan out: same messages to each. "Each of the subscriber applications gets the same set of published messages from the topic." (Pub/Sub publish-subscribe patterns, Fan out)

## Visuals worth redrawing

- Two publishers, one topic, two subscriptions; subscription 1 shared
  by two subscribers, subscription 2 by one. (Pub/Sub service workflow)

## My notes

None.
