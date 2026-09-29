---
id: aws-sigv4-create-signed-request
title: Create a signed AWS API request
author: Amazon Web Services
url: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_sigv-create-signed-request.html
kind: docs
primary: true
---

## Summary

The step-by-step SigV4 recipe: build a canonical request, hash it, build
a string to sign, derive a signing key with chained HMACs, sign, and
attach the result. Good for seeing how much work goes into making both
sides produce the same bytes.

## Key claims

- The canonical request is six parts joined by newlines: method, URI, query string, headers, signed header list, payload hash. "To create a canonical request, concatenate the following strings, separated by newline characters." (Create a canonical request)
- Query parameters are encoded and then sorted by name. "You must also sort the parameters in the canonical query string alphabetically by key name." (Create a canonical request)
- Header names lowercased and sorted; values trimmed, runs of spaces collapsed. "convert sequential spaces to a single space." (Create a canonical request)
- Host and x-amz-* headers must be signed; others are optional but help against tampering. "only the host and any x-amz-* headers are required; however, in order to prevent data tampering, you should consider including additional headers in the signature calculation." (Note)
- Don't sign headers that proxies change; the page lists connection, x-amzn-trace-id, user-agent, keep-alive, transfer-encoding and others. "Do not include hop-by-hop headers that are frequently altered during transit across a complex system." (Note)
- The payload is covered by its SHA-256 hash in hex. "A string created using the payload in the body of the HTTP request as input to a hash function." (HashedPayload)
- Platform URI encoders differ, so AWS says to write your own. "We recommend that you write your own custom UriEncode function to make sure that your encoding will work." (UriEncode, Important)
- The string to sign has the algorithm, the time, the credential scope and the hash of the canonical request. "Create a string to sign with the canonical request and extra information such as the algorithm, request date, credential scope, and the hash of the canonical request." (Summary of signing steps)
- The signing key comes from a chain of four HMAC-SHA256 calls over date, Region, service and "aws4_request", starting from "AWS4" plus the secret. "perform a succession of keyed hash operations (HMAC) on the request date, Region, and service, with your AWS secret access key as the key for the initial hashing operation." (Derive a signing key)
- SigV4a signs with ECDSA using a private key derived from the secret. "signature = base16 ( ECDSA-Sign (k, string-to-sign ))" (Calculate the signature, SigV4a)
- The signature is one more HMAC, in lowercase hex. "signature = hash(SigningKey, string-to-sign)" (Calculate the signature)

## Visuals worth redrawing

- The whole pipeline (canonical request → hash → string to sign; secret →
  date key → region key → service key → signing key; HMAC → signature)
  is a good figure. The page has none.

## My notes

- The signed header list is sent too, so the verifier knows which
  headers were covered and rebuilds exactly the same canonical request.
