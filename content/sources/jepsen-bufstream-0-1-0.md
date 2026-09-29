---
id: jepsen-bufstream-0-1-0
title: Jepsen, Bufstream 0.1.0
author: Kyle Kingsbury (Jepsen)
url: https://jepsen.io/analyses/bufstream-0.1.0
kind: blog
primary: false
---

## Summary

A 2024 Jepsen analysis of Bufstream, a Kafka-compatible broker, that
also tested Kafka itself with the official Java client. Besides
Bufstream's own bugs, it found that Kafka's transaction protocol could
show aborted reads, lost writes and torn transactions under process
pauses (KAFKA-17754), that consumers don't rewind on a transaction
abort unless a rebalance happens (KAFKA-17582), and that Kafka lacks an
authoritative description of what transactions guarantee.

## Key claims

- Kafka's transaction guarantees are documented only in scattered places. "Instead, documentation remains scattered across various blog posts, Wiki pages, Kafka Improvement Proposals, Google Docs, introductory guides, and the Java client’s API documentation." (2.2 Transactions)
- What a transaction is: records sent plus the offsets consumed. "In broad terms, a Kafka transaction comprises a set of records sent by a producer and a map of partitions to the maximum offsets polled by a consumer." (2.2 Transactions)
- Exactly-once only holds under several implicit assumptions about how you use it. "With the right implicit assumptions—for instance, that consumers process every record seen, that every record is processed in the scope of a transaction, that every transaction commits its highest consumed offsets, and so on—the committed offsets of a transaction can be understood as the set of records it consumed." (2.2 Transactions)
- After an abort, the consumer keeps going forward unless a rebalance happens; you're meant to rewind by hand. "Consumers continue advancing, unless they happen to be rebalanced, in which case they might rewind to an arbitrary point—whatever happens to be committed. Users are supposed to manually rewind the consumer’s position on transaction abort." (5.3 Unpredictable Consumer Offsets After Transaction Failure (KAFKA-17582))
- Advancing past an aborted transaction can mark unprocessed records as done. "Kafka users typically want at-least-once delivery—advancing to later offsets could mark records from the aborted transaction as committed even though they had never been processed." (5.3)
- The protocol has no transaction number, so a delayed commit or abort can hit the wrong transaction. "There is no sequence number to order requests from the same client. There is no concept of a transaction number." (5.4 Write Loss, Aborted Reads, Torn Transactions (KAFKA-17754))
- They saw it in Kafka too, with process pauses. "We observed aborted reads and torn transactions due to process pauses in Kafka as well, and opened KAFKA-17754 to track the issue." (5.4)
- Kafka's engineers expected KIP-890 (an epoch bump on every transaction) to fix it. "Kafka’s engineers believe KIP-890, which was motivated by hanging transactions in Kafka, will likely fix the problem." (5.4)
- The conclusion, in the report's own words. "The Kafka transaction protocol is fundamentally broken and must be revised." (6.3 Kafka Transactions are Broken)
- Jepsen proves bugs, not their absence. "we can prove the presence of bugs, but not their absence." (6 Discussion)
- Correction: auto-commit consumers commit the offsets of the poll before the latest one, not the latest; the earlier claim of data loss from auto-commit was withdrawn. "Rather, they commit the offsets of the penultimate poll—the poll before the most recent poll." (1 Updates)
- Kafka Streams' exactly-once wasn't tested. "Future work could explore the correctness of Streams applications." (6.4 Future Work)
- Kafka docs were largely silent on consumer offsets after a failed commit. "Kafka’s official documentation is largely silent about the intended behavior for consumer offsets when a transaction fails to commit." (5.3)
- They asked on KAFKA-17582 and learned the no-rewind behavior is intended. "We opened KAFKA-17582 to ask for clarification, and learned that this behavior is intentional." (5.3)
- KIP-890 was still in progress when the report was written. "work is ongoing." (5.4, end of the KAFKA-17754 paragraph)

## Visuals worth redrawing

- The abort outcome table (advance vs rewind, with and without a
  rebalance). Would make a good small figure; not needed yet.

## My notes

- Tested Kafka and the Java client as they were in 2024, before Kafka
  4.0 shipped KIP-890 (see kafka-upgrade-notes). The report can't say
  whether KIP-890 fixes KAFKA-17754; it says Kafka's engineers believe
  it will.
- The Kafka 4.3 design docs now say the consumer doesn't rewind by
  itself after an abort, so that behaviour is documented now
  (kafka-design-delivery-semantics).
