---
id: grpc-proposal-a6-retries
title: gRPC Retry Design (proposal A6)
author: Noah Eisen and Eric Gribkoff (gRPC)
url: https://github.com/grpc/proposal/blob/master/A6-client-retries.md
kind: spec
primary: true
---

## Summary

The gRPC design document for client retries and hedging. A method gets
either a retry policy or a hedging policy. Hedging sends the same RPC
again after a delay without waiting for a failure, and cancels the
rest once one succeeds. Both are throttled by a shared token count.

## Key claims

- Which languages have it. "Implemented in: Java, .NET, Node, Go except hedging, and C-Core except hedging" (header)
- One policy per RPC. "An individual RPC may be governed by a retry policy or a hedge policy, but not both." (Overview)
- What hedging is. "Hedging enables aggressively sending multiple copies of a single request without waiting for a response." (Hedging Policy)
- Only for safe methods. "it is important that hedging is only enabled for methods that are safe to execute multiple times without adverse affect." (Hedging Policy)
- Timing. "After `hedgingDelay` has elapsed without a successful response, the second RPC will be issued." (Hedging Policy)
- First success cancels the others. "When a non-error response is received (in response to any of the hedged requests), all outstanding hedged requests are canceled and the response is returned to the client application layer." (Hedging Policy)
- Hedging as early retry. "Essentially, hedging can be seen as retrying the original RPC before a failure is even received." (Hedging Policy)
- Throttling covers hedges. "Throttling also applies to hedged RPCs." (Throttling Retry Attempts and Hedged RPCs)
- A default cap on attempts. "`maxAttempts` in both `retryPolicy` and `hedgingPolicy` have, by default, a client-side maximum value of 5." (Limits on Retries and Hedges)

## Visuals worth redrawing

- The basic hedge state diagram (A6_graphics/basic_hedge.svg).

## My notes

- The status line is the only place that says Go and C-Core lack
  hedging; re-check it when citing, it can change.
