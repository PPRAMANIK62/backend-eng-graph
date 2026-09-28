---
id: grigorik-hpbn-latency-bandwidth
title: "Primer on Latency and Bandwidth (High Performance Browser Networking, ch. 1)"
author: Ilya Grigorik
url: https://hpbn.co/primer-on-latency-and-bandwidth/
kind: book
primary: false
---

## Summary

Chapter 1 of a free online O'Reilly book. Splits latency into
propagation, transmission, processing and queuing delay, works through
the speed of light in fibre with a table of real city pairs, and points
at the last mile as a large, often ignored part of the total.

## Key claims

- Four delays. Propagation: "a function of distance over speed with which the signal propagates." Transmission: "a function of the packet’s length and data rate of the link." Processing: "Amount of time required to process the packet header, check for bit-level errors, and determine the packet's destination." Queuing: "Amount of time the packet is waiting in the queue until it can be processed." (The Many Components of Latency)
- The total is the sum. "The total latency between the client and the server is the sum of all the delays just listed." (The Many Components of Latency)
- Transmission time depends on link rate, not distance: a 10 Mb file takes 10 s on 1 Mbps and 0.1 s on 100 Mbps. (The Many Components of Latency)
- Bits vs bytes: 10 MB is 80 Mb. (The Many Components of Latency, sidebar)
- Router processing is mostly in hardware and small. "Much of this logic is now often done in hardware, so the delays are very small, but they do exist." (The Many Components of Latency)
- Fibre slows light; refractive index 1.4 to 1.6, rule of thumb about 1.5. "the rule of thumb is to assume that the speed of light in fiber is around 200,000,000 meters per second, which corresponds to a refractive index of ~1.5." (Speed of Light and Propagation Latency)
- Table 1-1 (great-circle distance, time in vacuum, one way in fibre, round trip in fibre): New York to San Francisco 4,148 km, 14 / 21 / 42 ms; New York to London 5,585 km, 19 / 28 / 56 ms; New York to Sydney 15,993 km, 53 / 80 / 160 ms. (Table 1-1)
- Real routes are longer and add hops, so New York to Sydney is 200 to 300 ms in practice. "the actual RTT between New York and Sydney, over our existing networks, works out to be in the 200–300 millisecond range." (Speed of Light and Propagation Latency)
- CDNs cut propagation by moving servers closer. "We may not be able to make the packets travel faster, but we can reduce the distance by strategically positioning our servers closer to the users!" (Speed of Light and Propagation Latency, sidebar)
- Last mile, US FCC "Measuring Broadband America" reports as summarised in the book: fibre 10-20 ms, cable 15-40 ms, DSL 30-65 ms to the ISP's nearest measuring node. (Last-Mile Latency)
- Bufferbloat: routers ship with large buffers to avoid drops, which breaks TCP congestion avoidance and adds high, variable delay; CoDel is in Linux 3.5 and later. "introduces high and variable latency delays into the network." (Bufferbloat in Your Local Router, sidebar)
- A traceroute example: 11 hops from Sunnyvale to a Google server, about 18 ms on average. (Last-Mile Latency)
- Speed of light in a vacuum. "The good news is the speed of light is high: 299,792,458 meters per second, or 186,282 miles per second." (Speed of Light and Propagation Latency)
- CoDel in Linux. "is now implemented within the Linux 3.5+ kernels." (Bufferbloat in Your Local Router, sidebar)

## Visuals worth redrawing

- Table 1-1 as a bar chart (vacuum vs fibre per city pair).

## My notes

- Copyright line says 2013; the page also mentions 2015 events (Hibernia
  Express, Akamai late-2015 data), so the online edition was updated
  after print. The FCC numbers are from whichever report year the book
  used; don't present them as current.
