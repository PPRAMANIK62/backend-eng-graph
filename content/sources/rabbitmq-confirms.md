---
id: rabbitmq-confirms
title: Consumer Acknowledgements and Publisher Confirms (RabbitMQ 4.3 docs)
author: RabbitMQ team (Broadcom)
url: https://www.rabbitmq.com/docs/confirms
kind: docs
primary: true
---

## Summary

The RabbitMQ guide to acknowledgements on both ends: consumers
acknowledging deliveries, the broker confirming publishes, automatic
versus manual acks, requeueing, prefetch, and what happens when a
consumer's connection drops.

## Key claims

- Both ends need confirmation. "Since protocol methods (messages) sent are not guaranteed to reach the peer or be successfully processed by it, both publishers and consumers need a mechanism for delivery and processing confirmation." (The Basics)
- Automatic ack counts a message as delivered once sent. "In automatic acknowledgement mode, a message is considered to be successfully delivered immediately after it is sent." (Consumer Acknowledgement Modes)
- Unacked deliveries come back when the channel closes. "When manual acknowledgements are used, any delivery (message) that was not acked is automatically requeued when the channel (or connection) on which the delivery happened is closed." (Automatic Requeueing)
- Detection takes time. "Note that it takes a period of time to detect an unavailable client." (Automatic Requeueing)
- So consumers must be idempotent. "Due to this behavior, consumers must be prepared to handle redeliveries and otherwise be implemented with idempotence in mind." (Automatic Requeueing)
- Redeliveries are flagged. "Redeliveries will have a special boolean property, redeliver, set to true by RabbitMQ." (Automatic Requeueing)
- Another consumer may get it. "Note that a consumer can receive a message that was previously delivered to another consumer." (Automatic Requeueing)
- A nack without requeue dead-letters or drops. "Alternatively, when this field is set to false, the message will be routed to a Dead Letter Exchange if it is configured, otherwise it will be discarded." (Negative Acknowledgement and Requeuing)
- Everyone requeueing makes a loop. "This means that if all consumers requeue because they cannot process a delivery due to a transient condition, they will create a requeue/redelivery loop." (Negative Acknowledgement and Requeuing)
- Prefetch caps unacked deliveries. "The value defines the max number of unacknowledged deliveries that are permitted on a channel." (Channel Prefetch Setting)
- A usual range. "Values in the 100 through 300 range usually offer optimal throughput and do not run significant risk of overwhelming consumers." (Prefetch and Throughput)
- Prefetch 1 is the safest and slowest. "Prefetch value of 1 is the most conservative." (Prefetch and Throughput)
- Publisher confirms exist because transactions were too slow. "In this case, transactions are unnecessarily heavyweight and decrease throughput by a factor of 250." (Publisher Confirms)
- Prefetch 1 costs throughput. "It will significantly reduce throughput, in particular in environments where consumer connection latency is high." (Prefetch and Throughput)
- Prefetch also protects the consumer's memory. "For most consumers, it makes sense to limit the size of this window to avoid the unbounded buffer (heap) growth problem on the consumer end." (Channel Prefetch Setting)
- Where a requeued message goes. "When a message is requeued, it will be placed to its original position in its queue, if possible." (Negative Acknowledgement and Requeuing); otherwise closer to the head.
- Automatic ack counts a message delivered once it is written to the socket: "immediately after it is sent out (written to a TCP socket)" (Consumer Acknowledgement Modes)
- The broker confirms publishes as it handles them. "The broker then confirms messages as it handles them by sending a basic.ack on the same channel." (Publisher Confirms)
- Publisher confirms and consumer acks don't know about each other. "The two features, however, are entirely orthogonal and unaware of each other." (Are Publisher Confirms Related to Consumer Delivery Acknowledgements?)
- When a publish is confirmed. "For persistent messages routed to durable queues, this means persisting to disk." (When Will Published Messages Be Confirmed by the Broker?)

## Visuals worth redrawing

None.

## My notes

- The factor of 250 is RabbitMQ's figure, no setup given; don't
  repeat it as a measurement.
