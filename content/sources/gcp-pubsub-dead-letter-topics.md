---
id: gcp-pubsub-dead-letter-topics
title: Dead-letter topics (Google Cloud Pub/Sub)
author: Google Cloud
url: https://cloud.google.com/pubsub/docs/handling-failures
kind: docs
primary: true
---

## Summary

Pub/Sub's version of a dead-letter queue: a topic that undeliverable
messages are forwarded to after a number of delivery attempts. The page
covers how attempts are counted, the limits, and what gets attached to a
forwarded message.

## Key claims

- Pub/Sub forwards messages a subscriber can't acknowledge to a dead-letter topic. "To manage undeliverable messages that subscribers can't acknowledge, Pub/Sub can forward them to a dead-letter topic (also known as a dead-letter queue)." (intro)
- The attempt count is approximate. "The maximum number of delivery attempts is approximate because Pub/Sub forwards undeliverable messages on a best-effort basis." (How maximum delivery attempts are calculated)
- It can forward a little early or a little late. "The service might forward a message after fewer attempts than configured, or it might attempt delivery a few more times before forwarding." (How maximum delivery attempts are calculated)
- The count can reset, so a message can be delivered more times than the maximum. "As a result, the messages might be delivered to the subscriber client more times than the configured maximum number of delivery attempts." (How maximum delivery attempts are calculated)
- Default 5 attempts, allowed range 5 to 100. "In the Maximum delivery attempts field, specify an integer between 5 and 100." (Set a dead-letter topic on a new subscription; property list gives default 5, minimum 5, maximum 100)
- It's a subscription setting. "You configure a dead-letter topic on a subscription, not on the topic it pulls from." (Dead-letter topic properties)
- The original message is wrapped and labelled with where it came from. "When Pub/Sub forwards an undeliverable message, it wraps the original message in a new one and adds attributes that identify the source subscription." (How dead-letter topics work)
- Attributes include the attempt count and the original publish time: `CloudPubSubDeadLetterSourceDeliveryCount`, `CloudPubSubDeadLetterSourceSubscription`, `CloudPubSubDeadLetterSourceTopicPublishTime`. (list after the delivery-attempt samples)
- Forwarded messages leave the source subscription. "After forwarding an undeliverable message, the Pub/Sub service removes the message from the subscription." (Monitor forwarded messages)
- A separate subscription on the dead-letter topic is what receives them. "A separate subscription attached to the dead-letter topic can then receive these forwarded messages for analysis and offline debugging." (How dead-letter topics work)

- The tracked count can drop back to zero. "The tracked number of delivery attempts for a message may also reset to zero, especially for a pull subscription with inactive subscribers." (How maximum delivery attempts are calculated)
- Without a subscription on the dead-letter topic, forwarded messages are lost (comment in the code samples). "messages published to a topic with no subscriptions are lost." (code samples, Set a dead-letter topic)
- There is a metric for forwarded messages. "The subscription/dead_letter_message_count metric records the number of undeliverable messages that Pub/Sub forwards from a subscription." (Monitor forwarded messages)

## Visuals worth redrawing

None.

## My notes

- Counting only works when the dead-letter topic and IAM roles are set
  up right ("Pub/Sub only counts delivery attempts when a dead-letter
  topic is configured correctly").
