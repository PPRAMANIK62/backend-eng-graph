---
id: cheshire-latency-stupid-1996
title: It's the Latency, Stupid
author: Stuart Cheshire
url: http://www.stuartcheshire.org/rants/latency.html
published: 1996-05
accessed: 2026-09-28
kind: blog
primary: false
---

## Summary

A classic essay (May 1996, revised up to 2001) arguing that bandwidth
can always be bought but latency can't. Its worked example compares the
speed-of-light round trip from Stanford to Boston with a real ping, and
shows why small messages are ruled by latency, not bandwidth.

## Key claims

- More bandwidth is easy: run links in parallel. "Fact One: Making more bandwidth is easy." (Fact One)
- Latency can't be bought back. "Fact Two: Once you have bad latency you're stuck with it." (Fact Two)
- A small message pays the fixed latency no matter how fast the link: ten characters over a 33 kbit/s modem is 2.4 ms of transmission but 102.4 ms total because of 100 ms modem latency. (Fact Two)
- Fibre at about two thirds of c. "The speed of light in fibre is roughly 66% of the speed of light in vacuum." (Fact Three)
- Worked example: Stanford to Boston is 4,320 km; at 200 × 10^6 m/s that's 21.6 ms one way, 43.2 ms round trip; the measured ping was about 85 ms. "So: the hardware of the Internet can currently achieve within a factor of two of the speed of light." (Fact Three)
- End-to-end delay is fixed latency plus transmission time. "The total end-to-end transmission delay is made up of fixed latency (including the speed-of-light propagation delay), plus the transmission time." (Fact Three)

## Visuals worth redrawing

None.

## My notes

- Numbers are from 1996-era modems and one ping. Use the method (ideal
  vs measured round trip), not the numbers, except as history.
