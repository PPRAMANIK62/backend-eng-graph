---
id: go-context
title: context package
author: The Go Authors
url: https://pkg.go.dev/context
kind: docs
primary: true
---

## Summary

The Go standard library's `context` package (docs for go1.27.1): the
type that carries a deadline and a cancellation signal from an
incoming request down through every call it makes.

## Key claims

- What a Context carries. "Package context defines the Context type, which carries deadlines, cancellation signals, and other request-scoped values across API boundaries and between processes." (Overview)
- Incoming requests create one, outgoing calls take one, everything between passes it on. "Incoming requests to a server should create a Context, and outgoing calls to servers should accept a Context." (Overview)
- Cancelling a context cancels everything derived from it. "When a Context is canceled, all Contexts derived from it are also canceled." (Overview)
- A context with a deadline is cancelled when it passes. "A Context with a deadline is canceled after the deadline passes." (Overview)
- Not calling the cancel function leaks the child context. "Failing to call the CancelFunc leaks the child and its children until the parent is canceled." (Overview)
- A child's deadline can only be the same or earlier than its parent's. "WithDeadline returns a derived context that points to the parent context but has the deadline adjusted to be no later than d." (WithDeadline)
- A timeout is a deadline of now plus the duration. "WithTimeout returns WithDeadline(parent, time.Now().Add(timeout))." (WithTimeout)
- Pass it explicitly as the first parameter. "Do not store Contexts inside a struct type; instead, pass a Context explicitly to each function that needs it." (Overview)
- `WithoutCancel` (added in Go 1.21) makes a context that outlives its parent's cancellation and has no deadline. "WithoutCancel returns a derived context that points to the parent context and is not canceled when parent is canceled." (WithoutCancel)

## Visuals worth redrawing

None.

## My notes

- gRPC-Go reads the deadline from this context and sends it as
  `grpc-timeout` (see grpc-deadlines: propagation is on by default in
  Go).
