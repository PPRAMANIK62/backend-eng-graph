---
id: sirupsen-napkin-math
title: napkin-math
author: Simon Eskildsen (sirupsen)
url: https://github.com/sirupsen/napkin-math
published: README revalidated 2026-03-08
accessed: 2026-09-28
kind: code
primary: false
---

## Summary

A repository of numbers and benchmark code for back-of-the-envelope
estimates. The single-host numbers were re-measured on a GCP
`c4-standard-48-lssd` instance on 2026-03-08 and rounded on purpose. The
closest thing to a modern, measured version of the classic table, with
throughput next to latency.

## Key claims

- Numbers are rounded for memory, not precision. "Below are numbers rounded for memorization, not faux precision." (Numbers)
- Machine and date. "re-measured and revalidated on fresh GCP `c4-standard-48-lssd` instances on March 8, 2026" (Numbers; Intel Xeon 6985P-C, 48 vCPU, 180 GB RAM, Ubuntu 22.04.5)
- Latency and throughput columns don't always agree, on purpose. "Some throughput and latency numbers don't line up, this is intentional for ease of calculations." (Note 1)
- For I/O, use fio. "for I/O, [`fio`][fio] is the state-of-the-art." (Note 2)
- Table rows (latency): sequential memory R/W (64 bytes) 0.5 ns; random memory R/W (64 bytes) 20 ns, 3 GiB/s; system call 300 ns; sequential SSD read (8 KiB) 1 µs; context switch 10 µs; random SSD read (8 KiB) 100 µs; sequential SSD write with fsync (8 KiB) 300 µs; network within same region 250 µs. (Numbers table)
- Network rows: NA Central <-> East 25 ms; NA East <-> West 60 ms; EU West <-> NA East 80 ms; EU West <-> Singapore 160 ms; NA West <-> Singapore 180 ms. (Numbers table)

## Visuals worth redrawing

None.

## My notes

- "Random memory R/W 20 ns" is far below the classic 100 ns. The README
  doesn't say in the parts read whether its random test lets loads
  overlap; if it does, it measures throughput-style latency, not one
  dependent miss. Our chase test (dependent loads) got 104–125 ns.
- Rows not yet revalidated are marked in the README; the network rows are
  not single-host measurements.
