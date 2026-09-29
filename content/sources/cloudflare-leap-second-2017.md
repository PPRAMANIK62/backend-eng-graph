---
id: cloudflare-leap-second-2017
title: How and why the leap second affected Cloudflare DNS
author: John Graham-Cumming
url: https://blog.cloudflare.com/how-and-why-the-leap-second-affected-cloudflare-dns/
kind: blog
primary: true
---

## Summary

Cloudflare's postmortem (2017) of a leap second outage. Their DNS
server, in Go, measured resolver round trips with the wall clock. When the clock
went back a second, the durations came out negative, the smoothed
value went negative, and a random-number call panicked on it.

## Key claims

- Root cause in one line. "The root cause of the bug that affected our DNS service was the belief that time cannot go backwards." (A falsehood programmers believe about time)
- Go's time.Now() was not monotonic then. "RRDNS is written in Go and uses Go’s time.Now() function to get the time. Unfortunately, this function does not guarantee monotonicity." (A falsehood programmers believe about time)
- A step back during a fast lookup gives a negative duration. "If, right when a resolution is happening, time goes back a second the perceived resolution time will be negative." (A falsehood programmers believe about time)
- Smoothing turned several negative samples into a negative average. "after a few measurements the smoothed value would eventually become negative." (A falsehood programmers believe about time)
- The crash itself. "rand.Int63n promptly panics if its argument is negative." (A falsehood programmers believe about time)
- Impact. "At peak approximately 0.2% of DNS queries to Cloudflare were affected and less than 1% of all HTTP requests to Cloudflare encountered an error." (intro)
- The fix: check for negative durations. "One precaution when using a non-monotonic clock source is to always check whether the difference between two timestamps is negative." (The one character fix)
- The resolvers normally answer in milliseconds. "we’ve tuned our resolvers to be very fast which means that it’s normal for them to answer in a few milliseconds." (A falsehood programmers believe about time)
- The fix stopped negative samples from being recorded. "The fix we applied prevents the recording of negative values in server selection." (The one character fix)

## Visuals worth redrawing

- The per-datacenter error rate chart. Not redrawn.

## My notes

- Go 1.9 later made time.Now() carry a monotonic reading (see
  go-1-9-release-notes), which fixes this class of bug for Go code
  that subtracts two time.Now() values.
