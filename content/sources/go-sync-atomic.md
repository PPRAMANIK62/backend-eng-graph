---
id: go-sync-atomic
title: "sync/atomic package documentation"
author: The Go Authors
url: https://pkg.go.dev/sync/atomic
kind: docs
primary: true
---

## Summary

Docs for Go's atomic operations (read at go1.27.1): swap,
compare-and-swap, add, load, store, and the typed wrappers. States their
place in the memory model: they synchronize, and all of them together
behave as one sequentially consistent order.

## Key claims

- Low level, and easy to get wrong. "These functions require great care to be used correctly." (package overview)
- Prefer channels or sync. "Except for special, low-level applications, synchronization is better done with channels or the facilities of the sync package." (package overview)
- The Go proverb. "Share memory by communicating; don't communicate by sharing memory." (package overview)
- Compare-and-swap is the atomic equivalent of: if *addr == old { *addr = new; return true }; return false. (package overview)
- Memory model semantics. "if the effect of an atomic operation A is observed by atomic operation B, then A “synchronizes before” B." (package overview)
- atomic.Bool (added in go1.19) has Load, Store, Swap and CompareAndSwap. "A Bool is an atomic boolean value. The zero value is false." (type Bool)
- Same as C++ seq_cst and Java volatile. "This definition provides the same semantics as C++'s sequentially consistent atomics and Java's volatile variables." (package overview)
- The add operation. "AddInt64 atomically adds delta to *addr and returns the new value." (func AddInt64)
- Load and store are the atomic versions of a plain read and write: "The load and store operations, implemented by the LoadT and StoreT functions, are the atomic equivalents of" return *addr and *addr = val. (package overview)
- All atomics form one order. "Additionally, all the atomic operations executed in a program behave as though executed in some sequentially consistent order." (package overview)
- 64-bit alignment on 32-bit platforms. "On ARM, 386, and 32-bit MIPS, it is the caller's responsibility to arrange for 64-bit alignment of 64-bit words accessed atomically via the primitive atomic functions (types Int64 and Uint64 are automatically aligned)." (Bugs)

## Visuals worth redrawing

None.

## My notes

- Go offers no acquire/release or relaxed atomics: only the
  sequentially consistent kind.
