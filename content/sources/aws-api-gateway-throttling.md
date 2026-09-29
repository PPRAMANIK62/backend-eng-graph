---
id: aws-api-gateway-throttling
title: Throttle requests to your REST APIs for better throughput in API Gateway
author: Amazon Web Services
url: https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-request-throttling.html
kind: docs
primary: true
---

## Summary

How Amazon API Gateway throttles requests: a token bucket with a rate
and a burst, applied at several levels (AWS-wide per Region, per account,
per stage or method, and per client by API key).

## Key claims

- Token bucket, one token per request. "API Gateway throttles requests to your API using the token bucket algorithm, where a token counts for a request." (intro)
- Limits are targets, not exact ceilings. "Both throttles and quotas are applied on a best-effort basis and should be thought of as targets rather than guaranteed request ceilings." (intro)
- Over the limit, clients get 429. "Clients may receive 429 Too Many Requests error responses at this point." (intro)
- Rate is the refill speed, burst is the bucket size. "You can specify a throttling rate, which is the rate, in requests per second, that tokens are added to the token bucket. You can also specify a throttling burst, which is the capacity of the token bucket." (Configuring API-level and stage-level throttling targets in a usage plan)
- Four levels: AWS-wide per Region, per account, per API stage or method, per client. "Per-client throttling limits are applied to clients that use API keys associated with your usage plan as client identifier." (How throttling limit settings are applied in API Gateway)

## Visuals worth redrawing

None.

## My notes

- The docs describe the burst as the "maximum bucket size", and also as
  a target for concurrent submissions; the two readings aren't the
  same thing, so the article uses only the bucket one.
