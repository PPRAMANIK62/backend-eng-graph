---
id: webhooks
title: Webhooks
depth: deep
phase: 5
note: >-
  The server calls the client: retries, ordering per endpoint, and
  endpoints that are down for days.
needs: [delivery-guarantees, request-signing, retries-with-backoff, dead-letter-queue]
leads_to: [ssrf]
compare_with: [long-running-operations, openapi]
---

# Webhooks

A webhook is an HTTP request your service sends to a customer's server
when something happens: "invoice paid", "build finished". It turns the
usual direction around. Instead of the customer polling your API to ask
whether anything changed, you call them. From the outside it looks like
one POST. On the sending side it's a delivery system: it has to retry
for days, cope with endpoints that are slow, down or gone, sign every
request, and live with receivers seeing duplicates and events out of
order.

## One event, one delivery

Take a payments service. A customer has registered
`https://shop.example/hooks` and asked for `invoice.paid` events. An
invoice gets paid. Here's what a well-built sender does:

1. **Record the event** durably: an ID, a type, when it happened, and
   the data. The ID never changes, however many times the event is
   sent.
2. **Create a delivery for each endpoint** that wants this event type.
   One customer can register several endpoints (their billing system,
   their CRM, a chat channel), and each gets its own copy.
3. **A worker sends it.** It POSTs a JSON body to the URL, with headers
   that carry the event ID, the time of this attempt, and a signature
   (see [[request-signing]]).
4. **Read the answer.** A 2xx status means delivered. Anything else is a
   failure: a 4xx or 5xx, a redirect, a refused connection, a TLS error,
   or no answer before the [[timeouts|timeout]].
5. **On failure, schedule a retry** for later. After the last retry,
   move the delivery to a [[dead-letter-queue]] and tell someone.

![An event is written to an event log. A fan-out step creates one delivery per subscribed endpoint, and each goes into that endpoint's delivery queue. A worker signs and POSTs it. A 2xx answer marks it delivered. An error, a redirect or a timeout sends it to a retry schedule with exponential backoff and jitter, which hands it back to the worker for the next attempt. After the last attempt it goes to a dead-letter queue, from which it can be replayed, and the endpoint's owner is notified.](img/webhooks-delivery-pipeline.svg)

*The parts of a webhook sender. Each endpoint has its own queue, so one broken endpoint doesn't hold up the others.*

Step 1 happens before any network call on purpose. If you POST to the
customer inside the request that paid the invoice, your API's latency
now depends on their server, and if your process dies between saving
the payment and sending the webhook, the event is gone. Writing the
event in the same [[transaction]] as the change is the
[[transactional-outbox]] pattern.

Providers are strict about what counts as success. Only 2xx counts.
Stripe, Shopify and the Standard Webhooks spec all treat a redirect as a
failure: update the URL instead. They're strict about time too. GitHub
gives the receiver 10 seconds. Shopify allows one second to connect and
five for the whole request. The Standard Webhooks spec suggests a
timeout between 15 and 30 seconds. That's why GitHub, Stripe and
Shopify all tell receivers the same thing: check the signature, put the
event on your own [[message-queue|queue]], answer 2xx, and do the real
work afterwards.

## Retrying for days

Endpoints fail all the time: a deploy, an outage, a bug, an expired
certificate. So senders retry, with growing gaps and some randomness
([[retries-with-backoff]]), for a long time. How long varies a lot:

| Sender | Automatic retries |
|---|---|
| Standard Webhooks (recommended) | 10 attempts: at once, then after 5 s, 5 min, 30 min, 2 h, 5 h, 10 h, 14 h, 20 h and 24 h. The last one is about 75 hours after the first. |
| Stripe (live mode) | Up to three days, with exponential backoff. |
| Shopify | 8 retries over 4 hours. Then subscriptions created through its Admin API are deleted, and the developer gets an email. |
| GitHub | None. You redeliver by hand, or with a script that lists failed deliveries through the API. |

