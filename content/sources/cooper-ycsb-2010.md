---
id: cooper-ycsb-2010
title: Benchmarking Cloud Serving Systems with YCSB
author: Brian F. Cooper, Adam Silberstein, Erwin Tam, Raghu Ramakrishnan, Russell Sears
url: https://courses.cs.duke.edu/fall13/cps296.4/838-CloudPapers/ycsb.pdf
kind: paper
primary: true
---

## Summary

SoCC 2010 paper from Yahoo! Research that introduced the Yahoo! Cloud
Serving Benchmark. Defines the core workloads, the request distributions
(uniform, zipfian, latest), the latency-versus-throughput method, and
runs Cassandra, HBase, PNUTS and sharded MySQL on the same hardware.
Opened from a Duke course mirror of the paper; the ACM copy returned 403.

## Key claims

- Performance tier: raise offered throughput and record latency until throughput stops rising. "measuring latency as we increase throughput, until the point at which the database system is saturated and throughput stops increasing." (§3.1)
- The client takes a target throughput and reports latency. "The YCSB Client allows the user to define the offered throughput as a command line parameter, and reports the resulting latency" (§3.1)
- Zipfian: a few records very popular, most not. "some records will be extremely popular (the head of the distribution) while most records will be unpopular (the tail )." (§4.1)
- Latest: like zipfian, but the newest records are the popular ones. "Like the Zipfian distribution, except that the most recently inserted records are in the head of the distribution." (§4.1)
- Core workloads in Table 2: A update heavy (50% read, 50% update, zipfian), B read heavy (95/5, zipfian), C read only (zipfian), D read latest (95% read, 5% insert, latest), E short ranges (95% scan, 5% insert, zipfian start and uniform length). (Table 2)
- Loading takes longer than the runs; each run was 30 minutes. "Loading the database is likely to take longer than any individual experiment." (§4.2)
- Writes can change later results, so reloading may be needed. "If database writes are likely to impact the operation of other workloads (e.g., by fragmenting the on-disk representation) it may be necessary to re-load the database." (§4.2)
- The client reports average, 95th and 99th percentile latency. "measurements and reports average, 95th and 99th percentile latencies, and either a histogram or time series of the latencies." (§5)
- Durability setting differed per system and they said so: most synced every update, HBase didn't. "For Cassandra, sharded MySQL and PNUTS, all updates were synched to disk before returning to the client." (§6.1)
- HBase trades durability for speed. "HBase does not sync to disk, but relies on in-memory replication across multiple servers for durability" (§6.1)
- Same storage for all: one RAID-10 array and no dedicated log disk. "to ensure a fair comparison, we configured all systems with a single RAID-10 array and no dedicated log disk." (§6.1)
- Six server-class machines, each with 8 GB of RAM and a 6-disk RAID-10 array. "dual 64-bit quad core 2.5 GHz Intel Xeon CPUs, 8 GB of RAM, 6 disk RAID-10 array and gigabit ethernet" (§6.1)
- Data per server bigger than RAM on purpose. "Each server thus had an average of 20 GB of data, more than it could cache entirely in RAM." (§6.1)
- Compactions and flushes affect HBase and were applied periodically. "We periodically applied these operations during our experiments" (§6.1)
- Tuning help from the developers of the systems compared. "we received extensive tuning assistance from members of the development teams of the Cassandra, HBase and PNUTS systems." (§6.1)

## Visuals worth redrawing

- Figure 1: uniform, zipfian and latest distributions as popularity
  against insertion order.

## My notes

- Workload F (read-modify-write) isn't in the paper's Table 2; it's on
  the YCSB wiki (`ycsb-core-workloads`).
