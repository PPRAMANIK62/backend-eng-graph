---
id: dean-ladis-2009
title: Designs, Lessons and Advice from Building Large Distributed Systems
author: Jeff Dean
url: https://www.cs.cornell.edu/projects/ladis2009/talks/dean-keynote-ladis2009.pdf
published: 2009-10
accessed: 2026-09-28
kind: talk
primary: true
---

## Summary

Keynote slides from LADIS 2009 (held 10–11 October 2009) by Google's Jeff
Dean. Contains the "Numbers Everyone Should Know" slide, the version of the
latency table most people quote, followed by a back-of-the-envelope
example of using it to compare two designs.

## Key claims

- Estimating performance without building the system is an important skill. "Important skill: ability to estimate performance of a system design – without actually having to build it!" (slide before the numbers)
- The table, slide "Numbers Everyone Should Know": L1 cache reference 0.5 ns; branch mispredict 5 ns; L2 cache reference 7 ns; mutex lock/unlock 25 ns; main memory reference 100 ns; compress 1K bytes with Zippy 3,000 ns; send 2K bytes over 1 Gbps network 20,000 ns; read 1 MB sequentially from memory 250,000 ns; round trip within same datacenter 500,000 ns; disk seek 10,000,000 ns; read 1 MB sequentially from disk 20,000,000 ns; send packet CA->Netherlands->CA 150,000,000 ns.
- Back-of-the-envelope example: reading 30 thumbnails serially with a disk seek each: "30 seeks * 10 ms/seek + 30 * 256K / 30 MB/s = 560 ms" (slide "Back of the Envelope Calculations")

## Visuals worth redrawing

- The table itself, as a log-scale bar chart next to our own measurements.

## My notes

- No machine, date of measurement or method on the slide. No SSD row
  (2009). The numbers are for Google's hardware of that time.
- Text read with pdftotext; WebFetch could not parse the PDF.
