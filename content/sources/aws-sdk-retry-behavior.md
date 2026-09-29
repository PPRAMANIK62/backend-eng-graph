---
id: aws-sdk-retry-behavior
title: Retry behavior (AWS SDKs and Tools reference guide)
author: Amazon Web Services
url: https://docs.aws.amazon.com/sdkref/latest/guide/feature-retry-behavior.html
kind: docs
primary: true
---

## Summary

How the AWS SDKs retry, in the version of the page describing the new
retry behavior that was opt-in (`AWS_NEW_RETRIES_2026=true`) when this
was written. Read for the retry quota, a token bucket that stops
retries when failures are widespread.

## Key claims

- The page describes behavior that must be switched on for now. "The behavior described on this page requires opting in until it becomes the default behavior." (Important)
- Standard mode has a retry quota, a token bucket; when empty, errors come back without retrying. "When the available tokens are exhausted, the SDK returns the error without retrying, so your application fails fast instead of waiting through retries that are unlikely to succeed." (Standard mode)
- The quota never touches first attempts. "The retry quota never delays or blocks the initial request. Only retries are affected." (Standard mode)
- Default max attempts is 3: one request and up to two retries. "A max attempts value of 3 means the SDK makes one initial request and up to two retries." (Retry settings)
- The numbers: 500 tokens, 14 per transient retry, 5 per throttling retry, a successful retry refunds its cost, a first-try success adds 1. (Retry quota, parameter table)
- How the budget moves. "When a request succeeds on the first try (no retries needed), the SDK restores 1 token. When the budget reaches zero, the SDK stops retrying and returns errors directly to your code." (How the retry quota works)
- Transient errors cost more because they often mean a service-wide problem. "Transient errors like 500s and connection failures often indicate a service-wide problem." (How the retry quota works)
- When it starts to drain. "With the default of 3 max attempts, the quota begins to drain when more than approximately 22% of requests result in sustained transient failures, or more than approximately 32% for throttling errors." (When does the quota block retries)
- The full bucket absorbs short bursts. "A brief spike in errors, even a severe one, does not block retries unless it persists long enough to drain the buffer." (When does the quota block retries)
- Scope: one SDK client, not shared across processes. "The token budget is typically scoped to a single SDK client instance. The exact scope may vary by SDK. It is not shared across processes or hosts." (Practical implications)
- Legacy mode had no standard quota, so clients kept retrying at full rate. "Without a standardized quota, a client continues to retry at full rate during service disruptions." (Legacy mode)

## Visuals worth redrawing

None.

## My notes

- Earlier SDK versions (the 2016 token bucket in
  brooker-timeouts-retries-backoff-2019) used other costs; these numbers
  are for the new behavior only. Re-check when it becomes the default.
