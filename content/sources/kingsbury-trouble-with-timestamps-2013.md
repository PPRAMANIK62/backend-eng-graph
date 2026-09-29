---
id: kingsbury-trouble-with-timestamps-2013
title: "The trouble with timestamps"
author: Kyle Kingsbury
url: https://aphyr.com/posts/299-the-trouble-with-timestamps
kind: blog
primary: false
---

## Summary

Why last-write-wins by wall-clock timestamp, as in Cassandra and Riak's
LWW mode, breaks session guarantees: clocks step backwards and differ
between machines, so a later write can carry a smaller timestamp and be
thrown away for good. Also how tombstones make it worse.

## Key claims

- Cassandra orders writes by wall-clock time. "Cassandra uses wall-clock timestamps provided by the server, or optionally by the client, to order writes." (body)
- Those clocks can go backwards. "These clocks can flow backwards, for a number of reasons" (body)
- One reason: NTP steps the clock. "NTP corrects large time differentials by jumping the clock discontinously to the correct time." (body)
- A later write with a smaller timestamp is ignored. "Cassandra immediately ignores w2 on any nodes where w1 is visible." (leap second example)
- And it's lost, not delayed. "It’s a little tough to work around this one because w2 isn’t just temporarily invisible–it’s gone forever." (multiple clients example)
- A delete's tombstone wins over everything older. "All objects with a lower timestamp will be silently deleted until GC removes the tombstone record" (deletes)
- Conclusion. "Timestamps, as implemented in Riak, Cassandra, et al, are fundamentally unsafe ordering constructs." (conclusion)
- The fix is logical clocks. "To ensure safety properties hold all the time, rather than probabilistically, you need logical clocks." (conclusion)
- And measure your skew. "Make sure you measure your clock skew" (conclusion)
- A bad clock can destroy later writes for a long time. "a rogue client or node can cause the destruction of every write to a record for days to weeks afterwards." (deletes)

## Visuals worth redrawing

- The two-client timeline where w2 happens after w1 in real time but gets
  a smaller timestamp.

## My notes

- 2013; Cassandra still uses LWW timestamps per its current architecture
  docs (cassandra-architecture-dynamo).
