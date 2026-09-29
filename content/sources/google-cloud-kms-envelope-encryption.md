---
id: google-cloud-kms-envelope-encryption
title: Envelope encryption (Cloud Key Management Service documentation)
author: Google Cloud
url: https://cloud.google.com/kms/docs/envelope-encryption
kind: docs
primary: true
---

## Summary

Google Cloud's explanation of envelope encryption as used with Cloud
KMS: a data encryption key (DEK) encrypts the data, a key encryption key
(KEK) held in KMS wraps the DEK, and the wrapped DEK is stored next to
the data. Best practices for each, and the encrypt and decrypt steps.

## Key claims

- Definition. "An example of multiple layer of keys is envelope encryption, which is the process of encrypting a key with another key." (Introduction)
- Google Cloud already encrypts stored customer content this way at the storage layer. "By default, at the storage layer, Google Cloud encrypts customer content stored at rest using envelope encryption, with Google's internal key management service as the central keystore." (Introduction)
- The DEK encrypts the data. "The key used to encrypt data itself is called a data encryption key (DEK)." (Data encryption keys)
- DEK practices: generate locally, keep encrypted at rest, store near the data, new DEK on every write so it never needs rotating, never share a DEK between users, AES-256-GCM. "Generate a new DEK every time you write the data. This means you don't need to rotate the DEKs." (Data encryption keys)
- The KEK wraps the DEK. "The DEK is encrypted (also known as wrapped) by a key encryption key (KEK)." (Key encryption keys)
- KEKs are stored centrally and rotated regularly and after a suspected incident. (Key encryption keys)
- Few KEKs, many DEKs; the central key service is one place to audit and restrict access. "A central key service also is a singular point to more easily audit and restrict data access." (Balancing DEKs and KEKs)
- Cloud KMS is built for KEKs: Encrypt and Decrypt take at most 64 KiB. "the maximum data input size for Encrypt and Decrypt functions is 64 KiB." (Balancing DEKs and KEKs)
- The KEK stays inside KMS. "The KEK never leaves Cloud KMS." (How to encrypt data using envelope encryption)
- Encrypt steps: generate DEK locally, encrypt data, wrap DEK with the KEK, store ciphertext and wrapped DEK. Decrypt: fetch both, unwrap the DEK in KMS, decrypt locally. (encrypt and decrypt sections)
- Never store the plaintext DEK. "Warning: Do NOT store a plaintext DEK." (encrypt section)
- Don't share a DEK across users. "Do not use the same DEK to encrypt data from two different users." (Data encryption keys)
- Cloud KMS is made for KEKs, hence the input limit. "Cloud Key Management Service was designed to manage KEKs, and thus the maximum data input size for Encrypt and Decrypt functions is 64 KiB." (Balancing DEKs and KEKs)
- KEK rotation. "Rotate keys regularly, and also after a suspected incident." (Key encryption keys)

## Visuals worth redrawing

- Encryption flow and decryption flow diagrams (encrypt and decrypt
  sections): DEK, KEK in KMS, wrapped DEK stored with the data. Redrawn
  as envelope-encryption-flow.svg.

## My notes

- The page doesn't discuss how rotating the KEK affects old wrapped
  DEKs; the AWS rotation page does.
