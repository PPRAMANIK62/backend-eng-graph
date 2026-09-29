---
id: brooker-circuit-breakers-2022
title: Will circuit breakers solve my problems?
author: Marc Brooker
url: https://brooker.co.za/blog/2022/02/16/circuit-breakers.html
kind: blog
primary: false
---

## Summary

A blog post (2022) by an AWS engineer arguing that client-side circuit
breakers clash with systems designed to fail partially, such as
sharded databases and cell-based services: a breaker has to call a
whole dependency up or down, when really only part of it is failing.

## Key claims

- Retries are often triggered by overload and make it worse. "The bottom line is that retries are often triggered by overload conditions, permanent or transient, and tend to make those conditions worse by increasing traffic." (opening)
- The two benefits people expect: fail early to save resources, and degrade gracefully. "One, as Martin points out, is that failing early can prevent you from wasting work or resources on something that’s doomed." / "The second benefit is allowing a kind of progressive degradation in service." (What is a circuit breaker?)
- Example: a sharded store where only one shard (A-H) is overloaded. "Calls for A-H may start failing, while calls for other keys keep working." (The Problem with Circuit Breakers)
- The dilemma: trip and hurt everyone, or don't and be useless. "If you say yes, it’s down, then you’ve made service worse for Jane and Tracy. If you say no, it’s not down, then you may as well not have the breaker at all." (The Problem with Circuit Breakers)
- Same for cells. "The same issue is true of cell-based architectures, where a circuit breaker tripping on the failure of one cell may make the whole system look like its down, defeating the purpose of cells entirely." (The Problem with Circuit Breakers)
- The breaker would have to predict whether this particular call will work. "Clients simply don’t know enough (and, mostly, shouldn’t know enough) about the inner workings of the systems they are calling to make that decision." (Can We Fix Them?)
- Three fixes: tight coupling (breakers per shard or per customer), server hints, or statistical guessing. "On overload, the service can say things like “I’m overloaded for requests that start with A”, and the client can flip the corresponding mini circuit breaker." (Can We Fix Them?)
- The bottom line. "Circuit breakers are designed to turn partial failures into complete failures." (Bottom Line)
- The origin is usually credited to Nygard, but he's not sure that's right. "Commonly attributed to Michael Nygard in Release It!, but it’s not clear that’s the actual origin" (footnote 2)

## Visuals worth redrawing

- The router over three storage shards (A-H, I-R, S-Z), with one shard
  overloaded.

## My notes

- An opinion piece; strong but one person's view. Pair with Fowler
  and Azure for the case in favour.
