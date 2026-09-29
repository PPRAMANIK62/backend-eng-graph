---
id: brooker-sieve-2023
title: Why Aren't We SIEVE-ing?
author: Marc Brooker
url: https://brooker.co.za/blog/2023/12/15/sieve.html
kind: blog
primary: false
---

## Summary

A short take on SIEVE (Zhang et al., NSDI 2024), a FIFO-plus-visited-bit
eviction algorithm, and on why simple FIFO-family policies struggle
with scans. Brooker tries a counter variant (SIEVE-k) and reports
mixed results.

## Key claims

- Eviction trades accuracy, speed and metadata size. "Eviction is interesting because it’s a tradeoff between accuracy, speed (how much work is needed on each eviction and each access), and metadata size." (intro)
- SIEVE only sets a bit on access, like CLOCK; no reordering. "All it needs on access is to set a bool, which is a simple atomic operation on most processors." (intro)
- SIEVE's authors conjecture it went unnoticed because it isn't scan-resistant. "We conjecture that not being scan-resistant is probably the reason why SIEVE remained undiscovered over the decades of caching research, which has been mostly focused on page and block accesses." (quoted from the SIEVE paper)
- Why scans matter for block and file caches. "Scan-resistance is important for block and file workloads because these workloads tend to be a mix of random access (update that database page, move that file) and large sequential access (backup the whole database, do that unindexed query)." (Why aren’t we all SIEVE-ing?)
- His SIEVE-2 was worse on web-cache style workloads and mixed on block. "It was worse than SIEVE across the board on web-cache style KV workloads, as expected." (Does It Work?)
- Block traces are hard because easy caching already happened upstream. "Block traces are interesting, because they tend to represent a kind of residue of accesses after the easy caching has already been done" (footnote 5)

## Visuals worth redrawing

None.

## My notes

- Useful for the web-cache vs block-cache split in `eviction-policies`.
