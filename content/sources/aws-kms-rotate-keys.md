---
id: aws-kms-rotate-keys
title: Rotate AWS KMS keys
author: Amazon Web Services
url: https://docs.aws.amazon.com/kms/latest/developerguide/rotate-keys.html
kind: docs
primary: true
---

## Summary

How rotation of a KMS key works in AWS KMS: new key material under the
same key ID, old material kept to decrypt old ciphertext, and what
rotation does not do (it doesn't touch data keys or re-encrypt data).
Also why AWS thinks wrapping keys rarely need rotating for
cryptographic reasons.

## Key claims

- Automatic rotation generates new key material every year by default; the period can be customised, and on-demand rotation exists. "By default, when you enable automatic key rotation for a KMS key, AWS KMS generates new cryptographic material for the KMS key every year." (intro)
- Old material is kept and chosen automatically on decrypt. "When you use the rotated KMS key to decrypt ciphertext, AWS KMS uses the key material that was used to encrypt it." (intro)
- Rotation doesn't touch data keys or data. "It does not rotate the data keys that the KMS key generated or re-encrypt any data protected by the KMS key." (Note)
- So it doesn't help if a data key leaked. "Key rotation will not mitigate the effect of a compromised data key." (Note)
- Data keys should be used once or a few times, to avoid key exhaustion. "It's best to use data keys once, or just a few times, to mitigate this key exhaustion." (Why rotate KMS keys?)
- Wrapping keys are used far less than data keys. "As such, they are used far less often than data keys, and are almost never reused enough to risk key exhaustion." (Why rotate KMS keys?)
- Rotation is often required by rules rather than cryptography. "you might be required to rotate your KMS keys due to business or contract rules or government regulations." (Why rotate KMS keys?)
- The key keeps its identity across rotations. "The KMS key is the same logical resource, regardless of whether or how many times its key material changes." (intro)

## Visuals worth redrawing

- The key rotation diagram (key ID stays, key material changes).

## My notes

- The "millions of messages" exhaustion claim is stated loosely, with no
  exact limit. Don't turn it into a number in an article.
