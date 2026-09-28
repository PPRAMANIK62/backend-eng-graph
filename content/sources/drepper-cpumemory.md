---
id: drepper-cpumemory
title: What Every Programmer Should Know About Memory
author: Ulrich Drepper
url: https://www.akkadia.org/drepper/cpumemory.pdf
published: 2007-11-21
accessed: 2026-09-28
kind: paper
primary: true
---

## Summary

A 114-page paper (Version 1.0, per pdfinfo) on how RAM, CPU caches and virtual memory
work on commodity x86 hardware, and what software should do about it.
Section 3 (CPU caches) explains why caches exist, cache lines, and shows
measured cost curves by working-set size. Section 6.4.1 covers false
sharing. Old hardware (Pentium M, Pentium 4, Core 2), so its numbers show
shape, not today's values. Read as text via pdftotext; locations are
section numbers and figure numbers.

## Key claims

- Fast RAM exists but is too expensive, so machines pair a lot of DRAM with a little SRAM. "RAM as fast as current CPU cores is orders of magnitude more expensive than any dynamic RAM." (section 3, intro)
- A lot of relatively fast RAM beats a little very fast RAM once the working set exceeds the small one. "the second will always win given a working set size which exceeds the small RAM size" (section 3, intro)
- Mapping SRAM into the address space and managing it in software isn't viable: the overhead eats the gain, so the processor manages it transparently. "the gains of having fast memory would be eaten up completely by the overhead of administering the resources." (section 3, intro)
- Disk used for swap is much slower than DRAM. "Accessing those disks is orders of magnitude slower than even DRAM access." (section 3, intro)
- Caches work because programs have temporal and spatial locality. "This is possible because program code and data has temporal and spatial locality." (section 3, intro)
- Knowing that locality exists is the basis of CPU caches. "Realizing that locality exists is key to the concept of CPU caches as we use them today." (section 3, intro)
- Caches store lines of contiguous words, now usually 64 bytes. "In early caches these lines were 32 bytes long; nowadays the norm is 64 bytes." (section 3.2)
- A line's address is the memory address with the offset bits cleared; for 64-byte lines that's the low 6 bits, which give the offset in the line. "For a 64 byte cache line this means the low 6 bits are zeroed. The discarded bits are used as the offset into the cache line." (section 3.2)
- MESI is named for the four states a line can be in: Modified, Exclusive, Shared, Invalid. "The protocol is named after the four states a cache line can be in when using the MESI protocol" (section 3.3.4)
- A whole line is loaded on access. "When memory content is needed by the processor the entire cache line is loaded into the L1d." (section 3.2)
- Intel's listed costs for a Pentium M: register ≤1 cycle, L1d ~3, L2 ~14, main memory ~240. "These are the numbers Intel lists for a Pentium M" (section 3.2, table)
- Measured cost steps up at each cache size (Figure 3.4, random writes, a processor with L1d and L2 but no L3): below 10 cycles per element in L1d, around 28 from L2, 480+ from main memory. "Once the L2 is not sufficient anymore the times jump to 480 cycles and more." (section 3.2, Figure 3.4)
- The gap between levels means orders of magnitude, not percent. "we are talking about orders-of-magnitude improvements which are sometimes possible." (section 3.2)
- On sequential access the CPU prefetches the next cache line, so it's partly loaded before it's needed. "In anticipation of using consecutive memory regions, the processor prefetches the next cache line." (section 3.3.2, Figure 3.10)
- With good prefetching a sequential walk past L2 costs about 9 cycles per element instead of the 200+ of a main memory access. "Only with effective prefetching is it possible for the processor to keep the access times as low as 9 cycles." (section 3.3.2)
- Putting each list element on its own page shows a spike when the TLB overflows, separate from the cache steps. "This is when the TLB cache overflows." (section 3.3.2, Figure 3.12)
- MESI is the most important coherency protocol. "The most important is MESI" (section 3.3.4)
- Cache coherency across cores uses the MESI protocol (section 3.3.4, Figure 3.18); a write needs the line in exclusive state, so writes from several cores to one line send many RFO messages. "This means that a lot of RFO messages are sent, in the worst case one for each write access." (section 6.4.1)
- This hurts even when threads write different variables that share a line. "The problem is also visible, though, when all the threads are using different memory locations and are supposedly independent." (section 6.4.1)
- Figure 6.10 measures it: threads each incrementing a location 500 million times, same line vs separate lines. "Figure 6.10 shows the results of this “false sharing”." (section 6.4.1)
- Overhead of one shared line vs a line per thread was 390%, 734% and 1,147% as threads were added. "is 390%, 734%, and 1,147% respectively." (section 6.4.1, Figure 6.10)
- More cores make it worse. "Each additional processor will just cause more delays." (section 6.4.1)
- Fix by separating written variables from read-mostly ones and aligning so no line is shared. "it is possible to guarantee that no false sharing happens." (section 6.4.1)

## Visuals worth redrawing

- Figure 3.4: cycles per element vs working-set size, three plateaus (L1d, L2, RAM). Our experiment 0001 draws the same shape on the author's i5-13500H laptop.
- Figure 3.12: the TLB spike when each element sits on its own page.
- Figure 6.10: false sharing overhead as thread count grows.

## My notes

- Numbers are from 2007 CPUs. Use the shape; use our own experiment for numbers.
- The paper's Linux-only stance is stated up front.
