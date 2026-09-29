---
id: go-crypto-cipher
title: "crypto/cipher, Go standard library documentation"
author: The Go Authors
url: https://pkg.go.dev/crypto/cipher
kind: docs
primary: true
---

## Summary

Go package docs for block cipher modes and the AEAD interface (Go
1.27.1 when read). Useful for how the AEAD contract looks in real code
and for the limits on random nonces.

## Key claims

- A nonce must be unique for all time under one key. "The nonce must be NonceSize() bytes long and unique for all time, for a given key." (AEAD, Seal)
- Open fails if anything was changed. "Open decrypts and authenticates ciphertext, authenticates the additional data and, if successful, appends the resulting plaintext to dst" (AEAD, Open)
- NewGCMWithRandomNonce (Go 1.24) picks a random 96-bit nonce and prepends it. "It generates a random 96-bit nonce, which is prepended to the ciphertext by Seal, and is extracted from the ciphertext by Open." (NewGCMWithRandomNonce)
- NewGCMWithRandomNonce is new in Go 1.24. "added in go1.24.0" (NewGCMWithRandomNonce, version badge)
- With random nonces, a key must not encrypt more than 2^32 messages. "A given key MUST NOT be used to encrypt more than 2^32 messages, to limit the risk of a random nonce collision to negligible levels." (NewGCMWithRandomNonce)
- Non-standard nonce sizes are slower and easier to misuse. "All other users should use NewGCM, which is faster and more resistant to misuse." (NewGCMWithNonceSize)

## Visuals worth redrawing

None.

## My notes

- The 2^32 limit comes from the birthday bound on 96-bit random nonces;
  the docs don't spell out the math.
