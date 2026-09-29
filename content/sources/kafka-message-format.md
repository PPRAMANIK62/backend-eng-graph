---
id: kafka-message-format
title: Implementation, Message Format (Apache Kafka 4.3 docs)
author: Apache Kafka project
url: https://kafka.apache.org/43/implementation/message-format/
kind: docs
primary: true
---

## Summary

The on-disk and on-the-wire layout of a Kafka record batch (magic 2)
and of each record inside it. The batch header carries the producer
ID, epoch and base sequence used for duplicate checks, and the page
explains what compaction must keep so those checks still work.

## Key claims

- Records are always written in batches. "Messages (aka Records) are always written in batches." (Message Format)
- The batch header has the producer fields. "producerId: int64" / "producerEpoch: int16" / "baseSequence: int32" (Record Batch)
- A CRC-32C covers the batch from the attributes to the end. "The CRC covers the data from the attributes to the end of the batch (i.e. all the bytes that follow the CRC)." (Record Batch)
- Compaction keeps the first and last offset and sequence of each batch, so producer state survives. "On compaction, we preserve the first and last offset/sequence numbers from the original batch when the log is cleaned." (Record Batch)
- The duplicate check compares first and last sequence numbers. "the broker checks incoming Produce requests for duplicates by verifying that the first and last sequence numbers of the incoming batch match the last from that producer" (Record Batch)
- So a fully cleaned batch can stay as an empty shell. "As a result, it is possible to have empty batches in the log when all the records in the batch are cleaned but batch is still retained in order to preserve a producer’s last sequence number." (Record Batch)
- Each record stores its key and value with varint lengths. "keyLength: varint" / "key: byte[]" / "valueLength: varint" (Record)

## Visuals worth redrawing

- The batch header fields; a small version could show producerId,
  producerEpoch and baseSequence. Our own drawing.

## My notes

- Magic value 2 is the current format; before 0.11 it was message sets.
