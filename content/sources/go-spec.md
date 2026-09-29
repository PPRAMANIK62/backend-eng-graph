---
id: go-spec
title: The Go Programming Language Specification
author: The Go Authors
url: https://go.dev/ref/spec
kind: spec
primary: true
---

## Summary

The Go language spec, read at language version go1.27. Cited here for
how channels buffer and block, and how `select` with a `default` case
turns a blocking send into a non-blocking one.

## Key claims

- A channel's capacity sets its buffer; unbuffered channels need both sides ready; buffered sends block only when full. "If the capacity is zero or absent, the channel is unbuffered and communication succeeds only when both a sender and receiver are ready. Otherwise, the channel is buffered and communication succeeds without blocking if the buffer is not full (sends) or not empty (receives)." (Channel types)
- A nil channel is never ready. "A nil channel is never ready for communication." (Channel types)
- select picks a ready case at random, else default, else blocks. "Otherwise, if there is a default case, that case is chosen. If there is no default case, the \"select\" statement blocks until at least one of the communications can proceed." (Select statements, step 2)

## Visuals worth redrawing

None.

## My notes

- A full buffered channel is a bounded queue whose "full" policy is
  block. Adding `default` to a select turns it into drop or reject.
