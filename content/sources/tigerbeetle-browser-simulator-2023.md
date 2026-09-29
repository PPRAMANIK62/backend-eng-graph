---
id: tigerbeetle-browser-simulator-2023
title: We Put a Distributed Database In the Browser – And Made a Game of It!
author: Phil Eaton and Joran Dirk Greef (TigerBeetle)
url: https://tigerbeetle.com/blog/2023-07-11-we-put-a-distributed-database-in-the-browser/
kind: blog
primary: true
---

## Summary

TigerBeetle's post (2023) introducing the browser version of its VOPR
simulator, with three levels of faults. Useful for what the VOPR is,
where the idea came from, and the time-dilation figures they give.

## Key claims

- Where the idea came from. "inspired by our love of fuzzing, by Dropbox’s Nucleus testing, and by FoundationDB’s deterministic simulation testing." (A deterministic simulator called the VOPR)
- Why: distributed bugs are slow to find and may never recur. "complex distributed systems bugs take time to find, and once found, might never be found again." (A deterministic simulator called the VOPR)
- DST as fuzzer plus time dilation plus replay. "Deterministic simulation testing solves this by combining a fuzzer with simulated time dilation and reproducible failures." (A deterministic simulator called the VOPR)
- Their time-dilation figures. "3.3 seconds of VOPR simulation gives you 39 minutes of real-world testing time." (A deterministic simulator called the VOPR)
- Many clusters in one process, all I/O mocked. "All I/O is mocked out: with a network simulator to simulate all kinds of network faults and latencies, and an in-memory storage simulator to simulate all kinds of storage faults and latencies." (A deterministic simulator called the VOPR)
- It can check linearizability. "The VOPR can control the degree to which faults are applied, the kinds of faults that are applied, and verify linearizability." (A deterministic simulator called the VOPR)
- The hardest level corrupts storage heavily. "up to 8% corruption probability on the storage read path, and 9% corruption probability on the storage write path—for each replica!" (Level 3: Radioactive)

## Visuals worth redrawing

None.

## My notes

- The three levels are a demo, not a test plan.
