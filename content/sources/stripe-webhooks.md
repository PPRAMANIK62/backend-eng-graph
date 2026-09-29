---
id: stripe-webhooks
title: Receive Stripe events in your webhook endpoint
author: Stripe
url: https://docs.stripe.com/webhooks
kind: docs
primary: true
---

## Summary

Stripe's guide to receiving its webhooks: registering an endpoint,
verifying signatures, what counts as a failed delivery, how long Stripe
retries, and the ordering and duplicate rules a receiver has to live
with. Read as the Stripe docs page when this was written.

## Key claims

- Endpoints must be public HTTPS URLs; up to 16 per account. "You can register up to 16 webhook endpoints with Stripe." (Create an event destination for your webhook endpoint)
- Return 2xx quickly, before the slow work. "Quickly returns a successful status code (2xx) before any complex logic that might cause a timeout." (Create a handler)
- Verification needs the raw body; any framework change to it breaks the signature. "Any manipulation to the raw body of the request causes the verification to fail." (Don't manipulate the raw body request)
- Redirects count as failures. "We consider redirect responses to webhook requests as failures." (Fix HTTP status codes)
- Live-mode retries last up to three days with exponential backoff. "Stripe attempts to deliver events to your destination for up to three days with an exponential backoff in live mode." (Automatic retries)
- Manual resend works for 15 days in the Dashboard, 30 days from the CLI. "This works for up to 15 days after the event creation." (Manual retries)
- Resending from the Stripe CLI works for 30 days. "This works for up to 30 days after the event creation." (Manual retries, CLI)
- No ordering guarantee. "Stripe doesn't guarantee the delivery of events in the order that they're generated." (Event ordering)
- Don't order by timestamp; fetch the current object from the API if you need it. "Don't use created to determine event order or whether you've already processed an event." (Event ordering)
- Duplicates happen; keep the IDs you've processed. "Webhook endpoints might occasionally receive the same event more than once." (Handle duplicate events)
- Failed delivery statuses in the troubleshooting table: unable to connect, 3xx, 4xx, 5xx, TLS error, and timed out. "The destination server took too long to respond to the webhook request." (Fix HTTP status codes)
- One action can produce several events, e.g. creating a subscription. "For example, creating a subscription might generate the following events:" (Event ordering)
- `created` is in whole seconds, so events can share it. "Snapshot events record created in seconds, so distinct events can share a timestamp." (Event ordering)
- Fetch missing objects from the API. "You can also use the API to retrieve any missing objects." (Event ordering)
- Sometimes one change produces two separate events. "In some cases, two separate Event objects are generated and sent." (Handle duplicate events)
- Spot those by the object ID plus the event type. "To identify these duplicates, use the ID of the object in data.object along with the event.type." (Handle duplicate events)
- Queue events and process them asynchronously, because deliveries spike. "Any large spike in webhook deliveries (for example, during the beginning of the month when all subscriptions renew) might overwhelm your endpoint hosts." (Handle events asynchronously)
- The webhook route may need a CSRF exemption. (Exempt webhook route from CSRF protection)
- TLS 1.2 or 1.3 only. "Stripe webhooks support only TLS versions v1.2 and v1.3." (Receive events with an HTTPS server)
- Rolling the secret: the old one can stay valid for up to 24 hours, and Stripe signs with each active secret. "Stripe generates one signature per secret until expiry." (Roll endpoint signing secrets periodically)
- A timestamp is part of what's signed, to stop replays. "Because this timestamp is part of the signed payload, it's also verified by the signature, so an attacker can't change the timestamp without invalidating the signature." (Preventing replay attacks)
- Libraries default to a five-minute tolerance. "Our libraries have a default tolerance of 5 minutes between the timestamp and the current time." (Preventing replay attacks)
- A tolerance of 0 turns the check off. "Using a tolerance value of 0 disables the recency check entirely." (Preventing replay attacks)
- Each retry gets a new timestamp and signature. "If Stripe retries an event (for example, your endpoint previously replied with a non-2xx status code), then we generate a new signature and timestamp for the new delivery attempt." (Preventing replay attacks)
- Without verification, anyone can send fake events. "Without verification, an attacker could send fake webhook events to your endpoint to trigger actions like fulfilling orders, granting account access or modifying records." (Verify events are sent from Stripe)

## Visuals worth redrawing

None.

## My notes

- The page's example of an old API version is a calendar date; don't
  copy it.
- The exact `Stripe-Signature` header format is in a collapsed section
  that didn't come through; not used.
