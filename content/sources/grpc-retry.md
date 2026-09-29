---
id: grpc-retry
title: Retry (gRPC guide)
author: gRPC authors
url: https://grpc.io/docs/guides/retry/
kind: docs
primary: true
---

## Summary

How gRPC clients retry failed calls: transparent retries that happen
without a policy, the per-method retry policy (attempts, exponential
backoff, retryable status codes), built-in jitter, retry throttling
with a token count, and the rule that a call is committed once
response headers arrive.

## Key claims

- A retry replaces the failed call and replays its history. "Note that ‘retry’ means replacing a failed call with a new call and replaying the call’s history on that newly created call." (How gRPC client retry works)
- Once response headers arrive, the call is committed and not retried. "Once the response header is received, the RPC is committed. No further retries will be attempted, and gRPC hands over the RPC to the application." (How gRPC client retry works)
- Retries are on, but there's no default policy. "Retries are enabled by default, but there is no default retry policy." (Retry configuration)
- Without a policy, only calls gRPC knows weren't processed are retried ("transparent retry"). "Only RPCs that failed due to low-level races are retried, and only if gRPC is certain the RPCs have not been processed by a server." (Retry configuration)
- Unlimited transparent retries if the call never left the client; one if it reached the server library but not the application. "gRPC performs a single transparent retry when RPC reaches the gRPC server library, but has never been seen by the server application logic." (Transparent Retry)
- The example policy: maxAttempts 4, initialBackoff 0.1s, maxBackoff 1s, backoffMultiplier 2, retryable code UNAVAILABLE. `"maxAttempts": 4, "initialBackoff": "0.1s", "maxBackoff": "1s", "backoffMultiplier": 2` (Retry configuration)
- The policy is set per method in the service config. "Retry is configurable via gRPC Service Config , at a per-method granularity." (Retry configuration)
- Jitter of plus or minus 20% is applied to every backoff. "Jitter of plus or minus 20% is applied to the backoff delay to avoid hammering servers at the same time from a large number of clients." (Retry configuration)
- So a 100 ms initial backoff becomes 80 to 120 ms. "the actual backoff delay after the first attempt will be for a random time period within the range [80ms, 120ms]." (Retry configuration)
- Retry throttling: failures take a token, successes add tokenRatio; below half of maxTokens, retries stop. "If the token_count falls below half of maxTokens, retries are paused until the count recovers." (Retry configuration)
- Example throttle: maxTokens 10, tokenRatio 0.1. `"maxTokens": 10, "tokenRatio": 0.1` (Retry configuration)

## Visuals worth redrawing

None beyond the sequence of a failed attempt followed by a retry.

## My notes

- The ±20% jitter is much narrower than AWS's "full jitter" (0 to the
  whole backoff). A difference to point out.
