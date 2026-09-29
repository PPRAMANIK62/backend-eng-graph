---
id: pub-sub
title: Publish-subscribe
depth: short
phase: 10
note: >-
  One message delivered to every subscriber, instead of to one worker.
needs: [message-queue]
leads_to: []
compare_with: [message-queue, log-based-messaging, feed-fan-out]
---

# Publish-subscribe

In a [[message-queue]], each message goes to one worker. In
publish-subscribe, each message goes to every interested party. An
"order placed" event is published once, and the email service, the
warehouse and the analytics pipeline each get their own copy. The
publisher doesn't know who they are, and adding a fourth listener
doesn't touch the publisher's code.

## One copy per subscription

RabbitMQ and Google Cloud Pub/Sub both build pub/sub from one queue
per subscriber. The publisher sends to a named place, a topic in
Google Cloud Pub/Sub or an exchange in RabbitMQ, and the broker puts a
copy of each message in every subscriber's queue.

In RabbitMQ, a fanout exchange copies every message to every queue
bound to it. Each subscriber declares its own queue and binds it to the
exchange. In Google Cloud Pub/Sub, each subscription attached to a
topic receives a copy of every message.

The two ideas combine. Inside one subscription, the consumers compete
for messages, as in a work queue. Across subscriptions, each one gets
everything:

![One publisher sends messages A and B to a topic. The topic has two subscriptions. Subscription 1, for the email service, is shared by two consumers: one receives A and the other receives B. Subscription 2, for analytics, has one consumer, which receives both A and B.](img/pub-sub-fan-out.svg)

*Every subscription gets every message; consumers sharing a
subscription split its messages. Adapted from Google Cloud,
"Overview of the Pub/Sub service".*

So the email service can run three instances to keep up, with each
message handled by one of them, while analytics gets the full stream. The unit
that receives "every message" is the subscription, not the process.

A message is deleted only after every subscription has acknowledged
it. Each subscription keeps its own acks and redeliveries, so a slow
subscriber builds up its own backlog without holding up the others.

## You only hear what's said after you start listening

A subscription starts empty. In Pub/Sub, only messages published after
the subscription was created are delivered to it. In RabbitMQ, a
message published to an exchange with no queues bound is simply
dropped. The tutorial's logging example also gives each subscriber a
temporary queue that's deleted when it disconnects, so anything sent
while it was away is gone.

That's the price of the queue-per-subscriber design. The broker keeps
a message only until the current subscribers have taken it. A new
service can't read last month's orders, and a subscriber that loses
its queue loses its backlog. Pub/Sub offers topic retention and replay
as an extra feature. A log keeps messages whether or not anyone has
read them, and each reader tracks its own place; that's
[[log-based-messaging]].

## Where it gets tricky

**"Pub/sub" names a shape, not a guarantee.** It tells you who gets a
message, not whether it's durable, ordered, replayable or delivered
once, so check each system. Google's Pub/Sub, for example, is
at least once with no ordering by default, and can redeliver a
message even after its ack succeeded.

**Duplicates multiply per subscriber.** Every subscription is its own
at-least-once stream. Each subscriber needs to handle duplicates on
its own (see [[delivery-guarantees]]).

**Idle subscriptions can vanish.** Pub/Sub deletes a subscription
after 31 days without subscriber activity by default, and a new
subscription with the same name starts with an empty backlog.

## What this means when you build

- Use pub/sub when several independent services react to the same
  event; use a work queue when one worker should handle each job.
- Give each service its own durable subscription, and scale a service
  by adding consumers to its subscription.
- Create subscriptions before you publish anything they need.
- If a new consumer will need history, use a log or turn on retention.

## Further reading

- [Overview of the Pub/Sub service](https://cloud.google.com/pubsub/docs/pubsub-basics), Google Cloud. Topics, subscriptions and subscribers, and the fan-out and load-balanced patterns.
- [Subscription overview](https://cloud.google.com/pubsub/docs/subscription-overview), Google Cloud. When a subscription starts, its delivery guarantees, and expiry.
- [RabbitMQ tutorial 3: Publish/Subscribe](https://www.rabbitmq.com/tutorials/tutorial-three-python), RabbitMQ team. Fanout exchanges, bindings and temporary queues, with code.
