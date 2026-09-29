---
id: gcp-pubsub-ordering
title: Order messages (Google Cloud Pub/Sub)
author: Google Cloud
url: https://cloud.google.com/pubsub/docs/ordering
kind: docs
primary: true
---

## Summary

Pub/Sub's ordering keys: order per key rather than per partition,
with the costs that come with it (per-key throughput limit, head
blocking on redelivery, hot keys).

## Key claims

- A key isn't a partition. "An ordering key is not equivalent to a partition in a partition-based messaging system, because ordering keys are expected to have a much higher cardinality than partitions." (Behavior of ordered messaging)
- No order across keys. "Messages published with different ordering keys are not expected to be received in order." (Across-key ordering)
- A redelivery replays the rest of the key. "Redeliveries of a message trigger redelivery of all subsequent messages for that key, even acknowledged ones." (Message redelivery)
- Per-key publish limit. "The publishing throughput on each ordering key is limited to 1 MBps." (intro)
- Order costs availability and latency. "Compared with unordered delivery, ordered delivery decreases publish availability and increases end-to-end message delivery latency." (Performance tradeoffs)
- Hot keys. "A hot key occurs when a backlog builds on an individual ordering key because the number of messages produced per second exceeds the number of messages that the subscriber can process per second." (Hot key)
- Push allows one message per key in flight. "For a push subscription, Pub/Sub supports only one outstanding message for each ordering key at a time." (Push subscriptions)
- Async work in the consumer can undo the order. "However, if the user callback schedules other asynchronous work on messages, the subscriber client must ensure that the asynchronous work is done in order." (Receiving messages in order, StreamingPull)

## Visuals worth redrawing

None.

## My notes

None.
