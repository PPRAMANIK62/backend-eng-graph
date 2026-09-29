---
id: standard-webhooks-spec
title: Standard Webhooks specification
author: Standard Webhooks contributors
url: https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md
kind: spec
primary: true
---

## Summary

A community spec (version 1.0.0) written by webhook providers to make
webhooks work the same way everywhere: payload shape, a signature scheme
with fixed headers, retry schedule, status-code handling, timeouts,
HTTPS, and SSRF. Read from the spec file in the project's GitHub repo.

## Key claims

- Webhooks are HTTP callbacks from a service to its customer's server. "When a client wants to make a request to a service they make an API call, and when the service wants to notify the client of an event the service triggers a webhook" (What are Webhooks?)
- Thin payloads carry only IDs, full payloads carry the data; thin is smaller and more future proof, full saves the receiver an API call. "you can always make a thin one full, but not the other way around" (Thin vs full payloads)
- Thin payloads keep data from going to every endpoint, so access can be audited and restricted. "With full payloads, the data is just sent to every listening endpoint, with thin payloads it's required that people explicitly query the data they need, making it possible to make access auditable and more restricted." (Thin vs full payloads)
- Keep payloads small. "it's recommended to keep the size of payloads small, usually smaller than 20kb." (Payload size)
- A webhook is an HTTP request from an unknown source, so verifying it is required. "Webhooks are just HTTP requests from an unknown source, so verifying the authenticity of webhooks is a requirement for any secure webhook implementation." (Verifying webhook authenticity)
- The attempt timestamp changes on every retry; the message ID stays the same. "The unique identifier is a unique identifier associated with a specific event triggered, and it remains the same no matter how many times a webhook that has failed is retried." (Webhook metadata)
- The ID doubles as an idempotency key. "The ID is often used as an idempotency key, which lets a consumer ensure that they only process a specific event once, even if sent multiple times maliciously, in error, or due to networking issues." (Webhook metadata)
- What's signed is the ID, the timestamp and the body joined with dots. "The content to be signed is therefore: `msg_id.timestamp.payload`." (Signature scheme)
- Re-serializing parsed JSON is a common cause of failed verification. "This is a very common failure mode as many webhook consumers often accidentally parse the body as json, and then serialize it again" (Signature scheme)
- Symmetric is HMAC-SHA256 (`v1`), asymmetric is ed25519 (`v1a`); symmetric secrets are random, 24 to 64 bytes. (Signature scheme table)
- HMAC-SHA256 is fast and available everywhere. "Ubiquitous: HMAC-SHA256 is widely available on every platform and language." (Signature scheme, comparison)
- HMAC-SHA256 is fast. "HMAC-SHA256 is fast and often hardware accelerated, and much faster than any asymmetric scheme." (Signature scheme, comparison)
- The signature header value is the version, a comma, then base64. "a symmetric signature will be v1, followed by a comma (`,`), followed by the base64 encoded signature." (Signature scheme)
- Prefer asymmetric signatures. "Prefer asymmetric signature schemes over symmetric ones." (Additional considerations)
- Keys should be unique per endpoint. "Signing keys should be unique per endpoint for symmetric signatures" (Additional considerations)
- Headers: `webhook-id`, `webhook-timestamp` (Unix seconds), `webhook-signature` (a space-separated list). The list exists for key rotation. "The reason it is a list, and not just one signature is to support zero downtime secret rotation." (Webhook headers)
- Compare in constant time. "When verifying symmetric signatures, use a constant time comparison function to compare the calculated with the expected signature." (Verifying signatures)
- Check the timestamp against a tolerance to stop replays. "Make sure to verify the `webhook-timestamp` header has a timestamp that is within some allowable tolerance of the current timestamp to prevent replay attacks." (Verifying signatures)
- Retry over several days with exponential backoff and jitter. "It's recommended to retry delivery following a retry schedule spanning multiple days, with an exponential backoff." (Deliverability and reliability)
- Example schedule: immediately, 5 s, 5 min, 30 min, 2 h, 5 h, 10 h, 14 h, 20 h, 24 h; the last attempt comes 75:35:05 after the first. (Example retry schedule table)
- If an endpoint keeps failing, tell the owner another way and stop sending. "it is important to both: notify the consumers using other channels (e.g. email), and is recommended to disable future delivery to the endpoint." (Deliverability and reliability)
- Only 2xx is success; redirects are failures. "A webhook delivery is considered successful if it was responded to with a `2xx` status code (status codes 200-299), and it is considered a failure in any other scenario." (Delivery success and failure)
- 410 means stop; 429, 502 and 504 mean slow down; honour Retry-After. "`410 Gone`: This is an indication by the server that it's no longer interested in receiving webhooks from this source." (Delivery success and failure)
- 429 means throttle. "`429 Too Many Requests`: This indicates a rate-limit has been met, and it's recommended to throttle additional requests." (Delivery success and failure)
- 502 and 504 mean the server is under load. "`502 Bad Gateway` and `504 Gateway Timeout`: Both errors usually indicate that the server is under load" (Delivery success and failure)
- A Retry-After header should shape the next attempt. "which should be taken into consideration when scheduling the next attempt." (Delivery success and failure, on the `retry-after` header)
- Redirects: update the URL instead of following them. "recommended to update the webhook URL instead." (Delivery success and failure)
- Timeout between 15 and 30 seconds. "A recommended request timeout value for webhooks is somewhere between 15 and 30s." (Request timeouts)
- Signatures don't encrypt; use HTTPS. "it doesn't encrypt the data, which means it may be possible to eavesdrop and view the content of the payloads." (Enforcing HTTPS)
- Webhook senders are exposed to SSRF because customers choose the URLs. "Webhooks implementations are especially vulnerable to SSRF as they let their consumers (customers) add any URLs they want, which will be called from the internal webhook system." (SSRF)
- Defence: send through a proxy that filters internal addresses, from a subnet that can't reach internal services. (SSRF)
- Let customers add several endpoints for the same events, e.g. user management, a CRM and a team chat app. "It's therefore recommended to enable customers to add multiple webhook endpoints so that they can receive the same webhook to multiple destinations." (Multiple endpoints (fanout))
- SSRF targets include cloud metadata and internal services. "the attacker may be able to read server configuration such as AWS metadata, connect to internal services like HTTP-enabled databases" (SSRF)
- Failures include non-2xx codes, timeouts and connection resets. "Example failure scenarios include non-`2xx` response status codes (e.g: 404 and 500), request timeouts (see next section), connection resets, and more." (Delivery success and failure)
- Let customers see failures and replay them. "it's immensely important to give consumers a way to manually replay specific webhooks or failures within a range in order to recover from long outages without missing message delivery." (Visibility into failures and manual retries)

## Visuals worth redrawing

- The example retry schedule table, as a timeline.

## My notes

- The spec says nothing about ordering.
- The example timestamps in the spec's JSON are calendar dates; don't
  copy them.
