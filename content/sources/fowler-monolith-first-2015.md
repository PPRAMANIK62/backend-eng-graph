---
id: fowler-monolith-first-2015
title: MonolithFirst
author: Martin Fowler
url: https://martinfowler.com/bliki/MonolithFirst.html
kind: blog
primary: true
---

## Summary

Fowler's short post (2015) arguing that new systems should usually start
as a monolith and split later, because boundaries are hard to get right
early and the microservice "premium" slows a young product down. Also
lists ways teams move from a monolith to services, and the counter
argument.

## Key claims

- The pattern he saw. "Almost all the successful microservice stories have started with a monolith that got too big and was broken up" (list item 1)
- And the other side. "Almost all the cases where I've heard of a system that was built as a microservice system from scratch, it has ended up in serious trouble." (list item 2)
- The premium is the cost of managing many services. "This premium, essentially the cost of managing a suite of services, will slow down a team, favoring a monolith for simpler applications." (intro)
- Boundaries are hard to get right at the start, and harder to move between services. "Any refactoring of functionality between services is much harder than it is in a monolith." (second reason)
- Even experts get boundaries wrong early. "even experienced architects working in familiar domains have great difficulty getting boundaries right at the beginning." (second reason)
- Not every monolith can be split. "You cannot assume that you can take an arbitrary system and break it into microservices." (footnote 1)
- A common route: peel off services at the edges. "A more common approach is to start with a monolith and gradually peel off microservices at the edges." (strategies)
- Another route: start with a few coarse-grained services. "start with just a couple of coarse-grained services, larger than those you expect to end up with." (strategies)
- The counter argument, which he reports: starting with services gets teams used to it, and a modular-enough monolith takes a lot of discipline. "It takes a lot, perhaps too much, discipline to build a monolith in a sufficiently modular way that it can be broken down into microservices easily." (counter argument)
- Evidence is thin. "These are early days in microservices, and there are relatively few anecdotes to learn from." (closing)

## Visuals worth redrawing

None.

## My notes

- The companion bliki MicroservicePremium (2015, opened) says "The
  majority of software systems should be built as a single monolithic
  application." Not given its own note; same argument.
