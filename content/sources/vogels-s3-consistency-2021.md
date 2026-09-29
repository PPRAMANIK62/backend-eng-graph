---
id: vogels-s3-consistency-2021
title: Diving Deep on S3 Consistency
author: Werner Vogels
url: https://www.allthingsdistributed.com/2021/04/s3-strong-consistency.html
kind: blog
primary: true
---

## Summary

Amazon's CTO on why S3 used to be eventually consistent (a metadata
cache built for availability), what customers built to work around it,
and how S3 made every request strongly consistent: a witness component
that tells the cache when its view is stale, checked with proofs and
model checking.

## Key claims

- The old eventual consistency came from the metadata cache, and was rare. "in extremely rare circumstances we would exhibit eventual consistency on writes" (Consistency, Consistently)
- The cache was built to keep serving when its own infrastructure was impaired, and reads and writes could take different paths through it. "This meant that, on rare occasions, writes might flow through one part of cache infrastructure while reads end up querying another." (S3’s Metadata Subsystem)
- Customers built their own consistency layers, e.g. Netflix's s3mper on DynamoDB. "which used Amazon DynamoDB as a consistent store to identify those rare cases that S3 would serve an inconsistent response" (Consistency, Consistently)
- The Hadoop community built S3Guard for the same reason. "Cloudera and the Apache Hadoop community worked on S3Guard" (Consistency, Consistently)
- Strong consistency became the default for every request at no extra cost. "we needed to make strong consistency the default for every request, free of charge, with no performance implications" (Consistency, Consistently)
- Scale when written. "S3 has well over 100 trillion objects and serves tens of millions of requests every second." (Consistency, Consistently)
- A witness learns of every write and lets the cache check staleness on reads. "This component acts as a witness to writes, notified every time an object changes." (Cache Coherence)
- They verified it with proofs and model checking. "deductive proofs of our proposed cache coherence algorithm, model checking to formalize our consistency design" (Correctness)

## Visuals worth redrawing

- Metadata cache + persistence tier + witness, with a read checking the
  witness before trusting the cache.

## My notes

- The post is from 2021. It doesn't give the launch year of strong
  consistency in so many words; say "by 2021" or "the change described
  in 2021".
