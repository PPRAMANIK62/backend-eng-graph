---
id: chipsandcheese-zen5-9950x
title: "AMD's Ryzen 9950X: Zen 5 on Desktop"
author: Chester Lam (Chips and Cheese)
url: https://chipsandcheese.com/p/amds-ryzen-9950x-zen-5-on-desktop
kind: blog
primary: false
---

## Summary

An independent deep look at AMD's Zen 5 desktop CPU, including its cache
setup and memory latency with DDR5-6000. Useful as a current, measured
data point next to the old tables: DRAM latency on a 2024 desktop about
matches a Haswell Core i7-4770 with DDR3.

## Key claims

- Test system: Ryzen 9 9950X with DDR5 at 6000 MT/s. "Tests were run with memory speed set to 6000 MT/s" (Acknowledgments and Testing Notes)
- Memory latency just over 70 ns, matching a Haswell Core i7-4770 with DDR3-1333. "With just over 70 ns of memory latency, the Ryzen 9 9950X with DDR5-6000 is just about able to match a Core i7-4770 with DDR3-1333." (System Level)
- New memory generations bring bandwidth more than latency. "New memory technologies often come with higher bandwidth, but latency is often sees little improvement or even a regression." (System Level)
- Each 8-core CCD has 32 MB of L3; L1 data cache grew 50% over Zen 4. "Each CCD on the 9950X has eight Zen 5 cores and 32 MB of shared L3 cache" (System Level) and "Zen 5 increases L1 data cache capacity by 50%." (Zen 5's Pipeline, in Practice: Backend)
- A DRAM access costs hundreds of cycles. "DRAM still plays a major role because each DRAM access costs hundreds of cycles." (Backend)
- Hardware sampling of L3 misses leaves out time spent checking upper caches; a software latency test includes it. "A software latency test would include the latter." (Backend)

## Visuals worth redrawing

None needed.

## My notes

- Desktop DDR5; our laptop's memory type isn't recorded in experiment
  0001, so don't read too much into 70 ns vs our ~104–125 ns.
