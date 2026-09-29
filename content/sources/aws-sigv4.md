---
id: aws-sigv4
title: AWS Signature Version 4 for API requests
author: Amazon Web Services
url: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_sigv.html
kind: docs
primary: true
---

## Summary

The overview of SigV4, the scheme every AWS API request is signed with:
what the steps are, why requests are signed, and how the asymmetric
variant SigV4a differs.

## Key claims

- Three steps: canonical request, signature, Authorization header. "Creating a canonical request based on the request details." (intro list)
- AWS repeats the same work on its side and compares. "AWS then replicates this process and verifies the signature, granting or denying access accordingly." (intro)
- The secret key isn't sent or used directly; a derived key is. "You don't use your secret access key to sign API requests. Instead, you use the SigV4 signing process." (intro)
- The derived key is scoped to one service, one Region, one day. "Symmetric SigV4 requires you to derive a key that is scoped to a single AWS service, in a single AWS region, on a particular day." (intro)
- SigV4a uses ECDSA so AWS stores only public keys. "The system uses asymmetric cryptography to verify multi-region signatures, so that AWS only needs to store your public keys." (How AWS SigV4a works)
- Signing protects identity, integrity in transit, and against replay. "To prevent tampering with a request while it's in transit, some of the request elements are used to calculate a hash (digest) of the request, and the resulting hash value is included as part of the request." (Why requests are signed)
- Replay window: five minutes. "In most cases, a request must reach AWS within five minutes of the time stamp in the request. Otherwise, AWS denies the request." (Why requests are signed)
- Use an SDK unless you have a reason not to. "Unless you have a good reason not to, we recommend that you always use an SDK or the CLI." (Important)

## Visuals worth redrawing

None.

## My notes

- The step-by-step details are on `aws-sigv4-create-signed-request`.
