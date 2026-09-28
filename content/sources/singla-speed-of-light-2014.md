---
id: singla-speed-of-light-2014
title: The Internet at the Speed of Light
author: Ankit Singla, Balakrishnan Chandrasekaran, P. Brighten Godfrey, Bruce Maggs
url: http://conferences.sigcomm.org/hotnets/2014/papers/hotnets-XIII-final111.pdf
kind: paper
primary: true
---

## Summary

A HotNets 2014 paper that measures how far real internet latency is from
the physical limit (light travelling the straight-line distance, which
they call c-latency), and breaks the gap down: longer-than-necessary
fibre, indirect routing, DNS, the TCP handshake and slow start. Their
answer: typically more than 10 times slower than light, and bufferbloat
explains little of it on their (well-connected) paths.

## Key claims

- Headline. "the fetch time for just the HTML for the landing pages of popular Websites from a set of generally well-connected clients is, in the median, 34 times the roundtrip speed-of-light latency. In the 90th percentile it is 169× slower." (1. Introduction)
- Setup: HTML of landing pages of 28,000 popular sites fetched with cURL from 400+ PlanetLab nodes; c-latency is the round trip at the speed of light along the shortest path. (2. The Internet is too slow)
- Minimum ping time is 3.2× c-latency in the median. (4, "the 3.2× inflation in the median ping time")
- The path through the routers is 2.3× in the median, and 1.5× of that is just fibre being slower than light in vacuum. "Note that 1.5× inflation would occur even along the shortest path along the Earth’s surface because the speed of light in fiber is roughly 2/3rd the speed of light in air / vacuum." (4.1 Physical infrastructure and routing)
- Hairpinning routes: some packets between Eastern China and Taiwan went via California. (4.1)
- Fibre runs are longer than roads. "Even when only point-to-point connections are considered, fiber lengths are usually 1.5-2× larger than road distances." (4.1)
- Protocol costs: DNS 5.4× and TCP transfer 8.7× c-latency in the median; the TCP transfer part is mostly slow start. (4)
- Bufferbloat is not the main cause on these paths. "We can safely conclude that for most of these connections, bufferbloat cannot explain the large latency inflation observed." (4.2 Loss, queuing, and bufferbloat)
- At the edge, from Akamai server logs over 24 hours: average RTT is 1.9× the minimum RTT in the median, about 30 ms more. "Bufferbloat is certainly a suspect for this difference, although server response times may also play a role." (4.2)
- The 400+ vantage points are PlanetLab nodes, which are well connected. "note that PlanetLab nodes are generally well-connected, and latency can be expected to be poorer from the network’s true edge." (3. The Internet is too slow)
- TLS adds round trips. "We did find, as expected, that SSL incurred several RTTs of additional latency." (footnote 6; the study left the few hundred SSL sites out of its data)

## Visuals worth redrawing

- Figure 3 (CDFs of inflation per component: router path, min ping,
  TCP handshake, DNS, TCP transfer, total). Could redraw as a bar of
  median inflation factors.

## My notes

- PlanetLab nodes sit in universities with good connections, so these
  are best-case paths; the authors say edge latency is likely worse.
- Measurements are from 2014. The ratios are more durable than any
  absolute number.
- Section numbers read from the PDF text; 4.2's title is "Loss,
  queuing, and bufferbloat".
