---
id: denis-length-extension-2025
title: Length-extension attacks are still a thing
author: Frank Denis
url: https://00f.net/2025/10/23/length-extension-attacks/
kind: blog
primary: false
---

## Summary

A 2025 post by the author of libsodium showing that H(secret || message)
with SHA-256 is not a safe MAC: anyone holding one valid token can
append data and compute a valid token for the longer message, without
the secret. Uses a real CDN token scheme as the example and gives the
fixes.

## Key claims

- SHA-256 and SHA-512 use the Merkle-Damgård construction. "SHA-256, SHA-512, and many other legacy hash functions are built using a design called the Merkle–Damgård construction." (intro)
- Given H(x), you can compute H(x || y) without knowing x. "Under certain conditions, given the value of H(x), it's possible to compute H(x || y) without knowing x." (intro)
- An attacker could append role=admin to a signed URL. "An attacker could append role=admin to the query string and generate a valid token for the new URL." (example)
- The CDN example is a demo forging a token for BunnyCDN Token Authentication. "A real example: BunnyCDN token authentication" and "Server still accepts forged token: True" (A real example)
- Secret-prefix tokens with SHA-256 are likely vulnerable. "Any service that builds authentication tokens using H(key || message) with SHA-256, SHA-512, or similar functions is likely vulnerable." (conclusion)
- HMAC is the usual fix. "The most common solution is to use the HMAC construction, which is widely supported and well-studied." (fix)
- Newer hashes don't have this problem. "Good options include: BLAKE2, BLAKE3, KMAC, SHAKE / TurboSHAKE, and even SipHash128 would be fine here." (fix)

## Visuals worth redrawing

None.

## My notes

- Secondary, but the author builds crypto libraries. The claim itself is
  standard.
