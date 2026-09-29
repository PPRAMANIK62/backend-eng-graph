---
id: atomics
title: Atomic operations
depth: short
phase: 4
note: >-
  Operations the CPU does as one step, like compare-and-swap, and the
  memory ordering each one promises.
needs: [memory-model]
leads_to: [lock-free-structures]
compare_with: [mutex]
---

# Atomic operations

An atomic operation on shared memory completes in a single step as far
as other threads can tell: nobody sees it half done. Atomics are the
smallest tool for sharing data between threads. You use them directly
for counters and flags, and every lock, channel and lock-free structure
is built on top of them.

## A counter that loses updates

Two threads each run `hits++` on the same variable a million times. The
total comes out short. `hits++` is really three steps, read, add, write,
and two threads can both read 41 and both write 42. That's a
[[race-condition]]. An atomic add does the read, the add and the write
as one step, so no increment is lost.

It isn't only read-modify-write that can go wrong. On 32-bit x86, a
plain assignment to a 64-bit variable compiles to two instructions, one
for each half. A thread on another core can read the variable between
them and get a value nobody stored: half old, half new. That's a torn
write. Even a single instruction isn't always atomic: on x86, a 32-bit
store is atomic only when the address is a multiple of 4. And C and C++
promise nothing about plain variables at all.

So the rule is simple: when two threads touch the same variable at the
same time and at least one of them writes, both must use atomic
operations. Anything else is a data race.

## The operations

Go's `sync/atomic` package has the usual set. Each is the atomic version
of a few lines of ordinary code:

| Operation | Does, as one step |
|---|---|
| Load | `return *addr` |
| Store | `*addr = val` |
| Add | `*addr += delta; return *addr` |
| Swap | `old = *addr; *addr = new; return old` |
| Compare-and-swap | `if *addr == old { *addr = new; return true }; return false` |

Compare-and-swap (CAS) is the one the others lean on: it changes a
value only if nobody changed it since you looked. It's the building
block under a [[mutex]]'s fast path and under
[[lock-free-structures]]; those articles show how.

## Atomic is not the same as ordered

Making one variable atomic says nothing about the other memory around
it. Take a flag `done` that says "the result in `x` is ready". The reader
needs two things: to see the flag change at all, and, once it sees
`done`, to also see the write to `x` made before it. The first is
atomicity. The second is ordering, and that's what the
[[memory-model]] is about.

With a plain variable you get neither. The compiler may keep `done` in a
register and loop forever, and it may reorder the writes. Making `done`
atomic fixes both, because language atomics also synchronize: if one
atomic operation sees the effect of another, everything before the
first happens before everything after the second. That ordering is the
main job of atomics, more than the one variable itself.

Languages differ in how much ordering they let you give up for speed.
C++ (and Rust and Swift, which adopted its model) offers three kinds:

- **Sequentially consistent**: the default. All such operations fall
  into one order that every thread agrees on.
- **Acquire/release**: a release store works like unlocking a mutex and
  an acquire load like locking it. Weaker, and on x86 free.
- **Relaxed**: still atomic, never torn, but no ordering at all. It
  creates no happens-before edges, and the compiler and CPU may move it
  around the code near it.

Go has only the first kind: all its atomic operations behave as if they
ran in one sequentially consistent order, the same as C++'s default and
Java's `volatile`.

## Where it gets tricky

**"Atomic" means two things.** An operation can be indivisible without
ordering anything else. Relaxed atomics give you exactly that, which is
right for a statistics counter and wrong for a "data is ready" flag.

**Alignment.** Atomicity often depends on where the variable sits in
memory. In Go on 32-bit ARM, 386 and 32-bit MIPS, you have to arrange
64-bit alignment yourself for the plain 64-bit functions. The
`atomic.Int64` and `atomic.Uint64` types are aligned for you, which is
one reason to prefer them.

**Easy to get wrong.** Go's own docs say these functions need great
care, and that outside low-level code you should use channels or the
`sync` package instead. A single counter or flag is the easy case.
Anything that has to keep two variables consistent needs a lock or a
lot of careful proof.

## What this means when you build

- Use atomics for counters, flags and single values that one thread
  publishes and others read. Use a mutex for anything larger.
- In Go, use the typed atomics (`atomic.Int64`, `atomic.Bool`,
  `atomic.Pointer[T]`) rather than the old functions.
- Every access to a shared variable goes through the atomic API, reads
  included. One plain read is a data race, and the [[race-detector]]
  will report it.
- In C++ or Rust, start with the sequentially consistent default. Reach
  for acquire/release or relaxed only when you can explain why it's
  safe.

## Further reading

- [Atomic vs. Non-Atomic Operations](https://preshing.com/20130618/atomic-vs-non-atomic-operations/), Jeff Preshing, 2013. Torn reads and writes at the instruction level, alignment, and what relaxed atomics do and don't promise.
- [sync/atomic package documentation](https://pkg.go.dev/sync/atomic), The Go Authors, go1.27. Go's atomic operations, their sequentially consistent ordering, and the alignment rules.
- [Programming Language Memory Models](https://research.swtch.com/plmm), Russ Cox, 2021. Why atomics are really about ordering, and the three kinds of atomics in C++.
