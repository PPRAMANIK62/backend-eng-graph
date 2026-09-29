---
id: lwn-postgres-process-model-2023
title: PostgreSQL reconsiders its process-based model
author: Jonathan Corbet
url: https://lwn.net/Articles/934940/
kind: blog
primary: false
---

## Summary

LWN's 2023 report on a pgsql-hackers proposal by Heikki Linnakangas to
move Postgres from one process per connection to threads, and the
split reaction to it.

## Key claims

- Postgres runs as many cooperating processes, one per client, talking through shared memory. "A PostgreSQL instance runs as a large set of cooperating processes, including one for each connected client." (opening)
- The proposal: move to a threaded model. "posted a proposal to move PostgreSQL to a threaded model." (A proposal)
- It can't be done in one release. "surely cannot be done fully in one release" (A proposal)
- Andres Freund's reason: cross-process context switches and TLB misses. "The overhead of cross-process context switches is inherently higher than switching between threads in the same process" (A proposal, quoting Freund)
- Tom Lane opposed it. "I think this will be a disaster." (A proposal, quoting Lane)
- Worry about losing process isolation. "Others worried that losing the isolation provided by separate processes could make the system less robust overall." (A proposal)
- About 2,000 global variables would need handling. "there are about 2,000 such variables currently used by the PostgreSQL server." (How to get there)
- Lane expected too much code to break. "There is far too much code that will get broken" (A proposal, quoting Lane)
- Freund: with many connections, TLB misses cost a lot. "Once you have a significant number of connections we end up spending a *lot* of time in TLB misses" (A proposal, quoting Freund)

## Visuals worth redrawing

None.

## My notes

- A news report of a debate, not a decision. As of Postgres 18 the
  manual still describes a process per connection.
