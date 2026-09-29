---
id: figma-multiplayer-reliable-2022
title: Making multiplayer more reliable
author: Darren Tsung (Figma)
url: https://www.figma.com/blog/making-multiplayer-more-reliable/
kind: blog
primary: true
---

## Summary

Figma (2022) on adding a write-ahead journal to its multiplayer
service. The server holds each file in memory and used to rely on
checkpoints to S3 every 30 to 60 seconds. The journal records each
change with a sequence number in DynamoDB, so a crash loses under a
second instead of up to a minute. Also covers file ownership locks to
prevent split brain, batching, cross-Region replication cost, and how
they validated it.

## Key claims

- The multiplayer server is authoritative and holds the file in memory. "Multiplayer is authoritative and handles validation, ordering, and conflict resolution. In order to keep things as fast as possible, multiplayer holds the state of the file in-memory and updates it as changes come in." (How multiplayer works)
- Checkpoints every 30 to 60 seconds. "multiplayer periodically writes the state of the file to storage every 30 to 60 seconds in a process we call "checkpointing."" (How multiplayer works)
- A crash could lose up to 60 seconds. "Since checkpoints were created only every ~60 seconds, we could lose up to 60 seconds of work on the server-side if multiplayer crashes." (How multiplayer works)
- Every change gets a sequence number. "Each change is assigned a sequence number, which is an incrementing integer associated with the file." (Introducing the journal)
- Recovery = checkpoint plus newer journal entries. "But after the checkpoint is loaded, multiplayer queries for all entries that are newer (i.e. have a higher sequence number) than the checkpoint." (Introducing the journal)
- Goal under a second of loss. "(Our goal was <1s of data loss.)" (Introducing the journal)
- Clients send updates every 33 ms; the journal batches them. "Because clients send updates every 33ms (30 FPS) and we don't need that level of granularity in the journal, we can improve performance by batching multiple changes together and only writing to the journal every so often." (Changes, batched)
- All clients of a file must reach the same server instance. "It's important that all clients that open a particular file get connected to the multiplayer instance that has the file open; otherwise we'd get into "split brain" and clients on one instance would see something different than clients on another instance." (Managing conflicting writes)
- Journal writes are conditional on holding the file's lock. "When new entries are being written to the journal, the update is conditional on the lock UUID matching in the other table." (Managing conflicting writes)
- DynamoDB global tables would have cost too much for cross-Region copies. "Our estimates showed that this would increase the cost of the feature by 6x!" (An alternative to cross-region replication)
- Cross-Region target: 30 minutes. "we want file data to be cross-region replicated within 30 minutes." (An alternative to cross-region replication)
- Scale and speed after rollout. "Today the journal handles >2.2B received changes per day, persists 95% of changes within ~600ms, and has helped prevent a number of incidents from causing data loss!" (Validating the journal)
- Instead, they relied on S3 checkpoints already copied across Regions. "But because checkpoints are stored in S3 and already set up to be replicated cross-region, we found that we were able to satisfy the 30-minute goal by ensuring that all changes in the journal were checkpointed within that time frame." (An alternative to cross-region replication)
- The journal is written asynchronously as changes are accepted. "At a high level, the journal is a durable datastore that is asynchronously written to as multiplayer accepts incoming changes." (Introducing the journal)

## Visuals worth redrawing

- Checkpoint plus journal diagram. Not redrawn.

## My notes

- DynamoDB chosen over Postgres because of write volume needing a
  horizontally scalable store.
