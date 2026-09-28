---
id: openjdk-zgc
title: "ZGC: The Z Garbage Collector (OpenJDK wiki)"
author: OpenJDK ZGC project
url: https://wiki.openjdk.org/display/zgc/Main
published: 2026-07-02
accessed: 2026-09-28
kind: docs
primary: true
---

## Summary

The ZGC project's main page: what ZGC is, platforms, tuning (heap size,
threads, uncommit, large pages), and a per-JDK change log. "last updated
by Erik Österlund on Jul 02, 2026".

## Key claims

- Pauses stay under a millisecond; heavy work runs concurrently. "ZGC performs all expensive work concurrently, without stopping the execution of application threads for more than a millisecond ." (intro)
- Pause times don't grow with heap size. "Pause times are independent of the heap size that is being used." (intro)
- Heaps from a few hundred MB to 16 TB. "ZGC works well with heap sizes from a few hundred megabytes to 16TB ." (intro)
- Experimental in JDK 11, production-ready in JDK 15, generational in JDK 21. "In JDK 21 was reimplemented to support generations." (intro)
- It is concurrent, region-based, compacting, NUMA-aware, and uses colored pointers and load barriers. "At a glance, ZGC is: Concurrent Region-based Compacting NUMA-aware Using colored pointers Using load barriers" (intro)
- Generational became the default in JDK 23 (JEP 474); non-generational removed in JDK 24 (JEP 490). "Removed the non-generational mode of ZGC ( JEP 490 )" (Change Log, JDK 24)
- The main tuning knob is max heap size, with headroom for allocation while the GC runs. "The main tuning knob is to increase the maximum heap size." (Configuration & Tuning)
- For low latency, keep CPU under about 70%. "Ideally, your system should never have more than 70% CPU utilization." (Setting Concurrent GC Threads)
- Large pages generally help ZGC. "Configuring ZGC to use large pages will generally yield better performance (in terms of throughput, latency and start up time)" (Using Large Pages)
- On Linux x86, huge pages are 2 MB. "On Linux x86, large pages (also known as "huge pages") have a size of 2MB." (Enabling Large Pages On Linux)

## Visuals worth redrawing

None.

## My notes

- Pairs with JEP 439 (not used here) for the Cassandra numbers.
