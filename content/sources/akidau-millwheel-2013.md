---
id: akidau-millwheel-2013
title: "MillWheel: Fault-Tolerant Stream Processing at Internet Scale"
author: Tyler Akidau, Alex Balikov, Kaya Bekiroğlu, Slava Chernyak, Josh Haberman, Reuven Lax, Sam McVeety, Daniel Mills, Paul Nordstrom, Sam Whittle (Google)
url: https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/41378.pdf
kind: paper
primary: true
---

## Summary

The VLDB 2013 paper on Google's MillWheel stream processor. Users write
code for nodes in a computation graph; the system runs it per key,
keeps persistent state, delivers records exactly once, and computes a
low watermark that tells each stage how far event time has certainly
progressed. The running example is Zeitgeist, which spots spikes and
dips in search queries. The paper coined the watermark as used in
stream processing today.

## Key claims

- What MillWheel is. "MillWheel is a framework for building low-latency data-processing applications that is widely used at Google." (abstract)
- Users give a graph and per-node code; the system handles state and the flow of records. "Users specify a directed computation graph and application code for individual nodes, and the system manages persistent state and the continuous flow of records" (abstract)
- Requirements include handling out-of-order data and a monotonic low watermark. "Out-of-order data should be handled gracefully by the system." and "A monotonically increasing low watermark of data timestamps should be computed by the system." (section 2)
- Exactly-once delivery is a requirement. "The system should provide exactly-once delivery of records." (section 2)
- Arrival time doesn't match generation time, so a dip could be real or just delayed data. "data arrival time does not strictly correspond to its generation time (the search time, in this case), so it is important to be able to distinguish whether a flurry of expected Arabic queries at t = 1296167641 is simply delayed on the wire, or actually not there." (section 2)
- The low watermark says all data up to a timestamp has arrived. "which indicates that all data up to a given timestamp has been received." (section 2)
- Code runs in the context of one key and sees only that key's state. "Computation code is run in the context of a specific key and is only granted access to state for that specific key." (section 3.3, Keys)
- Recursive definition of the low watermark. "min(oldest work of A, low watermark of C : C outputs to A)" (section 3.5)
- Oldest work means the oldest unfinished record. "let the oldest work of A be a timestamp corresponding to the oldest unfinished (in-flight, stored, or pending-delivery) record in A." (section 3.5)
- Injectors seed watermarks from outside systems, so expect a few late records. "Measurement of pending work in external systems is often an estimate, so in practice, computations should expect a small rate of late records – records behind the low watermark – from such systems." (section 3.5)
- Zeitgeist drops late records and counts them: about 0.001%. "Zeitgeist deals with this by dropping such data, while keeping track of how much data was dropped (empirically around 0.001% of records)." (section 3.5)
- Other pipelines correct their aggregates instead. "Other pipelines retroactively correct their aggregates if late records arrive." (section 3.5)
- The watermark stays monotonic even with late data. "the system guarantees that a computation’s low watermark is monotonic even in the face of late data." (section 3.5)
- Timers fire on wall time or on the low watermark. "Timers are per-key programmatic hooks that trigger at a specific wall time or low watermark value." (section 3.6)
- An injector reading log files can use the oldest unfinished file's creation time. "it could publish a low watermark value that corresponded to the minimum file creation time among its unfinished files" (section 5.2)
- For late records the application chooses: discard or update the aggregate. "the user’s application code chooses whether to discard the record or incorporate it into an update of an existing aggregate." (section 5.2)
- Measured single-stage latency on 200 CPUs, without strong productions and exactly-once: median 3.6 ms, p95 30 ms. "Median record delay is 3.6 milliseconds and 95th-percentile latency is 30 milliseconds" (section 8.1)
- With both enabled: median 33.7 ms, p95 93.8 ms. "median latency jumps up to 33.7 milliseconds and 95th-percentile latency to 93.8 milliseconds." (section 8.1)
- Idempotent computations can switch both off to cut latency. "This is a succinct demonstration of how idempotent computations can decrease their latency by disabling these two features." (section 8.1)
- Watermark lag bounds the freshness of watermark-driven aggregates. "the low watermark’s lag behind real time bounds the freshness of these aggregates." (section 8.2)
- Measured watermark lag on a three-stage pipeline on 200 CPUs: 1.8 s at the first stage, under 200 ms more per stage. "the first stage’s watermark lagged real time by 1.8 seconds, however, for subsequent stages, the lag increased" and "per stage by less than 200ms." (section 8.2)

## Visuals worth redrawing

- Figure 6: pending vs completed records on a timestamp axis, with the
  low watermark at the oldest pending record.

## My notes

- The latency numbers are from Google's 2013 hardware and one simple
  pipeline; quote them as that, not as typical.
