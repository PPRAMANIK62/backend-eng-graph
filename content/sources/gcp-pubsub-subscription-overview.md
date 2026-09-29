---
id: gcp-pubsub-subscription-overview
title: Subscription overview (Google Cloud Pub/Sub)
author: Google Cloud
url: https://cloud.google.com/pubsub/docs/subscription-overview
kind: docs
primary: true
---

## Summary

How a Pub/Sub subscription works: created per topic, sees only what's
published after it exists, pull or push delivery, at least once and
unordered by default, and expires when idle.

## Key claims

- Only messages after the subscription exists. "Only messages published to the topic after the subscription is created are available to subscriber clients." (intro)
- Many subscriptions per topic. "A topic can have multiple subscriptions, but a given subscription belongs to a single topic." (intro)
- Replay is an extra feature. "The topic retention feature lets a subscription attached to a topic seek back in time and replay previously published messages." (intro)
- At least once and unordered by default. "By default, Pub/Sub offers at-least-once delivery with no ordering guarantees on all subscription types." (Subscription properties)
- Even an acknowledged message can come back. "Pub/Sub might redeliver a message even after an acknowledgment request for the message returns successfully." (Subscription properties)
- Idle subscriptions expire. "By default, subscriptions expire after 31 days of subscriber inactivity or if there are no updates made to the subscription." (Subscription expiration)
- A re-created subscription starts empty. "a new subscription created with the same name would have no backlog (no messages waiting for delivery) at the time it's created." (Subscription expiry)

## Visuals worth redrawing

None.

## My notes

None.
