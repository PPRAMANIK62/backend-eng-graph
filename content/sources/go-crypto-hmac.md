---
id: go-crypto-hmac
title: "crypto/hmac, Go standard library documentation"
author: The Go Authors
url: https://pkg.go.dev/crypto/hmac
kind: docs
primary: true
---

## Summary

Go package docs for HMAC (Go 1.27.1 when read). Short, with one
important rule: compare MACs in constant time.

## Key claims

- The receiver verifies by recomputing with the same key. "The receiver verifies the hash by recomputing it using the same key." (overview)
- Compare MACs with Equal to avoid timing leaks. "Receivers should be careful to use Equal to compare MACs in order to avoid timing side-channels:" (overview)
- Equal doesn't leak timing. "Equal compares two MACs for equality without leaking timing information." (func Equal)

## Visuals worth redrawing

None.

## My notes

- The docs call HMAC a way to "sign" a message; that's loose wording, a
  MAC isn't a signature (anyone who can verify can also create).
