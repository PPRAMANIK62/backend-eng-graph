---
id: hmac
title: HMAC
depth: short
phase: 3
note: >-
  A keyed hash: proof that a message came from someone who holds a
  shared secret, and wasn't changed on the way.
needs: [cryptographic-hashes]
leads_to: [request-signing, jwt]
compare_with: []
---

# HMAC

HMAC is a way to turn a [[cryptographic-hashes|cryptographic hash]]
like SHA-256 into a message authentication code (MAC): a short tag that
only someone holding a secret key can compute. The sender attaches the
tag, the receiver recomputes it with the same key, and if the two match,
the message came from a key holder and wasn't changed. You'll meet it
wherever a server hands out a token it must later trust again: signed
URLs, [[cookies]], webhook and API [[request-signing|request signatures]].

## A signed URL, done wrong and done right

Say your service hands out download links that expire:
`/file?name=report.pdf&expires=1700000000`. You don't want users to edit
the expiry, so you add a tag computed from the query string and a
secret only your servers know.

The obvious tag is `SHA-256(secret + query)`. It looks safe: without the
secret, nobody can compute the hash of secret-plus-query. But SHA-256
works through its input one block at a time, and that design means
anyone who knows the hash of some input can compute the hash of that
input with more bytes added, without knowing the input. So anyone
holding one valid tag can append their own bytes to the query and
produce a valid tag for the longer string, no secret needed. This is a
**length-extension attack**, and real token schemes are open to it: a
demo against one CDN's signed-URL tokens tacked `role=admin` onto a
link, and the forged tag still checked out.

HMAC fixes this by hashing twice, with the key mixed in differently each
time:

![The HMAC construction. The key is padded to the hash's block size. In the inner hash, the padded key is XORed with the ipad constant (byte 0x36 repeated) and hashed together with the message. In the outer hash, the padded key is XORed with the opad constant (byte 0x5C repeated) and hashed together with the inner hash's output. The outer hash's output is the tag.](img/hmac-nested-hash.svg)

*HMAC is two nested hashes. Adapted from Hugo Krawczyk, Mihir Bellare and Ran Canetti, RFC 2104, "HMAC: Keyed-Hashing for Message Authentication", section 2 (1997).*

In one line: `HMAC(K, m) = H(K xor opad, H(K xor ipad, m))`. The inner
hash digests the message. The outer hash wraps that result with the key
again, so knowing one tag gives an attacker nothing to extend.

## What HMAC promises

- **Integrity.** Change one byte of the message and the tag no longer
  matches.
- **Authenticity, among key holders.** A valid tag means someone with
  the key made it.
- **Works with any good hash.** HMAC was designed so the hash inside can
  be swapped when a better one appears. Today that means HMAC-SHA256.

It doesn't promise:

- **Secrecy.** The message travels in the clear. For that you need
  [[symmetric-encryption]].
- **Who, exactly.** Everyone who can check a tag can also make one. If
  a webhook sender and receiver share a key, a tag proves the message
  came from one of the two of them, not which.
- **Freshness.** A captured message with its valid tag can be sent again.
  Put a timestamp or unique ID inside what you tag, and reject old or
  repeated ones.

## Where it gets tricky

**Compare tags in constant time.** An ordinary comparison can take
more or less time depending on how much of a guessed tag was right, and
an attacker who can measure that learns something about the real tag.
Use your library's constant-time compare, like `hmac.Equal` in Go.

**The key is the whole game.** The key should be random and at least as
long as the hash output (32 bytes for SHA-256); shorter keys weaken it,
much longer ones don't add much. A password typed by a person is not a
good HMAC key. Rotate keys from time to time.

**Tag exactly what you mean.** If you sign the parsed query parameters
but the server acts on the raw string, or the other way round, an
attacker can find a gap between the two. Decide on one byte-exact
canonical form and tag that.

**HMAC vs signatures.** When the verifier shouldn't be able to create
tags (for example, many clients checking messages from one server), you
need a [[public-key-crypto|signature]] instead.

## What this means when you build

- Use HMAC-SHA256 from your standard library for webhooks, signed URLs
  and cookies. Never `hash(secret + data)`.
- Compare tags with a constant-time function.
- Include a timestamp or nonce in the signed data and check it.
- Generate keys randomly, keep them out of source code, and plan for
  rotation (accept the old and new key for a while).

## Further reading

- [RFC 2104](https://www.rfc-editor.org/rfc/rfc2104), Hugo Krawczyk, Mihir Bellare and Ran Canetti, IETF, 1997. The HMAC definition, key rules and security argument.
- [Length-extension attacks are still a thing](https://00f.net/2025/10/23/length-extension-attacks/), Frank Denis, 2025. Why `SHA-256(secret + message)` is forgeable, with a real signed-URL example.
- [crypto/hmac](https://pkg.go.dev/crypto/hmac), the Go authors, Go 1.27. How HMAC looks in code, and why verification must use `hmac.Equal`.
