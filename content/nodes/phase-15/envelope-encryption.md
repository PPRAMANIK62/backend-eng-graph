---
id: envelope-encryption
title: Envelope encryption
depth: short
phase: 15
note: >-
  Encrypting data with a data key, and the data key with a master key.
needs: [symmetric-encryption, secrets-management]
leads_to: []
compare_with: []
---

# Envelope encryption

Envelope encryption means encrypting your data with one key, the data
key, and then encrypting that data key with a second key that lives in
a key management service (KMS). You store the encrypted data and the
encrypted data key side by side, and the second key never leaves the
KMS. It's how you encrypt a lot of data without leaving the key lying
next to it, and without shipping all the data to the KMS.

## The problem: where does the key go?

Say you store customer documents and want them encrypted at rest. The
encryption part is easy: AES-256-GCM, a form of
[[symmetric-encryption]], with a random key. The hard part is the key.

- Store the key next to the documents, and anyone who steals the
  documents steals the key too. The encryption did nothing.
- Keep the key in a KMS and send every document there to be encrypted.
  That doesn't fit what a KMS is for: it's built to hold the keys that
  protect other keys, not to process bulk data. Google Cloud KMS, for
  example, takes at most 64 KiB per Encrypt or Decrypt call.

Envelope encryption splits the job between two keys.

## Two keys, two jobs

The **data encryption key (DEK)** encrypts the data. The **key
encryption key (KEK)** encrypts the DEK, which is also called wrapping
it. The KEK stays in the KMS.

![Encrypting with an envelope. Step 1: a new random DEK is made locally. Step 2: the document is encrypted locally with the DEK using AES-256-GCM. Step 3: the DEK is sent to the KMS, which wraps it with the KEK; the KEK never leaves the KMS. Step 4: the ciphertext and the wrapped DEK are stored together, and the plaintext DEK is thrown away.](img/envelope-encryption-flow.svg)

*Encrypting with a data key and a key encryption key. Adapted from Google Cloud, "Envelope encryption" (Cloud KMS documentation).*

To encrypt:

1. Generate a fresh DEK in your own process.
2. Encrypt the document with it, locally.
3. Ask the KMS to wrap the DEK with the KEK.
4. Store the ciphertext and the wrapped DEK together. Never store the
   plaintext DEK.

To decrypt, you read both back, send the wrapped DEK to the KMS to be
unwrapped, and decrypt the document locally with the DEK it returns.

Only a small key crosses the network, in both directions. And every
unwrap is a request the KMS can refuse or log, so the KMS becomes the
one place where you control and audit who can read the data. That ties
envelope encryption to [[secrets-management]]: the KEK is the secret
you guard, and the DEKs are safe to store because they're wrapped.

You can wrap KEKs with more keys, in layers. But at the top of any
chain, one key has to exist in plaintext somewhere, or nothing could be
decrypted. In AWS KMS that root key never leaves the provider's
hardware security modules unencrypted, and you use it only by calling
the KMS.

## Why it's worth the extra step

- **The wrapped DEK needs no hiding.** It's encrypted, so it can sit in
  the same row or object as the data.
- **One DEK per object.** Generating a new DEK every time you write
  means DEKs never need rotating. It also makes it easy to follow the
  rule that two users' data never share a DEK.
- **Changing keys is cheap.** To put data under a different KEK, you
  re-wrap the small DEK instead of re-encrypting the whole document.
- **Few KEKs, many DEKs.** Each object has its own key, but the KMS only
  stores a handful.

Google Cloud uses this scheme by default for customer data it stores
at rest, with its internal KMS as the keystore.

## Where it gets tricky

**Rotating the KEK doesn't re-encrypt anything.** In AWS KMS, rotating
a key creates new key material under the same key ID and keeps the old
material, which KMS picks automatically to decrypt older wrapped DEKs.
The DEKs themselves and the data don't change. So if a DEK has leaked,
rotating the KEK doesn't help: you have to re-encrypt that data under a
new DEK.

**Data keys wear out; wrapping keys hardly do.** A key that encrypts
lots of messages gets weaker, which is one reason to use each DEK once
or only a few times. A KEK only ever encrypts short DEKs,
so it's used far less. When you rotate a KEK, it's usually because a
contract or a regulation asks for it, not because the key wore out.

**The KMS is on the read path.** Every decrypt starts with an unwrap
call to the KMS. If the KMS is slow or unreachable, so is your data.
And since the KEK is the only way to unwrap, losing it, or losing access
to it, makes every DEK it wrapped unreadable, and the data with them.

## What this means when you build

- Generate a new DEK per object or per write, and encrypt with an AEAD
  such as AES-256-GCM.
- Store the wrapped DEK next to the ciphertext. Never write the
  plaintext DEK anywhere.
- Keep KEKs in a KMS. Limit which identities may unwrap, and log every
  unwrap.
- Treat KEK rotation and re-encryption as two different operations, and
  know which one a leak calls for.

## Further reading

- [Envelope encryption](https://cloud.google.com/kms/docs/envelope-encryption), Google Cloud KMS documentation. DEKs and KEKs, best practices for each, and the encrypt and decrypt steps.
- [AWS KMS cryptography essentials](https://docs.aws.amazon.com/kms/latest/developerguide/kms-cryptography.html), AWS KMS developer guide. The definition, the root key at the top of the chain, and why re-wrapping beats re-encrypting.
- [Rotate AWS KMS keys](https://docs.aws.amazon.com/kms/latest/developerguide/rotate-keys.html), AWS KMS developer guide. What rotating a KEK does and doesn't do, and why data keys should be used only a few times.
