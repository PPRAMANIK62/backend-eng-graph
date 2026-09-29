---
id: api-keys
title: API keys
depth: short
phase: 15
note: >-
  Long-lived secrets that identify a calling program: stored hashed,
  prefixed so leaks can be spotted, rotated.
needs: [cryptographic-hashes]
leads_to: []
compare_with: [jwt]
---

# API keys

An API key is a long random secret that a program sends with each
request to say which account it's calling for. It's the simplest way
to let a script or another company's backend use your API. Keys live
for months or years, get pasted into config files, and leak. So the
design work is in making leaks easy to spot, cheap to survive, and
quick to fix.

## A bearer secret for a program

A key works like a password that nobody has to remember: whoever sends
it is treated as the account that owns it. There's no login step and
no user in the loop. That makes it different from a
[[sessions|session]], which starts with a person logging in, and from
a [[jwt|JWT]], which carries signed claims the server can check without
a lookup. An API key is usually an opaque random string that your
server looks up.

## Make leaked keys findable

Keys end up in public repositories, chat and logs. GitHub's secret
scanning looks for them, and the key's format decides whether a scanner
can find it reliably. GitHub's old tokens were 40 hex characters, which look
like SHA hashes, so scanners couldn't tell a token from any other hex
string. Its current format fixes that:

![A GitHub OAuth token laid out as three parts: the prefix gho_, then 30 random Base62 characters holding about 178 bits of entropy, then a 6-character CRC32 checksum in Base62, 40 characters in all. The prefix lets scanners find leaks, the checksum lets them reject fake matches offline without a database lookup, and the server keeps only a hash of the token, such as SHA-256.](img/api-keys-token-anatomy.svg)

*The parts of a GitHub token. Adapted from Indigo K, "Behind GitHub's new authentication token formats" (GitHub, 2021); the hashed storage follows GitLab's authentication guidelines.*

- **A prefix that names the issuer and the type.** `ghp_` is a GitHub
  personal access token, `gho_` an OAuth token, `ghr_` a refresh
  token. Stripe does the same: `sk_live_` is a live secret key,
  `rk_test_` a restricted test key. The underscore isn't a Base64
  character, so hashes and Base64 strings never contain one. GitHub
  expected the prefix alone to bring secret scanning's false positive
  rate down to 0.5%.
- **A checksum.** The last 6 characters are a 32-bit CRC32. A scanner
  can check it and drop random strings that happen to match the
  pattern without asking GitHub's database.
- **Enough randomness.** 30 random Base62 characters give about 178
  bits of entropy. GitHub got there in the same 40 characters as the
  old format.

## Store a hash, show it once

If your database stores keys as they are, anyone who reads it (a
leaked backup, a curious employee) can call your API as every
customer. So store a
[[cryptographic-hashes|hash]] of each key instead. When a request
arrives, hash the key it carries and look up the hash.

GitLab does exactly this: personal access tokens are stored as SHA-256
digests, and new token types aren't allowed to be stored in plain
text. The consequence users see is that the full key is shown once, at
creation. Stripe's dashboard shows a new secret key and says you can't
retrieve it later.

Why a plain SHA-256 and not a slow password hash like bcrypt? Slow
[[password-hashing]] exists because people pick guessable passwords,
and slowing each guess down is the defence once the hashes leak.
A key with 178 random bits can't be guessed in any number of tries, so
a fast hash already makes a leaked table useless, and it keeps the
lookup cheap on every request.

GitLab encrypts a few token types with AES-256-GCM instead of hashing
them (deploy tokens, CI job tokens): encryption is the choice when
your system must read the secret back.

## Limit what each key can do, and rotate

A leaked key can do whatever its account can do, so give each key
less:

- **Scopes.** Stripe's restricted keys (`rk_`) carry only the
  permissions you choose, and Stripe recommends them over unrestricted
  secret keys for new integrations.
- **Keys that are safe to publish.** Stripe's publishable keys (`pk_`)
  go into front-end code on purpose; they identify the account but
  can't charge cards or read data.
- **Expiry.** GitLab gives personal access tokens a default lifetime
  of 365 days when none is set.

Rotation replaces a key with a new one. The catch is that every
program using the old key breaks the moment it's revoked. Stripe's
answer is an overlap: after a rotation both the old and the new key
work for up to 7 days, so you can roll the new one out and then let the
old one expire. Rotate when a key may have leaked, when someone with
access leaves, or on a schedule.

## Where it gets tricky

**Prefixes don't protect anything on their own.** They make leaks
findable, and a found key still has to be revoked. GitHub asks other
token issuers to adopt the same format and join its secret scanning
program so their tokens get watched too.

**API keys aren't user authentication.** A key says "this account's
program", not "this person, just now". When an app acts for a user,
[[oauth2|OAuth]] is the better fit: the user approves, the token is
scoped and short-lived.

## What this means when you build

- Generate keys from a secure random source, with a prefix naming your
  service and the key type, and consider a checksum.
- Store only a hash (SHA-256 is enough for a long random key), and show
  the key once.
- Give keys scopes, owners and names; prefer many narrow keys (one
  per service) to one master key.
- Support two active keys per client so rotation has an overlap.
- Log key IDs, never the keys.

## Further reading

- [Behind GitHub's new authentication token formats](https://github.blog/engineering/platform-security/behind-githubs-new-authentication-token-formats/), Indigo K, GitHub, 2021. Why prefixes, a checksum and entropy, with the numbers.
- [Authentication development guidelines](https://docs.gitlab.com/development/authentication/), GitLab Docs. Which GitLab tokens are stored as SHA-256 digests and which are encrypted.
- [API keys](https://docs.stripe.com/keys), Stripe Docs. Key types and prefixes, restricted keys, show-once secrets, and rotation with a grace period.
