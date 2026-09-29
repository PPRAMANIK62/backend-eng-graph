---
id: go-bcrypt
title: golang.org/x/crypto/bcrypt
author: The Go Authors
url: https://pkg.go.dev/golang.org/x/crypto/bcrypt
kind: docs
primary: true
---

## Summary

Go's bcrypt package (golang.org/x/crypto v0.57.0): generate a hash at a
given cost, compare a password against a stored hash, read the cost back
from a hash.

## Key claims

- Implements the Provos and Mazières algorithm. "Package bcrypt implements Provos and Mazières's bcrypt adaptive hashing algorithm." (Overview)
- Cost limits and default: MinCost 4, MaxCost 31, DefaultCost 10. "DefaultCost int = 10 // the cost that will actually be set if a cost below MinCost is passed into GenerateFromPassword" (Constants)
- Passwords over 72 bytes are rejected. "ErrPasswordTooLong is returned when the password passed to GenerateFromPassword is too long (i.e. > 72 bytes)." (Variables)
- Compare with the package's own function. "Use CompareHashAndPassword, as defined in this package, to compare the returned hashed password with its cleartext version." (GenerateFromPassword)

## Visuals worth redrawing

None.

## My notes

- `Cost(hashedPassword)` reads the cost stored in the hash, which is what
  makes upgrade-on-login easy.
