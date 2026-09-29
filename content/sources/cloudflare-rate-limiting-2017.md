---
id: cloudflare-rate-limiting-2017
title: How we built rate limiting capable of scaling to millions of domains
author: Julien Desgats, Cloudflare
url: https://blog.cloudflare.com/counting-things-a-lot-of-different-things/
kind: blog
primary: true
---

## Summary

Cloudflare's post (2017) on building rate limiting across its edge. It
walks through the fixed window, the "store every timestamp" log, and the
leaky bucket, then explains the sliding window counter it chose, with
measured accuracy, and how counting is shared inside each data centre.

## Key claims

- The stock nginx module keeps counters per server, which fails when one client's requests spread over many servers. "The only problem is that if the incoming requests are spread across a large number of servers, this doesn't work any more." (Let’s just do this locally!)
- One central counter for the whole world is too slow and too fragile. "reporting all counters to a single central point is not a realistic solution as the latency is far too high" (All roads lead to Rome? Not with anycast!)
- Anycast sends one client IP to one data centre, so counting per data centre is enough. "we can actually create an isolated counting system inside each PoP." (All roads lead to Rome? Not with anycast!)
- The counters live in memcache shards spread across the data centre's servers behind Twemproxy, with consistent hashing. (Storing counters)
- Fixed window: counters reset at fixed times, letting spikes through. "the counter will be arbitrarily reset at regular intervals, allowing regular traffic spikes to go through the rate limiter." (Algorithms)
- Keeping every timestamp is accurate but expensive. "This is more accurate, but has huge processing and memory requirements" (Algorithms)
- Leaky bucket: a counter that goes up per request and drains at the allowed rate; the capacity is the burst. "The capacity of the bucket is what you are ready to accept as “burst” traffic" (Algorithms)
- Its drawbacks for Cloudflare: two parameters that are hard to tune, and steps that couldn't be atomic on memcached. "It has two parameters (average rate and burst) that are not always easy to tune properly" (Algorithms)
- Sliding window counter: weight the previous window's count by how much of it still overlaps, add the current count. For a limit of 50 per minute, 42 requests last minute and 18 in the first 15 seconds of this one: 42 × ((60 − 15) / 60) + 18 = 49.5. (Sliding windows to the rescue, calculation block)
- It assumes the previous window's requests were evenly spread. "This algorithm assumes a constant rate of requests during the previous sampling period" (Sliding windows to the rescue)
- Measured on 400 million requests from 270,000 sources: 0.003% wrongly allowed or limited, 6% average difference from the real rate, no false positives. "0.003% of requests have been wrongly allowed or rate limited" (Sliding windows to the rescue, accuracy list)
- It needs two numbers per counter and one INCR per request. "Tiny memory usage: only two numbers per counter" (Sliding windows to the rescue, properties)
- Counting runs asynchronously; once a client is over, a mitigation flag with a known end time is cached in each server's memory. "This is why the increment jobs are run asynchronously without slowing down the requests." (Sliding windows to the rescue)
- A central store is also hard to keep available. "guaranteeing the availability of the central service causes more challenges" (All roads lead to Rome? Not with anycast!)
- Only GET, SET and INCR were available, and the leaky bucket needs several steps that can't be done atomically. "We were constrained to use the memcached protocol and this algorithm requires multiple distinct operations that we cannot do atomically" (Algorithms)
- Why counting is asynchronous: attacks would crush the store, and synchronous counting slows every request. "We knew that large scale attacks would have crushed the memcached cluster like this. More importantly, such operations would slow down legitimate requests a little, even under normal conditions." (Sliding windows to the rescue)
- Once mitigation starts its end time is known, so each server caches it and stops querying. "Once a server starts to mitigate a client, it will not even run another query for the subsequent requests it might see from that source!" (Sliding windows to the rescue)
- No false positives. "None of the mitigated sources was below the threshold (false positives)" (Sliding windows to the rescue, accuracy list)
- At the time it handled several billion requests a day and mitigated attacks of 400,000 requests per second on one domain. (Conclusion)

## Visuals worth redrawing

- The sliding window figure (previous minute, current minute, the
  window sliding across both) with the 42/18/15 s example. Redrawn in
  `rate-limiting-algorithms`.

## My notes

- Because counting is async, a burst can get a little past the limit
  before the flag is set. The post doesn't give a number for that.
