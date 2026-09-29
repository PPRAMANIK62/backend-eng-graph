---
id: github-webhooks-best-practices
title: Best practices for using webhooks (GitHub)
author: GitHub
url: https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks
kind: docs
primary: true
---

## Summary

GitHub's short list of advice for receiving its webhooks: subscribe to
little, use a secret, use HTTPS, answer within 10 seconds, process
asynchronously, check the event type, redeliver after downtime, and use
the delivery ID against replays.

## Key claims

- Subscribe only to the events you need. "You should only subscribe to the webhook events that you need." (Subscribe to the minimum number of events)
- Don't put credentials in the URL; use a webhook secret. "To avoid accidental exposure of sensitive information, do not include sensitive information in your payload URL." (Use a webhook secret)
- The secret should be random with high entropy. "The webhook secret should be a random string of text with high entropy." (Use a webhook secret)
- Answer with 2xx within 10 seconds or it counts as a failure. "Your server should respond with a 2XX response within 10 seconds of receiving a webhook delivery." (Respond within 10 seconds)
- Queue the payload and process it in the background. "Your server can respond when it receives the webhook, and then process the payload in the background without blocking future webhook deliveries." (Respond within 10 seconds)
- New event types and actions get added, so check them before acting. "GitHub continues to add new event types and new actions to existing event types." (Check the event type and action)
- After downtime, you redeliver. "If your server goes down, you should redeliver missed webhooks once your server is back up." (Redeliver missed deliveries)
- Replay protection is the delivery ID, which stays the same on redelivery. "To protect against replay attacks, you can use the X-GitHub-Delivery header to ensure that each delivery is unique per event." (Use the X-GitHub-Delivery header)
- "If you request a redelivery, the X-GitHub-Delivery header will be the same as in the original delivery." (Use the X-GitHub-Delivery header)
- IP allow list from the meta API, which changes from time to time. "GitHub occasionally makes changes to its IP addresses, so you should update your IP allow list periodically." (Use an IP allow list)

## Visuals worth redrawing

None.

## My notes

- Compare with Stripe: GitHub puts no timestamp in the signature, so the
  delivery ID is the only replay defence it offers.
