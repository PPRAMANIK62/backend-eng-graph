---
id: memory-model
title: Memory models
depth: deep
phase: 4
note: >-
  When one thread's writes become visible to another. Atomics and
  happens-before.
needs: [race-condition, cpu-cache]
leads_to: [lock-free-structures, race-detector, atomics]
compare_with: []
---

# Memory models

A memory model is the contract that says when a write made by one
[[thread]] becomes visible to another thread, and in what order. Without
it, you can't say what any program that shares memory will do, because
both the CPU and the compiler reorder memory operations to go faster.
The contract every modern language offers is short: if your program has
no data races, it behaves as if the threads took turns on one core.

## A flag that should work, and doesn't

Here's a common way to hand a value from one thread to another. All
variables start at zero.

```text
// Thread 1              // Thread 2
x = 1                    while done == 0 { }
done = 1                 print(x)
```

Thread 1 writes the value, then raises a flag. Thread 2 waits for the
flag, then reads the value. It looks like it must print 1. It can print
0, and it can loop forever.

- **The compiler** may load `done` into a register once and never read
  memory again, so thread 2's loop never sees the change.
- **The compiler** may also reorder the two writes in thread 1, or move
  the read of `x` in thread 2 above the loop. Each thread on its own
  behaves the same either way, and that's all the compiler checks.
- **The CPU** may do its own reordering. Translated line for line into
  assembly, the program always prints 1 on x86, but can print 0 on ARM
  or POWER.

A memory model is what tells you which of these are allowed, and how to
write the program so none of them can happen.

## The model you'd want: sequential consistency

The simplest model, defined by Leslie Lamport in 1979, is sequential
consistency. A run of the program must give the same result as some
single interleaving of all the threads' operations, with each thread's
operations in program order. You can reason about it by imagining one
shared memory that serves one read or write at a time.

Under sequential consistency the flag program always prints 1. That's
the model people assume without thinking. No major CPU provides it
today, because giving it up makes the hardware faster.

Memory models are compared with **litmus tests**: a tiny program and a
yes/no question, "can this outcome happen?" Two of them explain most of
what matters.

**Message passing.** Thread 1 does `x = 1; y = 1`. Thread 2 does
`r1 = y; r2 = x`. Can thread 2 see `r1 = 1, r2 = 0`, the flag without
the data? That's the program above.

**Store buffering.** Thread 1 does `x = 1; r1 = y`. Thread 2 does
`y = 1; r2 = x`. Can both reads return 0? Under sequential consistency
one of the writes comes first, so at least one read must see a 1.

| Can it happen? | Sequential consistency | x86 | ARM, POWER | Plain variables in C, Go, Java... |
|---|---|---|---|---|
| Message passing, `r1 = 1, r2 = 0` | no | no | yes | yes |
| Store buffering, `r1 = 0, r2 = 0` | no | yes | yes | yes |

## What real CPUs do

On x86 each core puts its writes in a queue before they reach shared
memory. The core carries on with the next instruction while the write
drains. A read checks the core's own queue first, then memory, but it
can't see other cores' queues. All cores do agree on the order in which
writes land in memory. The model is called total store order (TSO).

