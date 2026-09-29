---
id: authzed-spicedb-consistency
title: "Consistency (SpiceDB documentation)"
author: AuthZed
url: https://authzed.com/docs/spicedb/concepts/consistency
kind: docs
primary: true
---

## Summary

SpiceDB is a permissions database inspired by the Zanzibar paper. This
page explains its per-request consistency levels and ZedTokens, its
name for zookies: what each level trades, when to store a ZedToken next
to your content, and a trap with CockroachDB.

## Key claims

- SpiceDB caches check results, and stale caches cause the new enemy problem. "If a relationship has changed, and all the caches have not been updated or cleared, there is a risk of returning incorrect permission information; this problem is known as the New Enemy Problem." (Consistency in SpiceDB)
- Writes default to fully_consistent; all other APIs default to minimize_latency. (Defaults table)
- minimize_latency alone leaves a window. "If used exclusively, this can lead to a window of time where the New Enemy Problem can occur." (Levels, Minimize Latency)
- at_least_as_fresh uses data at least as new as the token, or newer. "at_least_as_fresh will ensure that all data used for computing the response is at least as fresh as the point-in-time specified in the ZedToken." (Levels, At Least As Fresh)
- at_exact_snapshot can fail once old versions are garbage collected. "Requests specifying at_exact_snapshot can fail with a Snapshot Expired error because SpiceDB eventually collects garbage over time." (Levels, At Exact Snapshot)
- fully_consistent skips the cache. "This consistency mode explicitly bypasses caching, dramatically impacting latency." (Levels, Fully Consistent)
- On CockroachDB, fully_consistent doesn't guarantee read-after-write, because SpiceDB picks its own timestamp and node clocks can differ by up to max_offset (default 500 ms). "CockroachDB users: fully_consistent does not guarantee read-after-write consistency on CockroachDB." (Levels, Fully Consistent)
- ZedToken is SpiceDB's zookie. "ZedToken is the SpiceDB equivalent of Google Zanzibar’s Zookie concept which protects users from the New Enemy Problem." (ZedTokens)
- When to refresh a stored ZedToken: resource created or deleted, contents change, access added or removed. (Storing ZedTokens)
- Storage advice. "For a Postgres table this can be a standard text column." (Storing ZedTokens)
- Zanzibar needs a ContentChangeCheck because it lacks per-request consistency levels. (Storing ZedTokens)
- Some domains can ignore tokens, with a staleness window set by `--datastore-revision-quantization-interval`. "Some workloads and domains might not be sensitive to wall-clock-based permission races." (Ignoring ZedTokens)
- SpiceDB was inspired by the Zanzibar paper. "In fact, the paper that inspired SpiceDB is entitled “Zanzibar: Google’s **Consistent**, Global Authorization System”." (Consistency in SpiceDB)
- On CockroachDB, use a token for read-after-write. "If you need read-after-write consistency with CockroachDB, use a ZedToken with at_least_as_fresh instead." (Levels, Fully Consistent)
- What minimize_latency does. "minimize_latency will attempt to minimize the latency of the API call by selecting data that is most likely to exist in the cache." (Levels, Minimize Latency)

## Visuals worth redrawing

None.

## My notes

- Read at SpiceDB docs as published when this was written; the page
  shows no version number.
