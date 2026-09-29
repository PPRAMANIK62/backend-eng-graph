---
id: pike-concurrency-not-parallelism-2012
title: Concurrency is not Parallelism (slides)
author: Rob Pike
url: https://go.dev/talks/2012/waza.slide
kind: talk
primary: true
---

## Summary

Rob Pike's talk at Heroku's Waza conference (2012), one of Go's
designers. Defines concurrency as a way to structure a program out of
independently executing pieces, and parallelism as running things at the
same time. Uses gophers burning manuals to show that one concurrent
design can run with no parallelism, or be parallelized many ways. Read
as the published slide deck on go.dev.

## Key claims

- Concurrency is composing independently executing processes. "Programming as the composition of independently executing processes." (slide 5)
- Parallelism is simultaneous execution. "Programming as the simultaneous execution of (possibly related) computations." (slide 6)
- The one-line version. "Concurrency is about dealing with lots of things at once." and "Parallelism is about doing lots of things at once." (slide 7)
- Structure vs execution. "Concurrency is about structure, parallelism is about execution." (slide 7)
- Examples: device drivers (mouse, keyboard, display, disk) are concurrent; a vector dot product is parallel. (slide 8)
- The confusion when Go came out: a user's prime sieve got slower on 4 processors. "I ran the prime sieve with 4 processors and it got slower!" (slide 4)
- A concurrent design isn't automatically parallel, but it is parallelizable. "This design is not automatically parallel!" (slide 16)
- With only one gopher active at a time it's still correct. "even if only one gopher is active at a time (zero parallelism), it's still a correct and concurrent solution." (slide 22)
- Goroutines are multiplexed onto OS threads; a blocked goroutine blocks its thread but no other goroutine. "When a goroutine blocks, that thread blocks but no other goroutine blocks." (slide 31)
- Conclusion. "Concurrency enables parallelism." (slide 57)

## Visuals worth redrawing

- The gopher designs (slides 11 to 26): one pile, one cart, one
  incinerator; then more gophers, more carts, staging piles. A simpler
  redraw: two tasks interleaved on one core vs two tasks on two cores.

## My notes

- The video is on Vimeo; only the slides were read.
- Harper (harper-parallelism-not-concurrency-2011) draws the line
  differently: nondeterminism vs efficiency.
