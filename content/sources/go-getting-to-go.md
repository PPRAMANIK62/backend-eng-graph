---
id: go-getting-to-go
title: "Getting to Go: The Journey of Go's Garbage Collector"
author: Rick Hudson
url: https://go.dev/blog/ismmkeynote
published: 2018-07-12
accessed: 2026-09-28
kind: talk
primary: true
---

## Summary

Transcript of Rick Hudson's 2018 ISMM keynote on how the Go team built a
concurrent, non-moving, tri-color mark-sweep GC, cut pauses from hundreds
of milliseconds to under one, and tried and dropped two other designs
(the Request-Oriented Collector and a generational GC).

## Key claims

- Go is value-oriented, which gives control over layout and helps cache locality. "One can collocate fields that have related values which helps with cache locality." (value-oriented section)
- Go has interior pointers. "Of course Go can have pointers and in fact they can have interior pointers." (value-oriented section)
- Latency over a whole session matters, not one request: for a session of 100 server requests, only 37% of users get every request under 10 ms (the talk's worked example); for 99% of users you need to target the 99.99th percentile. "In that situation only 37% of users will have a consistent sub 10ms experience across the entire session." (tyranny of the 9s)
- The write barrier is on only while the GC runs. "The write barrier is on only during the GC." (implementation)
- Pause history: about 300–400 ms down to 30–40 ms (Aug 2015), then 4–5 ms, then sub-10 ms (Aug 2016, Go 1.7, an 18 GB heap), then sub-millisecond (March 2017). "we saw a drop from around 300 - 400 milliseconds down to 30 or 40 milliseconds." (results graphs)
- Sub-millisecond came from removing stop-the-world stack rescanning. "That dropped us into the sub-millisecond range." (March 2017)
- 2018 goal: 500 µs of stop-the-world pause per GC cycle. "We now have an objective of 500 microseconds stop the world pause per GC cycle." (2018 SLO)
- Latency this low can come from many non-GC sources. "these latency levels can happen for a wide variety of non-GC reasons" (2017 results)
- A generational GC needs the write barrier always on; it was fast but not fast enough. "The write barrier was fast but it simply wasn’t fast enough." (generational attempt)
- Escape analysis already puts young objects on the stack, so generational collection helps Go less. "it’s just that the young objects live and die young on the stack." (generational attempt)
- So generational GC is less effective in Go than in other managed languages. "The result is that generational collection is much less effective than you might find in other managed runtime languages." (generational attempt)

## Visuals worth redrawing

- The series of pause-time graphs with shrinking Y axes (400 ms → 50 → 5 → 1.5 ms). A single log-scale timeline would redraw it well.

## My notes

- 2018. Green Tea (Go 1.25/1.26) changes how marking walks the heap but keeps it non-moving and non-generational (check).
