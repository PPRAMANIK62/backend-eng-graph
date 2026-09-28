---
id: clark-design-philosophy-1988
title: The Design Philosophy of the DARPA Internet Protocols
author: David D. Clark
url: http://ccr.sigcomm.org/archive/1995/jan95/ccr-9501-clark.pdf
kind: paper
primary: true
---

## Summary

Clark's SIGCOMM 1988 paper (reprinted in Computer Communication Review in
1995) on why TCP/IP looks the way it does. Explains the goals in priority
order, why IP is a datagram service, why TCP and IP were split into two
layers, and "fate-sharing".

## Key claims

- The top goal was connecting existing networks. "The top level goal for the DARPA Internet Architecture was to develop an effective technique for multiplexed utilization of existing interconnected networks." (2. Fundamental Goal)
- Survivability came first among the second-level goals. "Despite the fact that survivability is the first goal in the list" (4, Survivability)
- Connection state lives at the endpoints ("fate-sharing"): losing it only matters if the endpoint itself is lost. "The fate-sharing model suggests that it is acceptable to lose the state information associated with an entity if, at the same time, the entity itself is lost." (4)
- So gateways are stateless packet switches. "the intermediate packet switching nodes, or gateways, must not have any essential state information about on-going connections." (4)
- TCP and IP started as one protocol and were split so IP could be a basic building block for other services. "This goal caused TCP and IP, which originally had been a single protocol in the architecture, to be separated into two layers." (5, Types of Service)
- The datagram is that building block. "IP attempted to provide a basic building block out of which a variety of types of service could be built. This building block was the datagram" (5)
- A debugger (XNET) and real-time voice didn't want TCP's reliability; a debugger must work with whatever gets through. "It is much better to build a service which can deal with whatever gets through, rather than insisting that every byte sent be delivered in order." (5)
- Real-time speech needed low, steady delay more than reliability; a missing packet can be replaced by a short silence. "In real time digital speech, the primary requirement is not a reliable service, but a service which minimizes and smoothes the delay in the delivery of packets." (5)
- Retransmission is the biggest source of delay variation. "the most serious source of delay in networks is the mechanism to provide reliable delivery." (5)
- By 1988 TCP/IP ran over long-haul nets, local area nets like Ethernet, satellite nets, packet radio and serial links. "local area nets (Ethernet, ringnet, etc.), broadcast satellite nets" (5, list of networks)
- The split into IP and TCP wasn't in the original proposal. "This seems basic to the design, but was also not a part of the original proposal." (abstract column, on the TCP/IP split)

Added (audit) for `network-layers`:

- A reliable transport holds back later packets until a lost one is retransmitted. "A typical reliable transport protocol responds to a missing packet by requesting a retransmission and delaying the delivery of any subsequent packets until the lost packet has been retransmitted." (5)
- A lost speech packet can be covered with silence. "The missing speech can simply be replaced by a short period of silence" (5)
- The networks list also includes packet radio and serial links. "packet radio networks (the DARPA packet radio network" (5, list of networks)

## Visuals worth redrawing

None.

## My notes

- Two-column PDF; quotes checked with pdftotext.
