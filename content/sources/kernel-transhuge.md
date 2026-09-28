---
id: kernel-transhuge
title: Transparent Hugepage Support
author: Linux kernel developers
url: https://docs.kernel.org/admin-guide/mm/transhuge.html
kind: docs
primary: true
---

## Summary

The admin guide for THP: why huge pages speed programs up, multi-size
THP (mTHP), the `enabled` and `defrag` sysfs knobs, madvise, and the
memory-waste risk. Living doc.

## Key claims

- THP backs memory with huge pages automatically, unlike hugetlbfs. "supports the automatic promotion and demotion of page sizes and without the shortcomings of hugetlbfs." (Objective)
- hugetlbfs reserves memory up front; THP lets unused memory serve as cache instead. "Transparent Hugepage Support maximizes the usefulness of free memory if compared to the reservation approach of hugetlbfs" (Objective)
- Systems that can't waste memory should use huge pages only in madvise regions. "Embedded systems should enable hugepages only inside madvise regions to eliminate any risk of wasting any precious byte of memory" (Objective)
- THP works for anonymous memory and tmpfs/shmem only. "Currently THP only works for anonymous memory mappings and tmpfs/shmem." (Objective)
- Examples assume 4K base pages and 2M huge pages. "we presume that the basic page size is 4K and the huge page size is 2M" (Objective, note)
- First benefit: one fault per 2M region, 512 times fewer kernel entries, which only matters on first touch. "reducing the enter/exit kernel frequency by a 512 times factor" (Objective)
- That first benefit has a downside: bigger pages to clear in each fault. "requiring larger clear-page copy-page in page faults which is a potentially negative effect." (Objective)
- The lasting benefit: fewer TLB misses, and cheaper misses. "a single TLB entry will be mapping a much larger amount of virtual memory in turn reducing the number of TLB misses." (Objective)
- mTHP allocates blocks like 16K, 32K, 64K, with smaller latency spikes than 2M pages. "latency spikes are much less prominent because the size of each page isn’t as huge as the PMD-sized variant" (Objective)
- khugepaged scans memory and collapses small pages into huge ones. "there is khugepaged daemon that scans memory and collapses sequences of basic pages into huge pages" (Objective)
- An app can waste memory: touching 1 byte of a big mapping can allocate a 2M page. "in that case a 2M page might be allocated instead of a 4k page for no good." (Objective)
- Apps that benefit should madvise their critical regions. "should use madvise(MADV_HUGEPAGE) on their critical mmapped regions." (Objective)
- The top-level `enabled` knob takes always, madvise or never. "echo madvise >/sys/kernel/mm/transparent_hugepage/enabled" (Global THP controls)
- `never` everywhere still doesn't fully disable THP, because MADV_COLLAPSE ignores it. "Setting “never” in all sysfs THP controls does not disable Transparent Huge Pages globally." (Global THP controls)
- defrag=always makes an allocating app stall to reclaim and compact memory. "always means that an application requesting THP will stall on allocation failure and directly reclaim pages and compact memory" (Global THP controls)
- System-wide THP use shows in AnonHugePages in /proc/meminfo; per process, sum AnonHugePages in /proc/PID/smaps. "it is necessary to read /proc/PID/smaps and count the AnonHugePages fields for each mapping." (Monitoring usage)
- thp_fault_fallback counts faults that wanted a huge page but fell back to small pages. "falls back to using small pages." (Monitoring usage)
- defrag default is madvise. "This is the default" (Global THP controls, madvise entry)

## Visuals worth redrawing

None.

## My notes

- Page doesn't say what `enabled` defaults to; that's a build option and distros differ.
