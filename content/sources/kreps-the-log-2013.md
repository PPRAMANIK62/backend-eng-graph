---
id: kreps-the-log-2013
title: "The Log: What every software engineer should know about real-time data's unifying abstraction"
author: Jay Kreps (LinkedIn Engineering)
url: https://web.archive.org/web/2025/https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying
kind: blog
primary: true
---

## Summary

A long essay (2013) by one of Kafka's creators. A log is an
append-only, totally ordered sequence of records; the same idea sits
under database replication, consensus and data integration. Used as a
shared, retained, ordered feed, it lets many readers consume at their
own pace. The original LinkedIn URL returned 404 when this note was
made; the note is from the Internet Archive's copy.

## Key claims

- What a log is. "A log is perhaps the simplest possible storage abstraction. It is an append-only, totally-ordered sequence of records ordered by time." (Part One: What Is a Log?)
- Each entry gets a number. "Each entry is assigned a unique sequential log entry number." (Part One)
- Same inputs in the same order give the same state. "If two identical, deterministic processes begin in the same state and get the same inputs in the same order, they will produce the same output and end in the same state." (Logs in distributed systems)
- The log decouples writing from reading. "The log also acts as a buffer that makes data production asynchronous from data consumption." (Part Two: Data Integration)
- Readers go at their own pace. "This means a subscribing system can crash or go down for maintenance and catch up when it comes back: the subscriber consumes at a pace it controls." (Part Two)
- New readers need no change upstream. "Neither the originating data source nor the log has knowledge of the various data destination systems, so consumer systems can be added and removed with no change in the pipeline." (Part Two)
- "Pub sub" promises little by itself. "doesn't imply much more than indirect addressing of messages" (Part Two)
- A log is messaging with durability and order. "You can think of the log as acting as a kind of messaging system with durability guarantees and strong ordering semantics." (Part Two)
- Partitions have no order between them. "Each partition is a totally ordered log, but there is no global ordering between partitions (other than perhaps some wall-clock time you might include in your messages)." (Partitioning the log)
- The trade is acceptable to them. "Lack of a global order across partitions is a limitation, but we have not found it to be a major one." (Partitioning the log)
- Single sender order. "Kafka guarantees that appends to a particular partition from a single sender will be delivered in the order they are sent." (Partitioning the log)
- Reordering updates to one record gives wrong results. "if we re-order two updates to the same record in our processing we may produce the wrong final output." (Part Three)
- A big buffer stops one slow job from stalling others. "We cannot have one faulty job cause back-pressure that stops the entire processing flow." (Part Three)

## Visuals worth redrawing

- The log as a row of numbered cells, writes at the right, readers at
  different positions. (Part One, Part Two)
- A partitioned log: several independent ordered rows. (Partitioning
  the log)

## My notes

- Cite the archived copy; the live URL is dead.
