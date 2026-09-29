---
id: request-signing
title: Request signing
depth: short
phase: 5
note: >-
  Signing a request with a shared key and a timestamp, so the receiver
  can check who sent it and refuse replays. Webhook signatures, AWS
  SigV4.
needs: [hmac, http-semantics]
leads_to: [webhooks]
compare_with: []
---

# Request signing

Request signing means the sender computes an [[hmac|HMAC]] (or a
public-key signature) over the parts of an HTTP request that matter,
plus a timestamp, and sends the result in a header. The receiver
rebuilds the same bytes, computes the same value with its copy of the
key, and compares. A match shows the request came from someone holding
the key, wasn't changed on the way, and is recent. Webhook signatures
and AWS's SigV4 both work this way.

## Signing a webhook, step by step

Take a service sending a [[webhooks|webhook]] under the Standard
Webhooks spec. When the customer registered the endpoint, the sender
generated a random secret for it, 24 to 64 bytes long, and gave the
customer a copy. For each delivery attempt the sender:

1. Takes three values: the message ID, the current time as Unix
   seconds, and the exact body bytes it will send.
2. Joins them with dots: `msg_id.timestamp.body`.
3. Computes HMAC-SHA256 of that string with the endpoint's secret.
4. Sends the body in a POST with three headers: `webhook-id`,
   `webhook-timestamp`, and `webhook-signature: v1,<base64 HMAC>`.

The receiver does the same work in reverse:

![The sender joins the message ID, the timestamp and the raw body with dots and computes HMAC-SHA256 over it with the shared secret, then sends the body with the three headers. The receiver rebuilds the same string from the headers and the raw body it received, computes the HMAC with its copy of the secret, compares the two in constant time, checks that the timestamp is within a few minutes of its clock, and checks it hasn't processed that message ID before. Only then does it parse the JSON and act.](img/request-signing-verify.svg)

*Signing and checking one webhook. Adapted from the Standard Webhooks specification, version 1.0.0.*

Each signed piece has a job:

- **The body** gives integrity: change one byte and the HMAC no longer
  matches.
- **The timestamp** limits replays. An HMAC alone has no sense of time,
  so a captured request could be sent again forever. The receiver
  rejects anything too far from its own clock. Every retry gets a fresh
  timestamp.
- **The ID** catches replays inside that window. It stays the same
  across retries of one event, so it also works as an
  [[idempotency-keys|idempotency key]].

Because the timestamp and ID are inside the signed string, an attacker
can't change them without breaking the signature.

## The hard part is agreeing on the bytes

A signature is over bytes, not meaning. Both sides must build exactly
the same bytes, or a valid request fails.

The webhook scheme keeps this simple: it signs the raw body as sent.
The receiver has to verify the bytes it received before parsing them.
A common mistake is to parse the JSON and serialize it again first;
small differences in how JSON is written out are enough to fail.

AWS SigV4 signs much more of the request, so it defines a canonical
form: the method, the encoded path, the query parameters encoded and
sorted, the chosen headers lowercased, sorted and trimmed, the list of
signed headers, and the SHA-256 of the body. `Host` and `x-amz-*`
headers must be signed; headers that proxies change on the way, like
`connection` or `user-agent`, must not be. Standard-library URI encoders differ, so AWS advises
writing your own.

SigV4 also never signs with your long-term secret. It derives a key
through a chain of four HMACs, over the date, the region, the service
and a fixed string, so the key that signs is good for one service, in
one region, on one day. A request must reach AWS within five minutes of
its timestamp.

RFC 9421 (2024) makes this a general HTTP standard. You choose which
parts of the message to cover, and the result goes in `Signature-Input`
and `Signature` headers, with optional `created`, `expires` and `nonce`
values. Its canonical rules survive what proxies are allowed to do, like
reordering headers or changing their case. Parsing a covered value and
writing it back out does not survive.

## Where it gets tricky

**Whatever you don't sign can be changed.** An attacker can add or
alter any unsigned header or parameter, and the signature still
checks. Sign everything you act on. RFC 9421 doesn't cover the body
directly: you sign a `Content-Digest` header, and the receiver must also
check that digest against the body, or someone can swap the body and
keep the header.

**With a shared key, the verifier can forge.** Anyone who can check an
HMAC can also make one. If a receiver's copy of the key leaks, the
attacker can sign as the sender. The fix is
[[public-key-crypto|asymmetric signatures]] (Ed25519, say), where the
receiver holds only a public key. Standard Webhooks and RFC 9421 both
prefer them. AWS also has
SigV4a, which uses ECDSA so that AWS stores only public keys. HMAC stays
popular anyway: it's fast and available everywhere.

**Clocks decide the replay window.** The timestamp check needs the
receiver's clock to be roughly right (see [[clock-skew]]), and inside the window only the
remembered IDs stop a replay.

**Signing isn't encryption.** The body travels in the clear. Use
[[tls|TLS]] as well.

**Why not rely on TLS alone?** TLS protects one connection. A request
that passes through a TLS-terminating [[reverse-proxy|proxy]] crosses several, and TLS
says nothing end to end.

## What this means when you build

- Sign `id.timestamp.body` with HMAC-SHA256 and a random key per
  endpoint or per client. Send a list of signatures so you can rotate
  keys without downtime.
- Verify on the raw bytes before parsing. Compare in constant time.
  Reject old timestamps, and remember recent IDs.
- If you sign more than the body, write the canonical form once, share
  it between sender and receiver, and test both against fixed examples.
- Use public-key signatures when you don't control the receivers or
  there are many of them.
- Check what [[http-semantics|HTTP]] lets intermediaries change before
  you decide which headers to sign.

## Further reading

- [Standard Webhooks specification](https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md), Standard Webhooks contributors, version 1.0.0. A complete, small signing scheme for webhooks, with the reasons for each part.
- [AWS Signature Version 4 for API requests](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_sigv.html), AWS docs. Why AWS signs every request, the scoped key, SigV4a and the five-minute window.
- [Create a signed AWS API request](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_sigv-create-signed-request.html), AWS docs. The full canonical request and key derivation, step by step.
- [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421), A. Backman, J. Richer and M. Sporny (editors), IETF, 2024. The general HTTP standard, and a security section that lists what goes wrong with request signing.
