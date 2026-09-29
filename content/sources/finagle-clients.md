---
id: finagle-clients
title: Clients (Finagle user guide)
author: Twitter (Finagle authors)
url: https://twitter.github.io/finagle/guide/Clients.html
kind: docs
primary: true
---

## Summary

The Finagle user guide page on the client stack (Finagle 24.2.0): the
modules every request passes through, including retries with a retry
budget, timeouts, and two per-endpoint circuit breakers that steer the
load balancer.

## Key claims

- Retries sit above the load balancer, so they can retry failures from breakers, timeouts, balancers and pools. "Every Finagle client contains a Retries module in the stack, above load balancers, so that it can retry failures from the underlying modules: circuit breakers, timeouts, load balancers and connection pools." (Retries)
- Safe-to-retry failures come out of a budget of about 20% of requests plus 10 retries a second. "These retries come out of a RetryBudget that allows for approximately 20% of the total requests to be retried on top of 10 retries per second in order to accommodate clients that have just started issuing requests or clients that have a low rate of requests per second." (Retries)
- A budget is built from a time-to-live, a minimum rate and a percentage, backed by a leaky token bucket. "The following example 3 shows how to use a factory method RetryBudget.apply in order to construct a new instance of RetryBudget backed by leaky token bucket." (Retries)
- The three parameters. "ttl - a time to live for deposited tokens" / "minRetriesPerSec - the minimum rate of retries allowed" / "percentCanRetry - the percentage of requests that might be retried" (Retries)
- Share one budget between the two retry filters. "It’s highly recommended to share a single instance of RetryBudget between both RetryFilter and RequeueFilter to prevent retry storms." (Retries, note)
- A failure flagged NonRetryable is passed up without retrying. "If a Failure is flagged NonRetryable, the Retries module will not make any attempts to retry the request and pass along the failure as is." (Retries)
- Request timeouts aren't retried by default because Finagle can't know if a request is idempotent. "As Finagle does not know whether or not a request is idempotent, request timeouts are not retried by default." (Timeouts & Expiration)
- The timeout applies to each attempt. "Regarding retries, the timeout is given to each attempt." (Timeouts & Expiration)
- Finagle's circuit breakers work per endpoint, and the load balancer avoids a tripped endpoint. "From the perspective of the load balancer, they act as circuit breakers which, when triggered, temporarily suspend the use of a particular endpoint." (Circuit Breaking)
- Two breakers: Fail Fast (session-driven) and Failure Accrual (request-driven). "Fail Fast - a session-driven circuit breaker" / "Failure Accrual - a request-driven circuit breaker" (Circuit Breaking)
- Fail Fast marks a host down when a connection fails and reconnects in the background with backoff. "It works by marking downed hosts when a connection fails, and launching a background process that repeatedly attempts to reconnect with a given backoff schedule." (Fail Fast)
- Fail Fast is switched off when there's only one host, because there's nowhere else to send traffic. "Because this module fails closed, Finagle will automatically disable Fail Fast when only one host is present in the replica set." (Fail Fast, note)
- Failure Accrual fails open: requests still flow, the balancer just avoids the endpoint. "Unlike Fail Fast, this module fails open. That is, even if it transitions into an unavailable state, requests will still be allowed to flow through it." (Failure Accrual)
- On recovery it allows one probe request first. "When transitioning from an unavailable to an available state, the module is conservative and only allows for a probe request." (Failure Accrual)
- Default policy: 5 consecutive failures or success rate below 80%, marked dead for a jittered 5 to 300 seconds. "The default setup for the Failure Accrual module is a hybrid policy based on the number of consecutive failures (default is 5) and required success rate (default is 80%)." (Failure Accrual)

## Visuals worth redrawing

- The client stack (modules from the top: retries, timeouts, load
  balancer, breakers, pools) as a vertical diagram.

## My notes

- "Fails open" and "fails closed" here are about whether requests still
  pass the module, not about the breaker's closed/open state names.
  Confusing; explain carefully if used.
