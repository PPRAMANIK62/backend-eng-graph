---
id: freund-connection-scalability-2020
title: Analyzing the Limits of Connection Scalability in Postgres
author: Andres Freund
url: https://techcommunity.microsoft.com/blog/adforpostgresql/analyzing-the-limits-of-connection-scalability-in-postgres/1757266
kind: blog
primary: true
---

## Summary

A Postgres core developer's 2020 analysis of why Postgres handles many
connections badly, measured on a 2 × Xeon Gold 5215 workstation with
Linux 5.8. Memory per connection turns out to be smaller than people
think; the real limit was building snapshots, which gets slower with
every established connection, even idle ones. He chose to fix that
first, for Postgres 14.

## Key claims

- Postgres doesn't handle large numbers of connections well. "Postgres does not handle large numbers of connections particularly well." (opening)
- New connections cost TLS, latency and Postgres work, so apps keep pools. "Given the cost of establishing a new database connection (TLS, latency, and Postgres costs, in that order)" (Why connection scalability is important)
- To actually cut server connections, poolers must use transaction or statement mode, which rules out features. "However, doing so precludes the use of many useful database features like prepared statements, temporary tables, …" (Why connection scalability is important)
- Latency and app processing leave connections idle most of the time. "Network latency and application processing times will often result in individual database connections being idle the majority of the time" (Why connection scalability is important)
- Process per connection. "When a new connection is established, Postgres' supervisor process creates a dedicated process to handle that connection going forward." (Constant connection overhead)
- Per-connection memory is hard to measure and often under 2 MiB with huge pages. "the memory overhead of each connection is below 2 MiB." (Constant connection overhead)
- Long-lived connections grow catalog caches; after touching 100k tables, 593 MB in one backend's CacheMemoryContext. (Cache bloat, table)
- work_mem limits each sort or hash, not the query. "The work_mem setting does not control the memory used by a query as a whole, but only of individual parts of a query" (Query memory usage)
- A high max_connections alone costs little; established connections are the problem. "The real issue is that currently Postgres does not scale well to having a large number of established connections, even if nearly all connections are idle." (Snapshot scalability)
- One active connection slows by more than 2x with many idle ones. "The fact that a single active connection slows down by more than 2x due to concurrent idle connections points to a very clear issue." (Cause)
- The bottleneck is GetSnapshotData, run at least once per transaction. "These snapshots are built very frequently (at least once per transaction, very commonly more often)." (Cause)
- Each query needs a context switch to its backend process. "Whenever a query is received by a backend process, the kernel needs to perform a context switch to that process." (Connection model & context switches)
- Threads alone wouldn't fix it; a model with few processes serving many connections would, and is a huge project. "while some of the context switches may get cheaper, context switches still are the major limit." (Connection model & context switches)
- The test machine: a two-socket Xeon workstation on Linux 5.8. "2x xeon gold 5215, 192GiB of RAM, kernel 5.8.5, debian Sid" (footnote 1)
- The fixes for the snapshot problem went into Postgres 14. "go into detail about the identified issues and how we have addressed them in Postgres 14." (opening)
- Huge pages matter most for per-connection memory, in many workloads. "in many workloads, and with the right configuration—most importantly, using huge_pages —the memory overhead of each connection is below 2 MiB." (Constant connection overhead)
- Switching the connection model is a huge project. "As outlined, that is a huge project / fundamental paradigm shift." (Conclusion)
- The idle-connection counts in the snapshot test are in the charts, not the text. (Snapshot scalability)

## Visuals worth redrawing

- Throughput of active connections as idle connections grow (charts
  in the post; numbers only readable from the images, not used).

## My notes

- Text read from the page's embedded JSON (WebFetch returned an empty
  page).
