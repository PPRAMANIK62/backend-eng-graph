---
id: aws-kms-cryptography-essentials
title: AWS KMS cryptography essentials
author: Amazon Web Services
url: https://docs.aws.amazon.com/kms/latest/developerguide/kms-cryptography.html
kind: docs
primary: true
---

## Summary

The AWS KMS developer guide's page on the cryptography behind KMS: key
generation in HSMs, AES-256-GCM for symmetric operations, and an
"Envelope encryption" section defining the idea, the root key at the
top of the chain, and why envelopes help.

## Key claims

- Definition. "Envelope encryption is the practice of encrypting plaintext data with a data key, and then encrypting the data key under another key." (Envelope encryption)
- Keys can be layered, but one key at the top stays plaintext: the root key. "But, eventually, one key must remain in plaintext so you can decrypt the keys and your data." (Envelope encryption)
- KMS root keys never leave its HSMs unencrypted; you call KMS to use one. "To use a KMS key, you must call AWS KMS." (Envelope encryption)
- The two values (encrypted key, ciphertext) are packaged together; the recipient decrypts the key, then the message. (Envelope encryption)
- The encrypted data key can sit next to the data. "You can safely store the encrypted data key alongside the encrypted data." (benefits: Protecting data keys)
- To put the same data under several keys, re-encrypt only the data key. "Instead of re-encrypting raw data multiple times with different keys, you can re-encrypt only the data keys that protect the raw data." (benefits: Encrypting the same data under multiple keys)
- Envelopes can mix symmetric speed with public-key role separation. (benefits: Combining the strengths of multiple algorithms)
- Symmetric operations inside the KMS HSMs use AES-GCM with 256-bit keys. (Symmetric key operations)
- Root keys stay in the KMS hardware security modules. "Root key stored in AWS KMS, known as AWS KMS keys, never leave the AWS KMS FIPS 140-3 Security Level 3 validated hardware security modules unencrypted." (Envelope encryption)

## Visuals worth redrawing

- "Envelope encryption" and "Envelope encryption with multiple key
  encryption keys" diagrams (Envelope encryption section).

## My notes

- Rotation behaviour is on a separate page (aws-kms-rotate-keys).
