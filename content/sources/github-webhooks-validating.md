---
id: github-webhooks-validating
title: Validating webhook deliveries (GitHub)
author: GitHub
url: https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries
kind: docs
primary: true
---

## Summary

How to check that a webhook really came from GitHub: an HMAC-SHA256 of
the payload with your secret, sent in `X-Hub-Signature-256`, compared in
constant time. Includes code in several languages and a test vector.

## Key claims

- The signature is an HMAC hex digest of the payload with the secret. "GitHub uses an HMAC hex digest to compute the hash." (Validating webhook deliveries)
- It covers the secret and the payload only. "The hash signature is generated using your webhook's secret token and the payload contents." (Validating webhook deliveries)
- It's sent in `X-Hub-Signature-256`. "The hash signature will appear in each delivery as the value of the X-Hub-Signature-256 header." (Validating webhook deliveries)
- Don't compare with `==`. "Never use a plain == operator." (Validating webhook deliveries)
- The SHA-1 header is legacy. "The X-Hub-Signature header uses the HMAC-SHA1 algorithm and is only included for legacy purposes." (Troubleshooting)
- Proxies must not change the payload or headers. "For example, if you use a proxy or load balancer, make sure that the proxy or load balancer does not modify the payload or headers." (Troubleshooting)
- Validating first also saves work on fake deliveries. "This will help you avoid spending server time to process deliveries that are not from GitHub and will help avoid man-in-the-middle attacks." (intro)

## Visuals worth redrawing

None.

## My notes

- No timestamp is signed; see `github-webhooks-best-practices` for the
  delivery ID as replay protection.
