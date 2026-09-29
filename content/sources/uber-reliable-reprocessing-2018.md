---
id: uber-reliable-reprocessing-2018
title: Building Reliable Reprocessing and Dead Letter Queues with Apache Kafka
author: Ning Xia, Uber Engineering
url: https://www.uber.com/blog/reliable-reprocessing/
kind: blog
primary: true
---

## Summary

A 2018 Uber engineering post on handling messages that keep failing in
a Kafka consumer. A consumer that won't commit past a failing message
blocks everything behind it. Uber's fix: after a few tries, publish the
message to a retry topic and commit, with a chain of retry topics that
add increasing delay, ending in a dead-letter topic.

## Key claims

- A failing message blocks the batch because the offset can't move past it. "Without a success response, the Kafka consumer will not commit a new offset and the batches with these bad messages would be blocked, as they are re-consumed again and again, as illustrated in Figure 2, below." (The problem with simple retries)
- New messages wait behind it. "The consumer that received that specific message does not commit the message’s offset, meaning that this message would be consumed again and again at the expense of new messages that are arriving in the channel and now must wait to be read." (Figure 2 caption)
- The fix: move the failure to a retry topic and commit. "Under this paradigm, when a consumer handler returns a failed response for a given message after a certain number of retries, the consumer publishes that message to its corresponding retry topic. The handler then returns true to the original consumer, which commits its offset." (Processing in separate queues)
- Success is redefined as reaching a conclusive result. "Consumer success is redefined from a successful handler response, meaning zero failure, to the establishment of a conclusive result for the consumed message, which is either the expected response or its placement elsewhere to be separately handled." (Processing in separate queues)
- Several retry topics in a chain; the last step is the DLQ. "If a consumer of the last retry topic still does not return success, then it will publish that message to the dead letter topic." (Processing in separate queues)
- Each retry level waits longer. "Rather, each subsequent level of retry consumers can enforce a processing delay, in other words, a timeout that increases as a message steps down through each retry topic." (Processing in separate queues)
- Dead-lettered messages are replayed into the first retry topic, away from live traffic. "Dead letter messages are merged to re-enter processing by being published back into the first retry topic." (Processing in separate queues)
- Code bugs should skip the retries. "We can also differentiate treatment of different types of errors, allowing cases such as network flakiness to be re-attempted, while null pointer exceptions and other code bugs should go straight into the DLQ because retries would not fix them." (Configurability)
- Each consumer group gets its own retry and DLQ topics, so one failing dependency doesn't redo work for the others. "Independent work streams that operate on the same event each have their own consumer flows, with separate reprocessing and dead letter queues." (Decoupling)

## Visuals worth redrawing

- Figure 4: the main topic, retry topics stepping down, and the DLQ at
  the bottom. Redrawn for poison-messages.

## My notes

- Moving a message to a retry topic gives up order for that key: later
  messages for the same key are processed first. The post doesn't
  discuss ordering.
