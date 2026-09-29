---
id: openfga-consistency
title: "Query Consistency Modes (OpenFGA documentation)"
author: OpenFGA authors
url: https://openfga.dev/docs/interacting/consistency
kind: docs
primary: true
---

## Summary

How OpenFGA handles freshness: two modes, MINIMIZE_LATENCY (cache when
possible) and HIGHER_CONSISTENCY (skip the cache), and a note that it
doesn't have zookies yet.

## Key claims

- Two modes, and MINIMIZE_LATENCY is the default. "MINIMIZE_LATENCY (default)" (Background, table)
- A write followed by a check can miss the write. "If you write a tuple and you immediately make a Check on a relation affected by that tuple using MINIMIZE_LATENCY, the tuple change might not be taken in consideration if OpenFGA serves the result from the cache." (Background)
- Always using HIGHER_CONSISTENCY is costly. "Always specifying HIGHER_CONSISTENCY will have a significant impact in performance." (When to use higher consistency)
- Suggested workaround: store a last-modified time on the resource and use HIGHER_CONSISTENCY only while it's newer than the cache TTL. (When to use higher consistency, code sample)
- Caching is off by default, and then every query is strongly consistent. "OpenFGA caching is disabled by default. When caching is disabled, all queries will have strong consistency regardless of the consistency mode specified." (Cache expiration)
- No zookies yet. "OpenFGA is considering a similar feature in future releases." (Future work)

## Visuals worth redrawing

None.

## My notes

- So OpenFGA's answer to the new enemy problem is "skip the cache" or
  "no cache", not a token. SpiceDB has tokens. A real difference
  between the two Zanzibar-style systems when this was written.
