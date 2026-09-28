---
id: brooker-tcp-nodelay-2024
title: It's always TCP_NODELAY. Every damn time.
author: Marc Brooker
url: https://brooker.co.za/blog/2024/05/09/nagle.html
published: 2024-05-09
accessed: 2026-09-28
kind: blog
primary: false
---

## Summary

An AWS engineer's argument that Nagle's algorithm hurts modern
distributed systems, both through its interaction with delayed ACKs and
on its own, and that TCP_NODELAY should be the default. Useful for the
practitioner's side of the debate.

## Key claims

- TCP_NODELAY is the first thing he checks in latency bugs. "The first thing I check when debugging latency issues in distributed systems is whether TCP_NODELAY is enabled." (opening)
- Nagle's RFC uses no timer except the round trip. "When many people talk about Nagle’s algorithm, they talk about timers, but RFC896 doesn’t use any kind of timer other than the round-trip time on the network." (after the RFC 896 quote)
- Delayed ACK holds the ACK until there's data to send back or a timer expires. "The idea behind delayed ACK is to delay sending the acknowledgement of a packet at least until there’s some data to send back (e.g. a telnet session echoing back the user’s typing), or until a timer expires." (Nagle's Algorithm and Delayed Acks)
- The interaction: Nagle waits for an ACK that delayed ACK is holding back. "Nagle’s algorithm is blocking sending more data until an ACK is received, but delayed ack is delaying that ack until a response is ready." (Nagle's Algorithm and Delayed Acks)
- Even without delayed ACK, waiting one RTT isn't clearly a win on modern hardware. "Given the vast amount of work a modern server can do in even a few hundred microseconds, delaying sending data for even one RTT isn’t clearly a win." (Is Nagle blameless?)
- Batching small messages has moved into the application layer. "The core concern of not sending tiny messages is still a very real one, but we’ve very effectively pushed that into the application layer." (Is Nagle blameless?)
- His advice for latency-sensitive systems. "if you’re building a latency-sensitive distributed system running on modern datacenter-class hardware, enable TCP_NODELAY (disable Nagle’s algorithm) without worries." (Is Nagle needed?)
- He thinks it should be the default. "In other words, TCP_NODELAY should be the default." (Is Nagle needed?)
- He doesn't use TCP_QUICKACK: not portable, odd semantics, and it doesn't stop the kernel holding data. (footnote 2)

## Visuals worth redrawing

None.

## My notes

- The in-datacenter RTT of "around 500μs" in the post is his rough
  figure, not a measurement; not used.
- Quotes a Hacker News comment by John Nagle blaming the fixed
  delayed-ACK timer. Second hand; not used as a fact.
