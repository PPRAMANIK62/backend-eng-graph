---
id: github-sharded-rate-limiter-2021
title: How we scaled the GitHub API with a sharded, replicated rate limiter in Redis
author: Robert Mosolgo, GitHub
url: https://github.blog/engineering/infrastructure/how-we-scaled-github-api-sharded-replicated-rate-limiter-redis/
kind: blog
primary: true
---

## Summary

GitHub's post (2021, updated 2023) on moving its API rate limiter from a
shared Memcached to Redis clusters sharded in the application, with one
primary and several replicas per cluster and Lua scripts for atomic
updates. Most of it is two bugs that came from time and replicas: a
"reset at" header that wobbled by a second, and rejections that
reported a full remaining quota.

## Key claims

- The old limiter: a fixed-window counter and a "reset at" key in Memcached. "In Memcached, increment the value of that key, setting it to 1 if there wasn’t any current value" (The Problem)
- Problem 1: moving to one Memcached per datacenter would split the counts. "it would cause our rate limiter to behave very strangely if client requests were routed to different data centers." (The Problem)
- Problem 2: a shared cache evicted live limiter data, giving clients fresh windows. "when it filled up, it would sometimes evict rate limiter data, even when it was still active." (The Problem)
- The new design: Redis, sharded by key inside the app, one primary for writes and replicas for reads, Lua for atomicity. "Shard inside the application: the app would pick, for each key, which Redis cluster to read and write from" (The proposed solution)
- "Implement the storage logic in Lua, to guarantee atomicity of operations (this was an improvement over the previous design)" (The proposed solution)
- They avoided their MySQL-backed store because every limiter update is a write to a primary. "rate limit updates would require write access to a primary." (The proposed solution)
- Rolled out behind a feature flag by percentage of clients. "We used a feature flag to gate access to the new backend." (The release)
- Bug 1: computing reset time from Redis TTL plus the app's clock made X-RateLimit-Reset wobble by one second. "time passes between the call to TTL (in Redis) and Time.now.to_i (in Ruby)." (Fix 1)
- Fix 1: store the reset time as data, written from the app's clock; TTL only for cleanup, set one second after. "Instead of reading TTL from Redis, we stored another value in the database" (Fix 1)
- They considered using Redis TIME as the single clock but chose the app clock for testability. "Redis’s TIME command could have been used as the source of truth." (Fix 1)
- Bug 2: a read from a replica saw the old, expired window, then the write on the primary started a new one; the client was rejected with a full quota in the headers. "replicas don’t expire data until they receive instructions to do so from their primaries, and primaries don’t expire keys until they’re accessed" (Fix 2)
- Fix 2: handle expiry in the app (treat stale replica data as expired) and don't make a second database call for a rejected request. "The application should be prepared to read stale data from replicas, then ignore it." (Fix 2)
- Remaining gap: counting happens after the request finishes, so a client can slightly exceed its limit while its last allowed request is still running. "That would prevent some edge cases where a client can exceed its limit when the final allowed request is still being processed." (Conclusion)

## Visuals worth redrawing

- The wobble table (Redis TTL call and Ruby Time.now straddling a
  second boundary).

## My notes

- A good "best bug" style write-up: symptom (headers), cause (two
  clocks; replica expiry), fix.
