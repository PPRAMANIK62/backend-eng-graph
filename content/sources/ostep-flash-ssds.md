---
id: ostep-flash-ssds
title: "Flash-based SSDs (Operating Systems: Three Easy Pieces, chapter 44)"
author: Remzi H. Arpaci-Dusseau, Andrea C. Arpaci-Dusseau
url: https://pages.cs.wisc.edu/~remzi/OSTEP/file-ssd.pdf
kind: book
primary: false
---

## Summary

Textbook chapter (OSTEP v1.10, © 2008–23) that builds a flash translation
layer from raw NAND: pages and erase blocks, why in-place overwrite is
terrible, the log-structured FTL, garbage collection, mapping table size,
wear leveling, and the TRIM command.

## Key claims

- SLC stores 1 bit per cell, MLC 2, TLC 3; SLC is faster and pricier. "There is even triple-level cell (TLC) flash, which encodes 3 bits per cell." (§44.1)
- Flash is organized in erase blocks of 128 KB or 256 KB made of pages of a few KB. "called erase blocks), which are typically of size 128 KB or 256 KB, and pages, which are a few KB in size (e.g., 4KB)." (§44.2)
- To write a page you must first erase its whole block. "Before writing to a page within a flash, the nature of the device requires that you first erase the entire block the page lies within." (§44.3)
- Erase destroys the contents of the whole block. "Erase, importantly, destroys the contents of the block" (§44.3)
- Once programmed, a page can only be changed by erasing its block. "Once a page has been programmed, the only way to change its contents is to erase the entire block" (§44.3)
- Rough raw latencies (Figure 44.2), µs: SLC read 25, program 200–300, erase 1500–2000; MLC 50, 600–900, ~3000; TLC ~75, ~900–1350, ~4500. (Figure 44.2, from popular press [V12])
- Reads take tens of µs, programs hundreds, erases a few ms. "erases are quite expensive, taking a few milliseconds typically." (§44.4)
- Blocks wear out with program/erase cycles; MLC rated ~10,000, SLC ~100,000, though real lifetimes seem longer. "Manufacturers rate MLC-based blocks as having a 10,000 P/E (Program/Erase) cycle lifetime" (§44.4)
- Reading or programming can flip bits in neighbouring pages (disturbs). "such bit flips are known as read disturbs or program disturbs" (§44.4)
- The SSD's job is to present the standard block interface on top of flash. "The task of the flash-based SSD is to provide that standard block interface atop the raw flash chips inside it." (§44.5)
- An SSD has flash chips, some volatile memory (e.g. SRAM) for caching and mapping tables, and control logic. "An SSD also contains some amount of volatile (i.e., non-persistent) memory (e.g., SRAM)" (§44.5)
- The FTL turns logical block reads and writes into flash reads, erases and programs. "The flash translation layer, or FTL, provides exactly this functionality." (§44.5)
- All modern SSDs use many flash chips in parallel. "all modern SSDs use multiple chips internally to obtain higher performance." (§44.5)
- Write amplification = bytes the FTL writes to flash ÷ bytes the client wrote. "write amplification, which is defined as the total write traffic (in bytes) issued to the flash chips by the FTL divided by the total write traffic (in bytes) issued by the client to the SSD." (§44.5)
- Wear leveling spreads writes so blocks wear out at about the same time. "doing so is called wear leveling" (§44.5)
- FTLs program pages in order within a block to limit disturbs. "FTLs will commonly program pages within an erased block in order, from low page to high page." (§44.5)
- Direct-mapped FTL (overwrite in place) means read block, erase, program: severe write amplification. "The end result is severe write amplification" (§44.6)
- Most FTLs are log-structured: append each write to the next free page and record it in a mapping table. "most FTLs today are log structured" (§44.7)
- The mapping table is in memory and persisted in some form on the device. "the device keeps a mapping table (in its memory, and persistent, in some form, on the device)" (§44.7)
- Overwrites leave garbage pages; GC reads live pages, writes them to the log, erases the block. "find a block that contains one or more garbage pages, read in the live (non-garbage) pages from that block, write out those live pages to the log, and (finally) reclaim the entire block" (§44.8)
- The ideal GC victim is a block of only dead pages: no copying needed. "The ideal candidate for reclamation is a block that consists of only dead pages" (§44.8)
- Copying live data during GC raises write amplification. "excessive garbage collection drives up write amplification and lowers performance." (§44.7/44.8)
- TRIM tells the device a range was deleted so the FTL can drop it and reclaim the space in GC. "The trim operation takes an address (and possibly a length) and simply informs the device that the block(s) specified by the address (and length) have been deleted" (§44.8, Aside)
- Overprovisioning (extra hidden flash) lets cleaning be delayed and done in the background. "To reduce GC costs, some SSDs overprovision the device" (§44.8)
- A page-level map for 1 TB at 4 bytes per 4 KB page needs 1 GB of memory. "a single 4-byte entry per 4-KB page results in 1 GB of memory needed by the device, just for these mappings!" (§44.9)
- One fix is to cache only the active part of the map; misses cost an extra flash read. "each access will minimally require an extra flash read to first bring in the missing mapping" (§44.9, Page Mapping Plus Caching)
- Summary: blocks are 128KB–2MB. "Blocks are large (128KB–2MB) and contain many pages" (§44.12)
- (added in review) Wear out: each erase/program leaves extra charge until 0 and 1 can't be told apart. "as that extra charge builds up, it becomes increasingly difficult to differentiate between a 0 and a 1." (§44.4)
- The log-structured FTL example writes logical blocks 100, 101, 2000 and 2001. "Write(2000) with contents b1" (§44.7; added in figure review)

## Visuals worth redrawing

- Figure 44.3: an SSD as interface logic, controller, memory and flash chips.
- The log-structured FTL example: four logical writes, the mapping table, then overwrites of 100 and 101 creating garbage in block 0, then GC. (§44.7–44.8)

## My notes

- Latency table is from "popular press" and older flash; don't present it
  as current. Use as orders of magnitude only.
