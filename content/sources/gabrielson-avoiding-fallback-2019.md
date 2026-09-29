---
id: gabrielson-avoiding-fallback-2019
title: Avoiding fallback in distributed systems
author: Jacob Gabrielson, Amazon Builders' Library
url: https://d1.awsstatic.com/builderslibrary/pdfs/avoiding-fallback-in-distributed-systems.pdf
kind: blog
primary: true
---

## Summary

Why Amazon almost never uses fallback (a different mechanism to get the
same result when the main one fails), with the story of a shipping-speed
cache whose database fallback took down amazon.com and its fulfillment
centers around 2001. The alternatives: make the main path more reliable,
let the caller handle the error, push data ahead of time, and turn
fallback into failover that runs all the time (Builders' Library,
2019). Read as the PDF, like the other Builders' Library notes.

## Key claims

- Four strategies for critical failures: retry, proactive retry, failover, fallback. "Fallback: Use a different mechanism to achieve the same result." (intro list)
- Amazon almost never uses fallback. "This article covers fallback strategies and why we almost never use them at Amazon." (intro)
- Bad fallback can take years to show. "bad fallback strategies can take a long time (even years) to leave repercussions, and the difference between a good strategy and a bad strategy is subtle." (intro)
- Fallback logic is hard to test. "To begin with, fallback logic is hard to test." (Single-machine fallback)
- The fallback itself can fail. "Another problem is that the fallback itself could fail." (Single-machine fallback)
- Better to make the primary path more reliable. "At Amazon we have found that spending engineering resources on making the primary (non-fallback) code more reliable usually raises our odds of success more than investing in an infrequently used fallback strategy." (Single-machine fallback)
- Fallback can put unpredictable load on the system, e.g. error logging turning CPU-bound into I/O-bound. "Fallback logic can also place unpredictable load on the system." (Single-machine fallback)
- Distributed fallback often makes the outage bigger and longer. "In our experience, fallback strategies increase the scope of impact of failures as well as increasing recovery times." (Distributed fallback)
- The story: when the cache failed, web servers queried the database directly. "In this scenario, the web servers reverted to querying the database directly." (Distributed fallback)
- All caches failed together and the database locked up. "But eventually the caches all failed around the same time, which meant that every web server hit the database directly. This created enough load to completely lock up the database." (Distributed fallback)
- The outage spread to fulfillment. "all fulfillment centers worldwide ground to a halt until the problem was fixed." (Distributed fallback)
- A partial outage became a full one. "The fallback turned a partial website outage (not being able to display shipping speeds) into a full-site outage (no pages loaded at all)" (Distributed fallback)
- Alternative: let the caller handle the error. "One solution to critical system failures is not to fall back, but to let the calling system handle the failure (by retrying, for example)." (Let the caller handle errors)
- Alternative: push data proactively, e.g. IAM role credentials on EC2. "the credentials are proactively pushed to every instance and remain valid for many hours." (Push data proactively)
- Run both paths all the time; then it's failover. "A service must run both the fallback and the non-fallback logic continuously." (Convert fallback into failover)
- Retries that rarely run can become a hidden fallback; alarm on retry rates. "we maintain metrics that monitor overall retry rates and alarms that alert our teams if retries are happening frequently." (Ensure that retries and timeouts don't become fallback)
- Prefer code paths exercised continuously. "Instead, we favor code paths that are exercised in production continuously rather than rarely." (In conclusion)
- The outage date and cause. "The outage occurred around 2001 and was caused by a new feature that provided up-to-date shipping speeds for all products shown on the website." (Distributed fallback)
- Why fulfillment stopped too. "This supply chain database was also critical for fulfillment centers, so the outage spread even further" (Distributed fallback)

## Visuals worth redrawing

None needed; the diagrams are a simple two-tier site with a cache.

## My notes

- Tension with graceful degradation: degrading is a planned mode too.
  The article's answer is that the mode has to be exercised all the time
  and must not add load to what's already failing.
