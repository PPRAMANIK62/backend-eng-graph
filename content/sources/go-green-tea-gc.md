---
id: go-green-tea-gc
title: The Green Tea Garbage Collector
author: Michael Knyszek and Austin Clements
url: https://go.dev/blog/greenteagc
published: 2025-10-29
accessed: 2026-09-28
kind: blog
primary: true
---

## Summary

The Go team explains why marking was slow on modern CPUs (it jumps
around memory, stalls on cache misses) and the Green Tea redesign that
scans memory page by page. Experimental in Go 1.25, planned as default
in Go 1.26.

## Key claims

- Green Tea arrived as an experiment in Go 1.25. "Go 1.25 includes a new experimental garbage collector called Green Tea," (intro)
- Typical saving about 10% of GC time, up to 40% for some workloads. "Many workloads spend around 10% less time in the garbage collector, but some workloads see a reduction of up to 40%!" (intro)
- About 90% of GC cost is marking, 10% sweeping. "about 90% of the cost of the garbage collector is spent marking," (the problem)
- At least 35% of marking time is stalled on heap memory. "a substantial portion, usually at least 35%, is simply spent stalled on accessing heap memory." (the problem)
- Main memory can be up to 100x slower than cache. "Going to main memory can be up to 100x slower than accessing memory that’s in our cache." (“A microarchitectural disaster”)
- Objects that point to each other needn't be near each other, and the old graph flood ignored that. "The graph flood doesn’t take this into account." (“A microarchitectural disaster”)
- Go's runtime pages are 8 KiB regardless of hardware page size. "In Go, pages are 8 KiB (regardless of the hardware virtual memory page size)." (graph flood example)
- The key idea is to scan whole pages, not single objects. "Work with pages, not objects." (Green Tea)
- Work is tracked per page, with marks kept local to each page. "we’ll track marked objects locally to each page, rather than across the whole heap." (Green Tea)
- Scanning more of one page at once makes cache hits likelier. "there’s a better chance we can make use of our caches and avoid main memory." (Green Tea example)
- 10% of app time in GC → 1–4% total CPU saved. "would translate to between a 1% and 4% overall CPU reduction" (results)
- Plan: default in Go 1.26. "we plan to make it the default in Go 1.26." (intro)

## Visuals worth redrawing

- The heap diagram with four pages A–D and the path the graph flood takes (jumping between pages) vs Green Tea's page-at-a-time path.

## My notes

- Go runtime page (8 KiB) ≠ OS page (4 KiB) ≠ huge page (2 MiB). Worth a line in the article.
