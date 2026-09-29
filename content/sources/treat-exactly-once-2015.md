---
id: treat-exactly-once-2015
title: You Cannot Have Exactly-Once Delivery
author: Tyler Treat
url: https://bravenewgeek.com/you-cannot-have-exactly-once-delivery/
kind: blog
primary: false
---

## Summary

A 2015 blog post arguing that exactly-once message delivery is
impossible between any two machines, that systems offer at most once
or at least once, and that "exactly once" in practice means at least
once plus idempotent messages or deduplication. Widely cited, and
widely disputed in its own comments.

## Key claims

- The claim. "Within the context of a distributed system, you cannot have exactly-once message delivery." (intro)
- The sender can't tell what went wrong when no ack comes back. "Did the message get dropped? Did the ack get dropped? Did the receiver crash? Are they just slow?" (body)
- Ack before processing is at most once: a crash loses the message. "When a message is delivered, it’s acknowledged immediately before processing." (body)
- Ack after processing is at least once: a crash before the ack causes redelivery. "If the process crashes after handling a message but before acking (or the ack isn’t delivered), the sender will redeliver. Hello, at-least-once delivery." (body)
- In practice exactly once is faked with idempotency or deduplication. "The way we achieve exactly-once delivery in practice is by faking it." (body)
- Send state, not instructions, so duplicates don't matter (the directions example). "Instead, let’s just tell him where we are and let him figure it out. If the message gets delivered more than once, it won’t matter." (body)
- Conclusion: at least once plus idempotency. "We must choose between the lesser of two evils, which is at-least-once delivery in most cases." (conclusion)

## Visuals worth redrawing

None.

## My notes

- Readers in the comments dispute the use of FLP and Two Generals
  (FLP assumes reliable links; it rules out guaranteed termination, not
  safety). The article leans on those results; our article shouldn't.
- The useful, uncontroversial part: delivery can't be exactly once from
  the sender's view, but the effect can be, if the receiver dedups.
