---
id: boats-why-async-rust-2023
title: Why async Rust?
author: without.boats
url: https://without.boats/blog/why-async-rust/
kind: blog
primary: true
---

## Summary

A long post (2023) by the person who drove the design of Rust's
async/await between 2017 and 2019. Defines the terms (cooperative vs
preemptive, stackful vs stackless coroutines, green threads, function
coloring), explains why Rust dropped its green threads before 1.0, how
Rust futures became poll-based state machines instead of callbacks, and
why async/await with Pin was the result. Also says plainly that
async/await isn't the right choice for every language.

## Key claims

- Why user-space concurrency exists: kernel context switches are expensive and OS threads have large preallocated stacks. "Context-switching between the kernel and userspace is expensive in terms of CPU cycles." (Some background on terminology)
- The second cost is the stack. "OS threads have a large pre-allocated stack, which increases per-thread memory overhead." (Some background on terminology)
- The general fix: non-blocking I/O plus many tasks scheduled on one OS thread. "The solution is to use a non-blocking IO interface and schedule many concurrent operations on a single OS thread." (Some background on terminology)
- First design axis: cooperative or preemptive scheduling. "The first axis of choice in this design space is between cooperative and preemptive scheduling." (terminology)
- Goroutines have a thread's API but are implemented by the language; elsewhere they're called virtual or green threads. "They have an API that is the same as a thread, but it is implemented as part of the language instead of as an operating system primitive, and in other languages they are often called virtual threads or else green threads." (terminology)
- A stackful coroutine has its own stack that is saved on yield; a stackless one keeps its resume state in a continuation or state machine. "A stackless coroutine on the other hand stores the state it needs to resume in a different way, such as in a continuation or in a state machine." (terminology)
- Green threads and stackful coroutines can avoid function coloring. "Both green threads and stackful coroutine mechanisms can avoid this outcome" (terminology)
- A Rust async function compiles to a function returning a Future that stores the coroutine's state. "an async function is compiled to a function which returns a Future, and that future is what is used to store the state of the coroutine when it yields control." (terminology)
- Rust had green threads and removed them in late 2014, before 1.0. "It was removed in late 2014, shortly before the 1.0 release." (Green threads)
- Segmented stacks make pushing a frame unpredictably expensive, and both Rust and Go abandoned them. "Both Rust and Go started with segmented stacks, and then abandoned this approach for these reasons." (Green threads)
- The hot-loop case: a call in a loop that crosses a segment boundary allocates and frees a segment every iteration. "A particularly pernicious version of this is when a function call in a hot loop requires allocating a new segment." (Green threads)
- Go copies stacks, which works because Go pointers into a stack only live in that stack. "Go uses stack copying, and benefits from the fact that in Go pointers into a stack can only exist in the same stack, so it just needs to scan that stack to rewrite pointers." (Green threads)
- Rust couldn't copy stacks without a garbage collector, so its green threads got large stacks, losing their main advantage. "Instead, Rust solved the problem of segmented stacks by making its green threads large, just like OS threads." (Green threads)
- Green threads cost extra at FFI boundaries, since C code expects the OS stack. "Switching code from executing on a green thread to running on the OS thread stack can be prohibitively expensive for FFI." (Green threads)
- Go accepts that FFI cost; C# dropped a green threads experiment over it. "Go just accepts this FFI cost; C# recently aborted an experiment with green threads for this reason." (Green threads)
- Most languages compile async/await into continuation passing style (callbacks). "the async/await syntax of most languages is compiled into this sort of continuation passing style." (Futures)
- Rust futures are polled by an executor instead of calling a continuation, and store a way to wake the executor when pending. "Instead of storing a continuation, a future is polled by some external executor." (Futures)
- A compiled future is a perfectly sized stack. "the state machine is a “perfectly sized stack”" (Async/await)
- The point of the coroutine transform is to write code as if it never yields and let the compiler build the state machine. "the whole point of the coroutine transform is to write imperative code “as if your function never yields,” but have the compiler generate the state transitions to suspend it when it would block." (Organizational considerations)
- Hand-written state machines are error-prone; a curl CVE came from state not saved across a transition. "This kind of logic error is easy to make when implementing a state machine by hand." (Organizational considerations)
- Rust shipped an async/await MVP in 2019, and Tokio 1.0 came in 2020. "We shipped an MVP in 2019, tokio shipped a 1.0 in 2020" (To be continued)
- The author doesn't think async/await is right for every language. "I don’t believe async/await is the right alternative to any language." (To be continued)

## Visuals worth redrawing

None. A stackful vs stackless comparison (a growable stack per task vs
one struct per future holding only the live variables) is worth drawing.

## My notes

- Byline on the page is "without.boats"; the author drove the Rust
  async/await design (2017 to 2019), so primary for Rust's reasons.
- Rust's own removal is RFC 230 (2014); opened it, not cited separately.
