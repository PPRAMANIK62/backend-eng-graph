---
id: reactive-streams-jvm-spec
title: Reactive Streams for the JVM, specification
author: Reactive Streams (engineers from Kaazing, Lightbend, Netflix, Pivotal, Red Hat, Twitter and others)
url: https://github.com/reactive-streams/reactive-streams-jvm/blob/master/README.md
kind: spec
primary: true
---

## Summary

The Reactive Streams specification (version 1.0.4 for the JVM), whose
interfaces Java 9 adopted as `java.util.concurrent.Flow`. A Subscriber
signals demand with `request(n)` and a Publisher may never send more
than was requested, so every queue between them can be bounded.
Backpressure becomes a pull of credits, not a push.

## Key claims

- Goal: stop the receiver from having to buffer unbounded data across an async boundary. "ensuring that the receiving side is not forced to buffer arbitrary amounts of data" (Goals, Design and Scope)
- Backpressure is what allows bounded queues. "backpressure is an integral part of this model in order to allow the queues which mediate between threads to be bounded." (Goals, Design and Scope)
- Rule 1.1: never more onNext than requested. "The total number of `onNext`´s signalled by a `Publisher` to a `Subscriber` MUST be less than or equal to the total number of elements requested by that `Subscriber`´s `Subscription` at all times." (1. Publisher, rule 1)
- Rule 2.1: demand comes from request(n). "A `Subscriber` MUST signal demand via `Subscription.request(long n)` to receive `onNext` signals." (2. Subscriber, rule 1)
- Demand defined. "the aggregated number of elements requested by a Subscriber which is yet to be delivered (fulfilled) by the Publisher." (Glossary, Demand)
- Rule 3.17: demand of 2^63-1 may be treated as unbounded. "A demand equal or greater than 2^63-1 (`java.lang.Long.MAX_VALUE`) MAY be considered by the `Publisher` as “effectively unbounded”." (3. Subscription, rule 17)
- All buffer sizes bounded and controlled by subscribers. "One of the underlying design principles is that all buffer sizes are to be bounded and these bounds must be *known* and *controlled* by the subscribers." (Subscriber controlled queue bounds)
- A source that can't be slowed must buffer or drop. "In the case of sources whose production rate cannot be influenced—for example clock ticks or mouse movement—the publisher must choose to either buffer or drop elements to obey the imposed bounds." (Subscriber controlled queue bounds)
- request(1) per element is stop-and-wait; bigger requests amortize. "Subscribers signaling a demand for one element after the reception of an element effectively implement a Stop-and-Wait protocol where the demand signal is equivalent to acknowledgement." (Subscriber controlled queue bounds)
- Demand can be signalled early to keep the buffer full without waiting a round trip. "keeping its input buffer filled without having to wait for full round-trips" (Subscriber controlled queue bounds)

## Visuals worth redrawing

- Publisher and Subscriber with request(n) flowing up and onNext
  flowing down, and the P - N in-flight bound.

## My notes

- The reactive-streams.org home page says JDK 9's Flow interfaces are
  "1:1 semantically equivalent" to these. Opened, not cited.
