---
id: discord-go-to-rust
title: Why Discord is switching from Go to Rust
author: Jesse Howarth
url: https://discord.com/blog/why-discord-is-switching-from-go-to-rust
kind: blog
primary: true
---

## Summary

Discord's Read States service, written in Go, showed latency and CPU
spikes about every two minutes. The cause was Go's forced periodic GC
scanning a huge LRU cache of live objects, not garbage volume. Tuning
GOGC didn't help; shrinking the cache helped spikes but hurt p99. They
rewrote it in Rust. Graphs are from Go 1.9.2.

## Key claims

- The service tracks which channels and messages each user has read, and is in the hot path. "Read States is accessed every time you connect to Discord, every time a message is sent and every time a message is read." (The Read States service)
- Each server held an LRU cache with tens of millions of Read States. "There are tens of millions of Read States in each cache." (Why Go did not meet our performance targets)
- Latency and CPU spiked roughly every 2 minutes. "there are latency and CPU spikes roughly every 2 minutes." (Why Go did not meet our performance targets)
- They allocated little. "we had written the Go code very efficiently and had very few allocations." (same)
- Go forced a GC at least every 2 minutes. "Go will force a garbage collection run every 2 minutes at minimum ." (same)
- Changing GC Percent did nothing, because they didn't allocate fast enough to trigger GC sooner. "no matter how we configured the GC percent nothing changed." (same)
- The spikes came from scanning the whole live cache. "the garbage collector needed to scan the entire LRU cache in order to determine if the memory was truly free from references." (same)
- A smaller cache gave smaller spikes but a higher p99 from more database loads. "the trade off of making the LRU cache smaller resulted in higher 99th latency times." (same)
- Rust frees memory as soon as it's no longer needed, without a garbage collector. "It knows when the program is using memory and immediately frees the memory once it is no longer needed." (Memory management with Rust)
- The Rust version had no spikes and beat Go on latency, CPU and memory. "Latency, CPU, and memory were all better in the Rust version." (Implementation, load testing, and launch)
- Go version: graphs from 1.9.2; 1.8, 1.9 and 1.10 tried without improvement. "We tried versions 1.8, 1.9, and 1.10 without any improvement." (footnote 1)

## Visuals worth redrawing

- The Go response-time graph with regular spikes. Describe, don't copy.

## My notes

- The 2-minute forced GC is a Go runtime constant; I saw `var forcegcperiod int64 = 2 * 60 * 1e9` in runtime/proc.go on master, but that source has no note here.
- Predates GOMEMLIMIT (1.19) and Green Tea (1.26); no newer Go was tested.
