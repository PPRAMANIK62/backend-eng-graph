---
id: prisyazhynyy-coordinated-omission-2021
title: On Coordinated Omission
author: Ivan Prisyazhynyy (ScyllaDB)
url: https://www.scylladb.com/2021/04/22/on-coordinated-omission/
kind: blog
primary: false
---

## Summary

A 2021 ScyllaDB engineering post. Explains coordinated omission in two
parts: how a load generator built from a fixed pool of workers turns
into a closed system and stops sending on schedule, and how latency
must be measured from the intended send time. Shows YCSB against one
ScyllaDB core giving a p99 in microseconds or in hundreds of
milliseconds depending on flags.

## Key claims

- Definition (quoting Daniel Compton). "Coordinated omission is a term coined by Gil Tene to describe the phenomenon when the measuring system inadvertently coordinates with the system being measured in a way that avoids measuring outliers." (intro)
- Tools' defaults. "By default they do NOT respect CO." (intro)
- A thread per request is too costly. "Creating a thread is a relatively expensive operation" (Load Generation)
- A worker pool is closed. "We meant to simulate a workload for an open-model system but wound up with a closed-model system instead." (Load Generation)
- Sizing the pool from rate and latency. "Target throughput / Requests per worker = 100,000 [QPS] / 100 [QPS/Worker] = 1,000 workers" (Load Generation; 10 ms per request gives 100 per worker per second)
- Queueless schedulers skip. "By contrast, a Queueless implementation simply drops missed requests." (Load Generation)
- Measuring from the actual send is the wrong clock. "So far as the simulated system is concerned, the request was fired in time" (Measuring latency)
- The correction. "Request latency = (now() – intended_time) + service_time" (Measuring latency)
- Closed YCSB run on one core. `[READ], 99thPercentileLatency(us), 249` (How Not to YCSB)
- With a target of 8,000 ops/s the loader fell short. "It reached only 6,538 OPS." (How Not to YCSB)
- With a target rate and intended-time measurement. `[Intended-READ], 99thPercentileLatency(us), 665087` (How to YCSB Better)
- "Here we see the actual latencies of the open-model system: 665ms per operation for P99 – totally different from what we can see for a non-corrected variant." (How to YCSB Better)
- Best approach. "We found that the best implementation involves a static schedule with queuing and latency correction" (Conclusion)
- The YCSB flags: a target rate plus `measurement.interval=both`, which prints raw and "Intended-" percentiles side by side. `-p measurement.interval=both` (How to YCSB Better; a later example writes the rate as `-target 120000`)
- Throughput in the corrected run, still short of the 8,000 target. `[OVERALL], Throughput(ops/sec), 6442.053726728081` (How to YCSB Better)

## Visuals worth redrawing

- The schedule timelines: planned send points every 250 ms, one
  request taking 1 s, missed points marked.

## My notes

- Setup: ScyllaDB in Docker with `--smp 1`, YCSB workload A, one
  client thread, 10,000 records, target 8,000 ops/s. Their machine
  isn't described.
