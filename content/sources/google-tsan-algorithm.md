---
id: google-tsan-algorithm
title: ThreadSanitizerAlgorithm
author: Google sanitizers project (wiki)
url: https://github.com/google/sanitizers/wiki/ThreadSanitizerAlgorithm
kind: docs
primary: true
---

## Summary

The sanitizers team's high-level description of how ThreadSanitizer
version 2 finds races: every memory access is instrumented, each 8-byte
word of memory has a few "shadow words" recording recent accesses
(thread, clock, read or write), and a new access that conflicts with a
recorded one without a happens-before order is reported. Read as the
raw wiki page (ThreadSanitizerAlgorithm.md).

## Key claims

- Two parts, like the Clang page says. "`ThreadSanitizer` consists of two parts: instrumentation module and a run-time library." (Summary)
- Every memory access gets a call in front of it, unless provably race-free or redundant. "We instrument every memory access in the program unless it can be proven to be race-free or redundant." (Instrumentation)
- The call looks like `__tsan_read4(addr)`. "Memory accesses are simply prepended with a function call like `__tsan_read4(addr)`." (Instrumentation)
- Atomic accesses get their own callbacks. "Atomic memory accesses are instrumented using specialized `__tsan_atomic_` callbacks." (Instrumentation)
- Each aligned 8-byte word of memory maps to N shadow words, N being 2, 4 or 8. "Every aligned 8-byte word of application memory is mapped into **N** Shadow Words" (Shadow State)
- A shadow word records thread id, a scalar clock, whether it was a write, the size and offset. (Shadow Word table)
- On each access, it compares with the stored accesses and warns on a race. "If one of the old Shadow Words constitutes a race with the new Shadow Word, a warning message is printed." (State Machine)
- A race is reported when two different threads touched overlapping bytes, and one access doesn't happen-before the other (pseudocode `if not HappensBefore(old_shadow_word, new_shadow_word): ReportRace(...)`). The simplified pseudocode doesn't show the read/write check. (State Machine pseudocode)
- When the slots are full, a random old access is evicted. "If no place for insertion is found, a random Shadow Word is evicted." (State Machine)
- So there's a small chance of missing a race. "There is tiny probability to miss a data race though." (State Machine)

## Visuals worth redrawing

- The shadow word layout (TID, clock, IsWrite, size, offset) as a bar.

## My notes

- The wiki says the tool is work in progress and details may change.
- The pseudocode is simplified: it doesn't show that two reads never
  race (the IsWrite bit is stored but the check isn't written out). The
  definition of a race needing a write comes from the Go page.
