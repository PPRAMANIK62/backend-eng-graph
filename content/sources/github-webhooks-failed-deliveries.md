---
id: github-webhooks-failed-deliveries
title: Handling failed webhook deliveries (GitHub)
author: GitHub
url: https://docs.github.com/en/webhooks/using-webhooks/handling-failed-webhook-deliveries
kind: docs
primary: true
---

## Summary

A short page: GitHub does not retry failed webhook deliveries itself.
You redeliver them by hand, or write a scheduled script that finds and
redelivers failures through the REST API.

## Key claims

- No automatic retries. "GitHub does not automatically redeliver failed deliveries." (About failed deliveries)
- Down or slower than 10 seconds counts as failed. "For example, if your server is down or takes longer than 10 seconds to respond, GitHub will record the delivery as a failure." (About failed deliveries)
- The fix is a script on a schedule: list recent deliveries, find the failed ones, redeliver them. "You can also write a script that checks for failed deliveries and attempts to redeliver any that failed." (Handling failed deliveries)
- Some webhooks have no delivery API at all. "There are no API endpoints to get data about GitHub Marketplace webhooks or GitHub Sponsors webhooks." (Handling failed deliveries)

## Visuals worth redrawing

None.

## My notes

- This is the far end from Stripe's three days of retries.