A schedule that runs for days is what lets a customer survive a weekend
outage without losing events. After the last attempt, the Standard
Webhooks spec says to tell the endpoint's owner some other way (by
email, say) and to consider disabling the endpoint. It also says to let
customers list failed deliveries and replay them, one at a time or a
whole time range. Stripe lets you resend an event by hand for up to 15
days from its Dashboard, or 30 days from its CLI.

The status code should change what the sender does next. The Standard
Webhooks spec suggests:

- **410 Gone:** the receiver doesn't want these anymore. Disable the
  endpoint.
- **429, 502 or 504:** the receiver is overloaded. Slow down (see
  [[rate-limiting]]).
- **A `Retry-After` header:** take it into account when scheduling the
  next attempt.
- **Anything else that isn't 2xx:** a normal failure. Retry on
  schedule.

## Duplicates are normal

Retrying means [[delivery-guarantees|at-least-once delivery]]. The
worst case is easy to hit: the receiver processes the event, then its
2xx is lost or arrives after the sender's timeout. The sender sees a
failure and sends the event again. Stripe, Shopify and the Standard
Webhooks spec all say receivers will sometimes get the same event
twice.

The fix is an ID that stays the same across retries, and a receiver
that remembers which IDs it has handled:

- Standard Webhooks sends it as `webhook-id`, and says to use it as an
  [[idempotency-keys|idempotency key]].
- GitHub's `X-GitHub-Delivery` stays the same when you ask for a
  redelivery.
- Shopify sends two: `X-Shopify-Webhook-Id` for one delivery, and
  `X-Shopify-Event-Id` shared by the deliveries of one event to several
  subscriptions.
- Stripe says to log the event IDs you've processed. It also notes that
  one change can occasionally produce two separate events, which you
  spot by the object's ID plus the event type.

The other option is to make processing [[idempotency|idempotent]], so a
second copy changes nothing: "mark invoice 42 paid" is safe to repeat,
"add 10 to the balance" isn't.

## Order isn't promised

Stripe doesn't guarantee that events arrive in the order they happened.
Creating a subscription, for example, produces several events, and they
can arrive in any order. Stripe also warns not to sort by the event's
`created` field, because it's recorded in whole seconds and two events
can share it.

The delivery model explains why. Event 1 fails and is scheduled for a
retry in five minutes. Event 2 goes out now and succeeds. Now the
receiver has seen 2 before 1. Several workers sending to the same
endpoint in parallel do the same thing on a smaller scale.

A sender *can* keep order per endpoint: send one delivery at a time,
and don't send event 2 until event 1 has succeeded. The cost is
[[head-of-line-blocking]]. While event 1 waits out its retries, every
later event for that endpoint waits too, and throughput to that endpoint
drops to one request per round trip. And a dead-lettered event breaks
the order anyway: either the queue stops until someone deals with it,
or the events behind it go ahead.

Receivers usually get around this by treating a webhook as a hint.
When an event arrives, fetch the current state of the object from the
API and act on that, instead of trusting the order of events. Stripe
suggests exactly that for missing objects. It fits well with **thin
payloads**, which carry only IDs, as opposed to **full payloads**,
which carry the data. Full payloads save the receiver an API call.
Thin payloads are smaller, and they don't send the data to every
endpoint that listens: the receiver has to ask for it, which you can
restrict and audit. You can also turn a thin payload into a full one
later, but not the other way round. Standard Webhooks suggests keeping
payloads under about 20 kB either way.

## Securing both ends

**The receiver has to check who sent it.** A webhook endpoint is a
public URL, and without verification anyone can POST fake events to it:
"order paid, ship it". Providers sign each delivery with a secret
shared with that endpoint, usually as an [[hmac|HMAC]] of the body.

- GitHub sends an HMAC-SHA256 of the body in `X-Hub-Signature-256`. Its
  older `X-Hub-Signature` uses SHA-1 and is kept only for legacy
  receivers. There's no timestamp in the signature. For replays, GitHub
  points to the delivery ID.
- Stripe puts a timestamp inside what it signs. Its libraries reject
  events more than five minutes old by default, and a tolerance of 0
  turns the check off entirely. Each retry is signed again with a new
  timestamp.
