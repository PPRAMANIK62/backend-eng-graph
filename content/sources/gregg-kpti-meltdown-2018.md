---
id: gregg-kpti-meltdown-2018
title: KPTI/KAISER Meltdown Initial Performance Regressions
author: Brendan Gregg
url: https://www.brendangregg.com/blog/2018-02-09/kpti-kaiser-meltdown-performance.html
published: 2018-02-09
accessed: 2026-09-28
kind: blog
primary: false
---

## Summary

Netflix performance engineer measures the cost of the KPTI Meltdown fix on
Linux 4.14 on AWS EC2, with a microbenchmark that varies syscall rate and
working set size. Shows the cost depends on syscall rate, context
switches, page faults, working set and cache patterns, and that PCID and
huge pages cut it sharply.

## Key claims

- Tested on Linux 4.14.11 and 4.14.12. "Much of my testing was on Linux 4.14.11 and 4.14.12 a month ago" (intro)
- The cost scales with syscall rate. "At 50k syscalls/sec per CPU the overhead may be 2%, and climbs as the syscall rate increases." (KPTI Factors, 1. Syscall rate)
- Working sets over 10 MB add TLB-flush cost. "more than 10 Mbytes will cost additional overhead due to TLB flushing." (KPTI Factors)
- Programs with many syscalls pay most: proxies, databases, lots of small I/O. "Applications that have high syscall rates include proxies, databases, and others that do lots of tiny I/O." (KPTI Factors)
- Many Netflix services were below 10k syscalls/s per CPU, so the cost was expected to be negligible (<0.5%). "Many services at Netflix are below 10k syscalls/sec per CPU" (KPTI Factors)
- Worked example at 5k syscalls/s/CPU with a 100 MB working set: 2.1% without PCID, about 0.5% with PCID (Linux 4.14), a 3.0% gain with huge pages. "On recent LTS Linux (4.4 or 4.9) with KPTI (or KAISER) patches, the performance overhead would be about 2.1%." (Working Set Size)
- The 2.1% figure is for the 4.4 and 4.9 LTS kernels; 4.14 has PCID support. "Linux 4.14 has pcid support, so that overhead becomes about 0.5%." (Working Set Size)
- Linux 4.14 introduced full PCID support. "Linux 4.14 introduced full pcid support" (Working Set Size)
- In the worst microbenchmark point, overhead passed 800% without PCID. "this is the first point on the graph where the overhead was over 800%" (section 3, Working Set Size, discussion of the no-PCID graph)

## Visuals worth redrawing

- The overhead vs syscall rate curves for different working set sizes
  (log scale), with and without PCID.

## My notes

- 2018, Linux 4.14, EC2. Newer CPUs aren't affected by Meltdown and may run
  without PTI; not covered by this post.
