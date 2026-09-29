---
id: shopify-webhooks-verify
title: Verify webhook deliveries (Shopify)
author: Shopify
url: https://shopify.dev/docs/apps/build/webhooks/ignore-duplicates
kind: docs
primary: true
---

## Summary

Shopify's page on receiving webhooks safely: HMAC verification against
the raw body, ignoring duplicates by delivery ID, answering quickly,
queuing, and what happens after repeated failures.

## Key claims

- Body-parsing middleware breaks HMAC verification; capture the raw body. "If you're using a body parser middleware like express.json(), it parses the body before your verification code runs." (common issues)
- Duplicates happen. "Shopify minimizes duplicate deliveries, but your app might receive the same webhook more than once, for example after a network timeout or a retry." (Ignoring duplicates)
- Make processing idempotent, or dedupe on the delivery ID in a persistent store. "Process webhooks using idempotent operations so that receiving the same webhook twice doesn't produce a different outcome." (Ignoring duplicates)
- Two IDs: one per delivery (`X-Shopify-Webhook-Id`), one per event shared across subscriptions (`X-Shopify-Event-Id`). "Use X-Shopify-Webhook-Id to deduplicate individual deliveries." (Ignoring duplicates, note)
- Only 2xx is success, 3xx included as an error. "Any response outside the 200 range, including 3XX codes, is treated as an error." (Respond with a 200 OK quickly)
- Timeouts: one second to connect, five seconds in total. "Shopify has a one-second connection timeout and a five-second timeout for the entire request." (Respond with a 200 OK quickly)
- Queue, and reconcile by polling the API for what you missed. "A common practice is to also build a reconciliation job that periodically retrieves data you might have missed using Shopify APIs." (Queue webhooks to handle traffic bursts)
- 8 retries over 4 hours, then the subscription is deleted (for Admin API subscriptions) and the developer is emailed. "If Shopify receives no response or an error, it retries 8 times over the next 4 hours." (Retries and failures)
- "After 8 consecutive failures, the subscription is automatically deleted if it was configured using the Admin API." (Retries and failures)
- The developer is warned by email. "Warning emails are sent to the app's emergency developer email address." (Retries and failures)
- Deliveries are signed with HMAC-SHA256 of the body. "Each HTTPS delivery includes a base64-encoded HMAC signature in the X-Shopify-Hmac-SHA256 header" (HMAC verification)

## Visuals worth redrawing

None.

## My notes

- Shopify's "About webhooks" page adds that ordering isn't guaranteed
  within or across topics, and suggests ordering by a timestamp header.
  Not given a note; Stripe's page makes the same ordering point.
