---
id: netflix-prioritized-load-shedding-2020
title: Keeping Netflix Reliable Using Prioritized Load Shedding
author: Manuel Correa, Arthur Gonigberg and Daniel West, Netflix Technology Blog
url: https://netflixtechblog.com/keeping-netflix-reliable-using-prioritized-load-shedding-6cc827b02f94
kind: blog
primary: true
---

## Summary

How Netflix's API gateway, Zuul, sorts requests into priority buckets
and, under overload, drops the lowest priorities first so that pressing
"play" keeps working (2020). Covers the request taxonomy, where the
gateway sheds (per backend and globally), the curve that sets the
priority cut-off, telling devices how to retry, and testing which
requests are safe to shed. Read through the Wayback Machine snapshot,
because the page answered curl and WebFetch with a 403 or a JavaScript
challenge.

## Key claims

- Before this, Netflix had on/off circuit breakers but no gradual shedding. "we had on/off circuit breakers, but no progressive way to shed load." (intro)
- Causes of unexpected load include retry storms and bad deploys. "misbehaving clients that trigger a retry storm, an under-scaled service in the backend, a bad deployment, a network blip, or issues with the cloud provider." (intro)
- Three buckets. NON_CRITICAL: logs and background requests, often high volume. "This traffic does not affect playback or members’ experience." (Building a request taxonomy)
- DEGRADED_EXPERIENCE: affects the experience but not playing. "This traffic affects members’ experience, but not the ability to play." (Building a request taxonomy)
- CRITICAL: affects the ability to play. "This traffic affects the ability to play." (Building a request taxonomy)
- Zuul scores each request 1 to 100 at the start. "computes a priority score between 1 to 100 for each request given its individual characteristics." (Building a request taxonomy)
- Most of the time priority isn't used. "Most of the time, the request workflow proceeds normally without taking the request priority into account." (Building a request taxonomy)
- Works like a priority queue with a moving threshold. "The implementation is analogous to a priority queue with a dynamic priority threshold." (Building a request taxonomy)
- Service throttling watches error rates and concurrent requests per backend. "Zuul can sense when a back-end service is in trouble by monitoring the error rates and concurrent requests to that service." (Service throttling)
- Global throttling watches Zuul's own CPU, concurrency and connections. "The key metrics used to trigger global throttling are CPU utilization, concurrent requests, and connection count." (Global throttling)
- If the gateway goes down, nothing gets through. "if Zuul goes down, no traffic can get through to our backend services, resulting in a total outage." (Global throttling)
- A cubic function sets how much to throttle. "A cubic function is used to manage the level of throttling." (Introducing priority-based progressive load shedding)
- The threshold trails the overload slowly at first. "at 35%, it’s still in the mid-90s. If the system continues to degrade, we hit priority 50 at 80% exceeded and then eventually 10 at 95%, and so on." (Introducing priority-based progressive load shedding)
- At the far end of the curve everything is throttled. "If things get really, really bad the level will hit the sharp side of the curve, throttling everything." (Introducing priority-based progressive load shedding)
- When shedding, Zuul tells devices how many retries and after how long. "It does this by indicating how many retries they can perform and what kind of time window they can perform them in." (Handling retry storms)
- Higher-priority requests may retry more aggressively. "Requests with higher priority will retry more aggressively than lower ones, also increasing streaming availability." (Handling retry storms)
- They inject failures by priority to check the taxonomy. "created a failure injection point in Zuul that allowed us to shed any request based on a supplied priority." (Validating which requests are right for the job)
- Non-critical requests can turn critical as the product changes. "requests that were thought to be noncritical can unexpectedly become critical." (Continually ensuring those requests are still right for the job)
- The first experiment found a client race condition on a low-priority request. "In our first experiment, we detected a race condition in both Android and iOS devices for a low priority request that caused sporadic playback errors." (Continually ensuring those requests are still right for the job)
- A 2020 incident like a 2019 outage passed without affecting playback. "Zuul’s progressive load shedding kicked in and started shedding traffic until the service was in a healthy state without impacting members’ ability to play at all." (Reaping the benefits)
- DEGRADED_EXPERIENCE examples. "The traffic in this bucket is used for features like: stop and pause markers, language selection in the player, viewing history, and others." (Building a request taxonomy)

## Visuals worth redrawing

- The cubic curve of priority threshold against overload percentage.

## My notes

- The retry signal is a JSON body with maxRetries and retryAfterSeconds;
  compare with HTTP Retry-After.
