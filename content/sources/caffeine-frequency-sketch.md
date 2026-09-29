---
id: caffeine-frequency-sketch
title: FrequencySketch.java (Caffeine source)
author: Ben Manes
url: https://github.com/ben-manes/caffeine/blob/master/caffeine/src/main/java/com/github/benmanes/caffeine/cache/FrequencySketch.java
kind: code
primary: true
---

## Summary

Caffeine's count-min sketch for W-TinyLFU. Read from master when the
latest release was v3.3.0. The class comment explains the sizing, the
cache-line layout and the aging (reset).

## Key claims

- 4-bit counters, maximum 15, with periodic halving. "The maximum frequency of an element is limited to 15 (4-bits) and an aging process periodically halves the popularity of all elements." (class Javadoc)
- It's a count-min sketch feeding TinyLFU. "This class maintains a 4-bit CountMinSketch [1] with periodic aging to provide the popularity history for the TinyLfu admission policy [2]." (class comment)
- Depth 4; table length = cache maximum rounded up to a power of two. "A fixed depth of four balances the accuracy and cost, resulting in a width of four times the length of the array." (class comment)
- Stated confidence and error. "This configuration results in a confidence of 93.75% and an error bound of e / width." (class comment)
- An item's four counters sit in one 64-byte block, one L1 cache line. "To improve hardware efficiency, an item's counters are constrained to a 64-byte block, which is the size of an L1 cache line." (class comment)
- So a lookup usually costs one memory access. "so the typical cost is only one memory access." (class comment)
- Aging is TinyLFU's reset: halve all counters. "This is referred to as the reset operation by TinyLfu and keeps the sketch fresh by dividing all counters by two and subtracting based on the number of odd counters found." (class comment)
- The sample size is 10 times the maximum size. "int sample = (int) Math.min(10L * maximum, Integer.MAX_VALUE);" (ensureCapacity)
- Increment bumps all four counters (each saturating at 15), not just the smallest. "incrementAt(slot0, index0)" (increment)

## Visuals worth redrawing

- One 64-byte block split into four 16-byte segments, one counter per
  segment.

## My notes

- Unlike the TinyLFU paper's counting Bloom filter, this doesn't use
  conservative (minimal) increment.