![Two cores. Core 1 runs x = 1 then r1 = y; core 2 runs y = 1 then r2 = x. Each write sits in its own core's write queue, marked as waiting. Each read goes straight to shared memory, where x and y are still 0. The result, r1 = 0 and r2 = 0, is impossible under sequential consistency but allowed on x86 and on ARM/POWER.](img/memory-model-store-buffer.svg)

*Store buffering on x86: each core's write is still queued when the other core reads. Adapted from Russ Cox, "Hardware Memory Models" (2021), which adapts it from Maranget et al.*

That's how store buffering gives `r1 = 0, r2 = 0` on x86. Message
passing still works there, because each core's queue drains in order
and everyone agrees on that order.

ARM and POWER are weaker. Think of each core as having its own copy of
memory, with writes spreading to the others one at a time and in any
order. Now message passing fails too: thread 2 can learn about `y = 1`
before `x = 1`.

Even the weakest hardware keeps one promise, **coherence**: for a
single memory location, all cores agree on the order of writes to it.
How caches keep copies of one line in step is covered in
[[cpu-cache]]. Coherence is about one location. The flag bug involves
two, `x` and `done`, and that's where the orderings differ.

To force order where it matters, CPUs have **memory barriers** (also
called fences): instructions that make earlier memory operations
complete before later ones. With a barrier between the write and the
read in each thread, store buffering can no longer give two zeros.

## Compilers are weaker still

A compiler may reorder ordinary reads and writes of different variables
however it likes, as long as a single thread can't tell. That makes
compiled code with plain variables weaker than any hardware: it doesn't
even keep coherence, since two reads of the same variable can be
swapped.

There are limits the other way too. A compiler must not invent writes
that weren't in the program, or make one read return two different
values. Go's memory model spells this out: a compiler can't turn
`*p = 1; if cond { *p = 2 }` into `*p = 2; if !cond { *p = 1 }`, since
another goroutine might then see a 2 that the original could never
produce. C and C++ compilers are allowed to do such things, because in
those languages a racy program has no meaning at all.

## The deal: no data races, and you get sequential consistency

Nobody wants to reason about write queues and compiler passes for every
line. The way out, from Sarita Adve and Mark Hill in 1990, is a
contract between the program and the system:

- The system provides **synchronizing operations**: lock, unlock,
  channel send and receive, atomic loads and stores.
- The program has no **data races** (see [[race-condition]]): every pair of accesses to the same
  location, from different threads, where at least one is a write, is
  ordered by synchronization.
- In return, the program behaves as if it were sequentially
  consistent.

This is called **DRF-SC** (data-race-free programs get sequential
consistency). C, C++, Java, JavaScript, Rust, Swift and Go all promise
it.

"Ordered by synchronization" has a precise meaning: **happens before**.
Within one goroutine, each statement happens before the next. Between
goroutines, each synchronizing operation adds an edge. In Go:

- the `go` statement happens before the new goroutine starts;
- a send on a channel happens before the matching receive completes,
  and closing a channel happens before a receive that sees it closed;
- the n-th `Unlock` of a [[mutex]] happens before the (n+1)-th `Lock`
  returns;
- if an [[atomics|atomic operation]] observes the effect of another, the other
  happens before it.

Chain those edges together and you know which writes a read may see. A
data race is two accesses to the same location, at least one a write,
that no chain orders.

Fixing the flag program in Go takes one change. Make `done` an
`atomic.Bool`:

```go
// goroutine 1          // goroutine 2
x = 1                   for !done.Load() { }
done.Store(true)        print(x)
```

Now `x = 1` happens before `done.Store(true)` (same goroutine), which
happens before the `Load` that sees `true` (atomic synchronization),
which happens before `print(x)`. The program must print 1, and the
compiler and CPU have to emit whatever barriers make that true. The
atomic isn't only protecting `done`; it's what orders the plain write
to `x`. That's why they're better thought of as synchronizing atomics.

## Atomics come in strengths

Go has one kind of atomic: all atomic operations behave as if they ran
in one sequentially consistent order, the same as Java's `volatile` and
C++'s default atomics.

C++ (and Rust and Swift, which adopted its model) offer weaker kinds:

- **Sequentially consistent**: the default, and what Go gives you.
- **Acquire/release**: a release store is like an unlock, an acquire
  load like a lock. Enough for the flag program. It creates the same
  happens-before edges but only promises coherence, so store buffering
  can give two zeros again.
- **Relaxed**: no ordering at all. The only thing it adds over a plain
  variable is that the race isn't undefined behavior.

Acquire/release is free on x86, which is probably why it exists. The
weaker kinds are also where the subtle bugs live.

## Where it gets tricky

**Racy programs mean different things in different languages.** C and
C++ call it "DRF-SC or catch fire": a single race anywhere makes the
whole program undefined. Go promises more: a racy read of a word-sized
value returns a value some write really stored. But a race on an
interface, slice, map or string, which span several words, can still
corrupt memory. Go's advice is that races are bugs, full stop.

**Famous idioms are broken.** Double-checked locking with a plain bool
("check `done` without the lock, then take the lock") can see `done`
set and `a` not yet written. A busy loop on a plain bool may never end.
The fix is always explicit synchronization.

**x86 hides bugs.** The flag program, compiled line for line, always
works on x86 and can fail on ARM. Code tested only on x86 can hide
that bug. Hardware makes it worse: chips often behave more
strongly than their manuals promise, code comes to depend on it, and a
newer chip that uses the freedom it was always allowed breaks that
code.

**Pinning down the models took decades.** Intel's first written model
came in 2007, researchers then found real x86 chips breaking it, and
the manuals only settled on something like x86-TSO later. Languages
went through the same thing: Java's first memory model (1996) was both
too weak and too strong, and was replaced in Java 5.0 (2004). One
problem is still open: no language has managed to formally rule out
"out-of-thin-air" values that relaxed atomics seem to allow. They're
all banned informally.

**"Atomic" is overloaded.** An atomic operation can't be seen half
done, but its bigger job is ordering the rest of your memory
operations. Relaxed atomics give you the first without the second.

## What this means when you build

- In Go, share data only through channels, `sync` types or
  `sync/atomic`. A plain variable used as a flag between goroutines is
  a bug even if it works on your laptop.
- Think in happens-before edges: for any shared read, name the
  synchronization that orders it after the write.
- Don't be clever. If you need the memory model to explain why your
  code works, use a mutex or a channel instead.
- Run the tests with the [[race-detector]], which reports data races
  in exactly the sense defined above.
- Code that uses atomics directly, like [[lock-free-structures]], needs
  testing on ARM as well as x86.

## Further reading

- [Hardware Memory Models](https://research.swtch.com/hwmm), Russ Cox, 2021. Sequential consistency, x86-TSO and ARM/POWER explained with litmus tests, and where DRF-SC came from.
- [Programming Language Memory Models](https://research.swtch.com/plmm), Russ Cox, 2021. How Java, C++, Rust, Swift and JavaScript define atomics and races, and what went wrong on the way.
- [The Go Memory Model](https://go.dev/ref/mem), The Go Authors, 2022. Go's happens-before rules, what synchronizes, and what racy Go code may still do.
- [sync/atomic package documentation](https://pkg.go.dev/sync/atomic), The Go Authors, go1.27. Go's atomic operations and their place in the memory model.
