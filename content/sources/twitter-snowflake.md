---
id: twitter-snowflake
title: Snowflake (README and IdWorker.scala, snowflake-2010 branch)
author: Twitter
url: https://github.com/twitter-archive/snowflake/tree/snowflake-2010
kind: code
primary: true
---

## Summary

Twitter's archived ID service (2010, archived 2021): a network service
that hands out 64-bit IDs made of a millisecond timestamp, a machine ID
and a per-millisecond sequence, with no coordination between
generators. Read here: the README (requirements and layout) and
`IdWorker.scala` (the actual bit shifts and the clock check).

## Key claims

- Why: moving from MySQL to Cassandra, which has no ID sequence. "There is no sequential id generation facility in Cassandra, nor should there be." (README, Motivation)
- Performance target: at least 10k IDs per second per process, 2 ms response. "minimum 10k ids per second per process" (README, Performance)
- No coordination between generators. "For high availability within and across data centers, machines generating ids should not have to coordinate with each other." (README, Uncoordinated)
- Only roughly time-ordered (k-sorted), promised within 1 s. "We can guarantee, however, that the id numbers will be k-sorted" (README, (Roughly) Time Ordered)
- The bound. "within a reasonable bound (we're promising 1s, but shooting for 10's of ms)." (README, (Roughly) Time Ordered)
- Must fit in 64 bits. "For various reasons, we need to keep our ids under 64bits." (README, Compact)
- Layout: 41 bits of time, 10 bits of machine ID, 12 bits of sequence. "time - 41 bits (millisecond precision w/ a custom epoch gives us 69 years)" (README, Solution)
- "configured machine id - 10 bits - gives us up to 1024 machines" (README, Solution)
- "sequence number - 12 bits - rolls over every 4096 per machine (with protection to avoid rollover in the same ms)" (README, Solution)
- In the code the 10 machine bits are 5 bits of datacenter ID and 5 of worker ID. `private[this] val workerIdBits = 5L` and `private[this] val datacenterIdBits = 5L` (IdWorker.scala)
- The custom epoch. `val twepoch = 1288834974657L` (IdWorker.scala)
- If the clock goes backwards, it refuses to make IDs. "Snowflake protects from non-monotonic clocks, i.e. clocks that run backwards." (README, System Clock Dependency)
- It waits until the clock passes the last timestamp used. "snowflake will refuse to generate ids until a time that is after the last time we generated an id." (README, System Clock Dependency)
- In code: if the sequence wraps within one millisecond, spin to the next millisecond. `timestamp = tilNextMillis(lastTimestamp)` (IdWorker.scala, nextId)
- Use NTP, ideally in a mode that never steps backwards. "Even better, run in a mode where ntp won't move the clock backwards." (README, System Clock Dependency)

## Visuals worth redrawing

- The 64-bit layout (1 unused sign bit, 41 time, 5 datacenter, 5
  worker, 12 sequence). Drawn in `id-generation`.

## My notes

- 41 + 5 + 5 + 12 = 63 bits; the top bit stays zero so the ID is a
  positive signed 64-bit number. The bit count is from the code; the
  "positive" reading is our arithmetic.
- The announcing blog post (blog.x.com, 2010) returned 403 and a
  JavaScript shell; not cited.
