---
id: throttled-rate-go
title: throttled/rate.go (GCRA rate limiter in Go)
author: Throttled authors
url: https://github.com/throttled/throttled/blob/master/rate.go
kind: code
primary: true
---

## Summary

The GCRA implementation in the Go library Throttled. Short and readable:
it shows exactly what GCRA stores (one timestamp per key), how burst and
rate turn into two durations, and how the allow/deny decision and the
Retry-After value fall out of one subtraction. Read from the master
branch on GitHub.

## Key claims

- The stored value is a "theoretical arrival time". "tat refers to the theoretical arrival time that would be expected // from equally spaced requests at exactly the rate limit." (RateLimitCtx, comment)
- The emission interval is the gap between requests at exactly the rate. "Think of the emission interval as the time between events // in the nominal equally spaced schedule." (GCRARateLimiterCtx, comment)
- The delay variation tolerance is the burst allowance, like the bucket's size. "If you like leaky buckets, think about it as the size of your bucket." (GCRARateLimiterCtx, comment)
- Tolerance = interval × (burst + 1); limit = burst + 1. "delayVariationTolerance: quota.MaxRate.period * (time.Duration(quota.MaxBurst) + 1)," (NewGCRARateLimiterCtx)
- New TAT = max(now, TAT) + quantity × interval. "newTat = now.Add(increment)" / "newTat = tat.Add(increment)" (RateLimitCtx)
- Refuse if now is before newTAT − tolerance; the difference is the Retry-After. "allowAt := newTat.Add(-(g.delayVariationTolerance))" (RateLimitCtx)
- The update is a compare-and-swap against the store, with a TTL, retried a limited number of times. (RateLimitCtx, SetIfNotExistsWithTTL / CompareAndSwapWithTTL)
- Example: PerMin(60) with the burst from the quota allows 60 at once, then one per second. "For example, PerMin(60) permits 60 requests instantly per key // followed by one request per second indefinitely whereas PerSec(1) // only permits one request per second with no tolerance for bursts." (NewGCRARateLimiterCtx, comment)
- A quantity lets you limit bytes as well as requests. "a greater // quantity could rate limit based on the size of a file upload in // megabytes." (RateLimitCtx, comment)

## Visuals worth redrawing

None; see `brandur-rate-limiting-gcra-2015`.

## My notes

- Comments are split across lines with `//`; quotes above keep the
  line breaks as ` // `.
