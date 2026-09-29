---
id: sirupsen-napkin-math
title: napkin-math
author: Simon Eskildsen (sirupsen)
url: https://github.com/sirupsen/napkin-math
kind: code
primary: false
---

## Summary

A repository of numbers and benchmark code for back-of-the-envelope
estimates. The single-host numbers were re-measured on a GCP
`c4-standard-48-lssd` instance in 2026 and rounded on purpose. The
closest thing to a modern, measured version of the classic table, with
throughput next to latency.

## Key claims

- Numbers are rounded for memory, not precision. "Below are numbers rounded for memorization, not faux precision." (Numbers)
- Machine and year. "re-measured and revalidated on fresh GCP `c4-standard-48-lssd` instances on …" (2026) (Numbers; Intel Xeon 6985P-C, 48 vCPU, 180 GB RAM, Ubuntu 22.04.5)
- Latency and throughput columns don't always agree, on purpose. "Some throughput and latency numbers don't line up, this is intentional for ease of calculations." (Note 1)
- For I/O, use fio. "for I/O, [`fio`][fio] is the state-of-the-art." (Note 2)
- Table rows (latency): sequential memory R/W (64 bytes) 0.5 ns; random memory R/W (64 bytes) 20 ns, 3 GiB/s; system call 300 ns; sequential SSD read (8 KiB) 1 µs; context switch 10 µs; random SSD read (8 KiB) 100 µs; sequential SSD write with fsync (8 KiB) 300 µs; network within same region 250 µs. (Numbers table)
- Network rows: NA Central <-> East 25 ms; NA East <-> West 60 ms; EU West <-> NA East 80 ms; EU West <-> Singapore 160 ms; NA West <-> Singapore 180 ms. (Numbers table)
- The goal is estimating performance from first principles. "The goal of this project is to collect software, numbers, and techniques to quickly estimate the expected performance of systems from first-principles." (Napkin Math, intro)
- Few assumptions. "If you are basing your calculation on more than 6 assumptions, you're likely making it harder than it should be." (Techniques)
- Keep units as a check. "Keep the units. They're good checksumming." (Techniques)
- Work in exponents; the order of magnitude is the goal. "Your goal is to get within an order of magnitude right--that's just e." (Techniques)
- Fermi decomposition: break the unknown into guessable parts, e.g. log line size, lines per second, price. "Write down things you can guess at until you can start to hint at an answer." (Techniques)
- Throughput rows used for estimates: random SSD read (8 KiB) 70 MiB/s; sequential SSD write with fsync (8 KiB) 30 MiB/s; network within same region 2 GiB/s. (Numbers table)
- Cost rows, "Approximate numbers that should be consistent between Cloud providers": blob storage about $0.02 per GB per month; internet egress about $0.1 per GB; logs/traces about $0.5 per GB, which the footnote says is standard pricing among a few logging providers. (Cost Numbers)
- The author thinks the suite is within 2-3x. "I find it highly unlikely any of them will be more than 2-3x off, which shouldn't be a problem for most users." (Numbers)

## Visuals worth redrawing

None.

## My notes

- The README's "Random Memory R/W (64 bytes)" row, 20 ns, is far below the classic 100 ns. The README
  doesn't say in the parts read whether its random test lets loads
  overlap; if it does, it measures throughput-style latency, not one
  dependent miss. Our chase test (dependent loads) got 104–125 ns.
- Rows not yet revalidated are marked in the README; the network rows are
  not single-host measurements.
