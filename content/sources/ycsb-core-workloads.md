---
id: ycsb-core-workloads
title: Core Workloads (YCSB wiki)
author: YCSB contributors
url: https://github.com/brianfrankcooper/YCSB/wiki/Core-Workloads
kind: docs
primary: true
---

## Summary

The YCSB project's wiki page listing the six core workloads A to F, with
an example application for each, and the recommended order to load and
run them so the database size stays consistent.

## Key claims

- Six core workloads. "The core workloads consist of six different workloads:" (intro)
- A: 50/50 reads and writes, e.g. a session store. "This workload has a mix of 50/50 reads and writes." (Workload A)
- B: 95/5 reads and writes, e.g. photo tagging. "This workload has a 95/5 reads/write mix." (Workload B)
- C: read only, e.g. a user profile cache. "This workload is 100% read." (Workload C)
- D: new records inserted, and the newest are the most read. "In this workload, new records are inserted, and the most recently inserted records are the most popular." (Workload D)
- E: short range scans, e.g. threaded conversations. "In this workload, short ranges of records are queried, instead of individual records." (Workload E)
- F: read-modify-write, which forces a read before each write. "This effectively forces all datastores to read the underlying record prior to accepting a write for it." (Workload F)
- A and B updates are blind writes. "Updates in this workload do not presume you read the original record first." (Workload A)
- D and E grow the database, so the recommended order is load, A, B, C, F, D, then delete and reload for E. "Workloads D and E insert records during the test run." (Running the workloads)
- Workload F's parameter file: half reads, half read-modify-writes, zipfian. "readproportion=0.5", "readmodifywriteproportion=0.5", "requestdistribution=zipfian" (workloads/workloadf in the same repository, opened alongside)

## Visuals worth redrawing

None.

## My notes

- The workload parameter files in the repo (`workloads/workloada` and so
  on) ship with `recordcount=1000`, a tiny dataset; research only, not
  cited here.
