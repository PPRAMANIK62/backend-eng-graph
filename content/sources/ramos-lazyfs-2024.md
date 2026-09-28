---
id: ramos-lazyfs-2024
title: "When Amnesia Strikes: Understanding and Reproducing Data Loss Bugs with Fault Injection"
author: Maria Ramos, João Azevedo, Kyle Kingsbury, José Pereira, Tânia Esteves, Ricardo Macedo, João Paulo
url: https://www.vldb.org/pvldb/vol17/p3017-ramos.pdf
kind: paper
primary: true
---

## Summary

The LazyFS paper (PVLDB 17(11), 2024). Explains how LazyFS simulates
losing unsynced data and torn writes, then uses it on seven systems to
reproduce known data-loss bugs and find new ones. States its own limits
clearly, including that it can't test whether metadata is durable.

## Key claims

- What LazyFS does. "Our tool simulates persistence properties of POSIX file systems (e.g., operations ordering and atomicity) and enables users to inject lost and torn write faults" (Abstract)
- Systems studied: PostgreSQL, etcd, ZooKeeper, Redis, LevelDB, PebblesDB, Lightning Network. "We use LazyFS to study seven important systems" (Abstract)
- Results: reproduced five known bugs, helped reproduce seven ambiguous ones, found eight new ones leading to data loss, corruption and unavailability. "LazyFS is used to find eight new bugs" (Abstract)
- Design: a FUSE passthrough layer over a real file system (e.g. ext4), with its own page cache that never flushes in the background. "it does not perform background flushes to the next I/O layer." (§3.2)
- Data moves to the backend only on a sync call. "Data is flushed to the file system backend ... only when the SUT explicitly issues a synchronization system call (e.g., fsync or fdatasync)" (§3.2)
- Programs that bypass the page cache with O_DIRECT are out of scope. "Solutions that bypass the OS cache (e.g., use the O_DIRECT flag [32]) are out of scope." (§3.2, footnote)
- Limitation: metadata durability isn't tested. "it does not allow assessing the durability of metadata (e.g., whether updates to inodes are flushed correctly to disk)." (Limitations, "Metadata fault injection")
- It's a reproduction tool, not an automatic bug finder like ALICE or Jepsen; they complement each other. "we do not claim it to be a bug exploration tool such as ALICE [36] or Jepsen [16]" (Limitations)
- Deterministic workloads give deterministic reproduction. (Limitations, "Workloads determinism")

## Visuals worth redrawing

- Figure 3: program, LazyFS page cache, backend file system; which writes reach the backend and when.

## My notes

- Author list includes Kyle Kingsbury with affiliation "Jepsen" (title page).
- The metadata limitation matters for testing a missing directory fsync (see `atomic-rename`).
