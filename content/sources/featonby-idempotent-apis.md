---
id: featonby-idempotent-apis
title: Making retries safe with idempotent APIs
author: Malcolm Featonby, Amazon Builders' Library
url: https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/
kind: blog
primary: true
---

## Summary

How AWS makes create operations (EC2 RunInstances is the running
example) safe to retry: a caller-provided client request identifier
(ClientToken), recorded atomically with the work, a semantically
equivalent response on every retry, a retention window for tokens,
and a validation error when the same token comes with different
parameters.

## Key claims

- Retrying assumes the call has no extra side effects. "However, retrying a service call as mitigation for a transient fault is based on a simplifying assumption that an operation can be retried without any side effects." (Introduction)
- Example of the harm: a retried create leaves two volumes. "it would be undesirable for the EC2 instance launch workflow to retry a failed call to create an EBS volume and end up with two EBS volumes." (Introduction)
- After a timeout the caller can't tell whether the work ran. "It’s not clear whether the singleton workload is running or not." (Retrying and side effects)
- Definition. "An idempotent operation is one where a request can be retransmitted or retried with no additional side effects, a property that is very beneficial in distributed systems." (Reducing client complexity)
- With idempotent APIs, a client can retry every error except validation errors. "any error that isn’t a validation error can be overcome by retrying the request until it succeeds." (Reducing client complexity)
- Hashing the parameters to spot duplicates doesn't work: a caller may really want two identical instances. "It’s possible that the caller actually wants two identical EC2 instances." (Reducing client complexity)
- Amazon's approach: a unique caller-provided client request identifier. "At Amazon, our preferred approach is to incorporate a unique caller-provided client request identifier into our API contract." (Reducing client complexity)
- In EC2 that identifier is called ClientToken. "(In the Amazon EC2 API the unique client request identifier is called the ClientToken)." (Reducing client complexity)
- Recording the token and doing the work must be one atomic operation. "An important consideration is that the process that combines recording the idempotent token and all mutating operations related to servicing the request must meet the properties for an atomic, consistent, isolated, and durable (ACID) operation." (Reducing client complexity)
- Otherwise you record the token and fail to create, or create and fail to record. "This ensures that we avoid situations where we could potentially record the idempotent token and fail to create some resources or, alternatively, create the resources and fail to record the idempotent token." (Reducing client complexity)
- Answering a retry with ResourceAlreadyExists meets the letter of idempotency but has a side effect from the client's view. "In this scenario, although there is no side effect from the service perspective, returning ResourceAlreadyExists has a side effect from the client’s perspective." (Reducing client complexity)
- Instead, return a semantically equivalent response for the same token for some interval. "An alternative is to deliver a semantically equivalent response in every case for the same unique request identifier for some interval." (Retries and semantic equivalence)
- The retry in the example is made a few minutes after the first request. "can be simulated by waiting a few minutes and then making another request using the AWS CLI and the same ClientToken" (Retries and semantic equivalence)
- The retried response is similar, not identical (the instance is now running). "It’s important to note that the response returned is very similar but not identical to the first response" (Retries and semantic equivalence)
- The SDK and CLI generate the token when the caller doesn't and reuse it on retries. "This generated identifier is then reused in the event of a retry, thus ensuring we meet the “at most once” commitment for the request." (Retries and semantic equivalence)
- A late retry after the instance was terminated still gets the equivalent response, now showing "terminated". "The approach we have taken for EC2 RunInstances is to honor the initial idempotent contract even in the scenario we just described." (Late arriving requests)
- Tokens can't be kept forever; for EC2 instances, the resource's lifetime plus an interval. "it works to limit the time period to the lifetime of the resource, plus an interval after which it is reasonable to assume that any late arriving requests would either have arrived or would no longer be valid." (Late arriving requests)
- Same token, different parameters: return a validation error, so store the parameters. "In response to this situation, we return a validation error indicating a parameter mismatch between idempotent requests." (Same client request ID, different intent)
- This contract has a cost and isn't right for every API. "However, there is cost and complexity inherent in building services to meet the contract this article describes, and that complexity is not right for all solutions." (Conclusion)

## Visuals worth redrawing

- The request/response flow with a client request identifier: first
  request creates the "session" and the resource, the retry finds the
  token and gets an equivalent response.
- The late-arriving request: retry delayed, another actor deletes the
  resource, the retry arrives.

## My notes

- Undated on the page; the Builders' Library launched in 2019 and this
  article is from around then. Cite without a year.
