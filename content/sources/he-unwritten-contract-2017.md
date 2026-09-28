---
id: he-unwritten-contract-2017
title: The Unwritten Contract of Solid State Drives
author: Jun He, Sudarsun Kannan, Andrea C. Arpaci-Dusseau, Remzi H. Arpaci-Dusseau
url: https://pages.cs.wisc.edu/~jhe/eurosys17-he.pdf
kind: paper
primary: true
---

## Summary

EuroSys 2017 paper. States five rules software should follow to get good
performance from SSDs, then checks how real applications (LevelDB,
RocksDB, SQLite and others) on ext4, XFS and F2FS follow or break them,
using traces and a detailed SSD simulator (WiscSee).

## Key claims

- Rule 1, Request Scale: issue large requests or many at once, to use the drive's internal parallelism. "SSD clients should issue large data requests or multiple concurrent requests." (§3.1)
- Rule 2, Locality: access with locality to avoid misses in the FTL's translation cache. "to reduce translation-cache misses in FTLs, SSDs should be accessed with locality (Locality rule)." (§1)
- Rule 3, Aligned Sequentiality: start writing at a block boundary and write sequentially, for hybrid-mapping FTLs. "clients of SSDs should start writing at the aligned beginning of a block boundary and write sequentially" (§1)
- Rule 4, Grouping By Death Time: write data that will die together together, to cut GC cost. "SSD clients should group writes by the likely death time of data" (§1)
- Rule 5, Uniform Data Lifetime: to cut wear-leveling cost. "to reduce the cost of wear-leveling, SSD clients should create data with similar lifetimes" (§1)
- Death time grouping is often confused with hot/cold separation. "The rule of grouping by death time is often misunderstood as separating hot and cold data" (§3.4)
- Locality depends most on the filesystem. "We find that locality is most strongly impacted by the file system" (§1)
- Applications separate data by death time, but filesystems and FTLs don't always keep it separated. "file systems and FTLs do not always maintain this separation." (§1)
- Frequent barriers limit performance. "frequent barriers in both applications and file systems limit performance" (§1)
- Random vs sequential is the wrong way to classify SSD workloads; "random writes considered harmful" is a myth. "irrelevant workload classifications can lead to oversimplified myths about SSDs (e.g., random writes considered harmful" (§1)
- F2FS delays trimming, which raises GC costs. "F2FS delays trimming data, which subsequently increases SSD space utilization, leading to higher garbage collection costs" (§1)
- Traditional ext4 and XFS often do better on SSDs than log-structured F2FS. "these traditional file systems continue to work well on SSDs, often better than the log-structured F2FS." (§5.6 Discussion)
- Tested on Linux 4.5.4 with ext4, XFS and F2FS. (§4)

## Visuals worth redrawing

- Figure 1: aligned sequentiality and a violation of it (writes must be
  programmed low to high within a block).
- Figure 2: grouping by order vs grouping by space.

## My notes

- Results come from a simulator plus traces, not from measuring real
  drives' internals. Linux 4.5 is from 2016.