- The signature is over the raw bytes. Stripe, Shopify and Standard
  Webhooks all warn that a framework or middleware that parses the body
  first breaks verification. GitHub adds proxies and load balancers that
  change the body or headers.
- Secrets need rotating. Standard Webhooks sends a list of signatures so
  old and new keys can overlap. Stripe can keep the old secret valid for
  up to 24 hours after you roll it, and signs with each one.

Use HTTPS as well: a signature proves who sent the body, but anyone on
the path can read it. Stripe only delivers over [[tls|TLS]] 1.2 or 1.3.

**The sender has to watch where it's calling.** Your customers choose
the URLs, and your servers call them from inside your network. That is
the textbook setup for [[ssrf]]: register a URL that points at an
internal service or your cloud's metadata endpoint, and your webhook
worker calls it for them. The Standard Webhooks spec's advice is to
send every webhook through a proxy that refuses internal addresses, from
workers in their own subnet that can't reach internal services.

## Where it gets tricky

**"Delivered" means a 2xx was received, not that the work was done.**
Receivers are told to answer fast and process later. If the receiver's
own queue isn't durable, an event can be acknowledged and then lost.
From the sender's side that loss is invisible.

**Webhooks can be missed.** Endpoints get disabled, subscriptions get
deleted after failures, and retries run out. Shopify suggests a
reconciliation job that regularly fetches from the API whatever you
might have missed. Polling and webhooks work best together.

**An endpoint that's down for days is a capacity problem.** Every event
for it keeps piling up in retries. When it comes back, the backlog
arrives at once, just when the receiver is weakest. A per-endpoint rate
limit, and honouring 429 and `Retry-After`, keep the sender from
knocking it straight back over.

**Retry policies differ wildly.** Three days, four hours, or never.
If you receive webhooks from several providers, read each one's rules;
if you send them, write yours down.

**Shared-secret signatures have a limit.** With HMAC, anyone who can
verify can also sign, so a leaked receiver secret lets an attacker
forge events. The Standard Webhooks spec prefers public-key signatures
(Ed25519) for that reason. GitHub and Shopify, among others, still use
HMAC.

**A webhook is one answer to "tell me when it's done".** The other is
a status URL the client polls. See [[long-running-operations]] for when
each fits.

## What this means when you build

When you send webhooks:

- Write the event durably first, then deliver from a queue per
  endpoint.
- Only 2xx is success. Use a timeout, and retry with exponential
  backoff and jitter over days, not minutes.
- Honour 410, 429 and `Retry-After`. Rate-limit per endpoint.
- After the last attempt, dead-letter the delivery, tell a human, and
  offer replay.
- Give every event an ID that never changes, and sign
  `id.timestamp.body`.
- Call customer URLs only through a proxy that blocks internal
  addresses.
- Decide and document whether you keep order per endpoint, and what it
  costs.

When you receive them:

- Verify the signature on the raw body, check the timestamp, and
  deduplicate by ID.
- Answer 2xx quickly and do the work from your own durable queue.
- Don't depend on order. Fetch current state when in doubt, and
  reconcile on a schedule.

## Further reading

- [Standard Webhooks specification](https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md), Standard Webhooks contributors, version 1.0.0. The whole sender side in one place: payloads, signatures, retry schedule, status codes, timeouts and SSRF.
- [Receive Stripe events in your webhook endpoint](https://docs.stripe.com/webhooks), Stripe docs. A large provider's real rules: three days of retries, no ordering, duplicates, signed timestamps and secret rolling.
- [Best practices for using webhooks](https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks), GitHub docs. The receiver's checklist, and the delivery ID as replay protection.
- [Handling failed webhook deliveries](https://docs.github.com/en/webhooks/using-webhooks/handling-failed-webhook-deliveries), GitHub docs. What it looks like when the sender doesn't retry at all.
- [Validating webhook deliveries](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries), GitHub docs. An HMAC over the body, with code and a test vector.
- [Verify webhook deliveries](https://shopify.dev/docs/apps/build/webhooks/ignore-duplicates), Shopify docs. Raw bodies, two kinds of IDs, tight timeouts, and what happens after 8 failed retries.
