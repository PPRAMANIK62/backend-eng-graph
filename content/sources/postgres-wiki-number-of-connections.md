---
id: postgres-wiki-number-of-connections
title: Number Of Database Connections
author: PostgreSQL wiki contributors
url: https://wiki.postgresql.org/wiki/Number_Of_Database_Connections
kind: docs
primary: true
---

## Summary

A community wiki page (last edited in the Postgres 9.2 era) on why fewer
connections often give more throughput, why Postgres has no built-in
pooler, and the (cores × 2) + spindles starting point.

## Key claims

- Throughput rises until resources saturate, then falls. "Once all of the resources are in use, you won't push any more work through by having more connections competing for the resources." (Summary)
- Queuing work beats running it all at once. "Pg will usually complete the same 10,000 transactions faster by doing them 5, 10 or 20 at a time than by doing them 500 at a time." (Summary)
- No built-in pooler, on purpose. "The decision not to include a connection pooler inside the PostgreSQL server itself has been taken deliberately and with good reason" (The Need for an External Pool)
- Reasons past the knee: disk contention, work_mem RAM per connection, lock contention, context switches, cache line contention, structures scaling with max_connections. (Reasons for Performance Reduction Past the "Knee")
- Starting formula. "the number of active connections should be somewhere near ((core_count * 2) + effective_spindle_count)." (How to Find the Optimal Database Connection Pool Size)
- Keep max_connections a little above the pool for maintenance. "You should always make max_connections a bit bigger than the number of connections you enable in your connection pool." (How to Find...)

## Visuals worth redrawing

- The throughput vs connections "knee" (described, not drawn, on the
  page).

## My notes

- Old page; says no analysis of the formula on SSDs. Freund's 2020 post
  is the newer view.
