---
id: hikaricp-pool-sizing
title: About Pool Sizing (HikariCP wiki)
author: Brett Wooldridge and HikariCP contributors
url: https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing
kind: docs
primary: true
---

## Summary

The HikariCP project's page on how big a database connection pool
should be. Its argument: a database can only run as many queries at
once as it has cores (plus some for I/O waits), so a small pool with
threads queueing for it beats a big one. It quotes the PostgreSQL
project's starting formula. Last edited in 2021.

## Key claims

- A shrunk pool, with nothing else changed, cut response times about 50x in Oracle's demo. "reducing the connection pool size alone, in the absence of any other change, decreased the response times of the application from ~100ms to ~2ms -- over 50x improvement." (10,000 Simultaneous Front-End Users)
- Oracle's demo went from 2048 connections to 96. "they showed dropping the connections from 2048 down to just 96." (Limited Resources)
- Beyond the core count, more threads only help while others are blocked on I/O. "More threads only perform better when blocking creates opportunities for executing." (Limited Resources)
- Faster disks mean fewer connections, not more. "Faster, no seeks, no rotational delays means less blocking and therefore fewer threads [closer to core count] will perform better than more threads." (Limited Resources)
- Starting formula, from the PostgreSQL project. "connections = ((core_count * 2) + effective_spindle_count)" (The Formula)
- The spindle count is zero when everything is cached. "Effective spindle count is zero if the active data set is fully cached, and approaches the actual number of spindles as the cache hit rate falls." (The Formula, quoted from PostgreSQL)
- Past the core count, extra threads cost context switches. "anything beyond this would start slowing down due to the overhead of context switching." (Limited Resources)
- Worked example: 4 cores and one disk gives 9, call it 10. (The Formula)
- The formula is a starting point to test around. "You should test your application, i.e. simulate expected load, and try different pool settings around this starting point" (The Formula)
- The axiom. "You want a small pool, saturated with threads waiting for connections." (Axiom)
- If one thread holds several connections at once, the minimum size to avoid deadlock is `T_n x (C_m - 1) + 1`; 3 threads needing 4 each gives 10. (Pool-locking)
- Fix pool-locking in the application before growing the pool. "we would urge you to examine first what can be done at the application level before enlarging the pool." (Pool-locking)
- Mixed long and short transactions are hardest; two pools can help. "In those cases, creating two pool instances can work well (eg. one for long-running jobs, another for \"realtime\" queries)." (Caveat Lector)

## Visuals worth redrawing

None (the charts are Oracle's and PostgreSQL's benchmarks, not redrawable without their data).

## My notes

- The 100 ms → 2 ms number comes from a video I didn't watch; cite it as
  the wiki reports it.
- The PostgreSQL wiki page the formula comes from wasn't opened.
