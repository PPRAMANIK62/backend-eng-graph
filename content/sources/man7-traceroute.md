---
id: man7-traceroute
title: traceroute(8), Linux manual page
author: Traceroute for Linux (Dmitry Butskoy and contributors), hosted by man7.org
url: https://man7.org/linux/man-pages/man8/traceroute.8.html
kind: docs
primary: true
---

## Summary

The man page for the modern Linux traceroute. How it finds each hop by
sending probes with a growing TTL and listening for ICMP Time Exceeded,
what the output marks mean, and the TCP and ICMP methods it offers
because firewalls drop the classic UDP probes.

## Key claims

- It uses the TTL field to make each router answer with Time Exceeded. "It utilizes the IP protocol's time to live (TTL) field and attempts to elicit an ICMP TIME_EXCEEDED response from each gateway along the path to the host." (DESCRIPTION)
- Start at TTL 1 and count up until the destination answers or the maximum. "We start our probes with a ttl of one and increase by one until we get an ICMP "port unreachable" (or TCP reset), which means we got to the "host", or hit a max (which defaults to 30 hops)." (DESCRIPTION)
- Three probes per TTL by default; one line per TTL with each probe's round-trip time; "*" when no reply comes in time. (DESCRIPTION)
- Annotations include !H, !N, !P (host, network, protocol unreachable) and !F (fragmentation needed). (DESCRIPTION)
- UDP probes go to an unlikely port so the destination doesn't process them. "We don't want the destination host to process the UDP probe packets, so the destination port is set to an unlikely value" (DESCRIPTION)
- Firewalls break the classic method, so TCP and other methods exist. "Such firewalls filter the "unlikely" UDP ports, or even ICMP echoes." (DESCRIPTION)
- Default probe size 60 bytes for IPv4, 80 for IPv6. (DESCRIPTION)

Added (audit) for `icmp`:

- Each line shows the address of the gateway that answered. "a line is printed showing the ttl, address of the gateway and round trip time of each probe." (DESCRIPTION)
- The TCP method sends a SYN, like the start of a connection. "Normally, a tcp syn is sent." (LIST OF AVAILABLE METHODS, tcp)

## Visuals worth redrawing

None; the TTL ladder is easy to draw from the description.

## My notes

- The page date (2006) is the tool's own; man7.org still serves it.
- tracepath(8) from iputils does the same without root and reports the
  path MTU as it goes; opened but not used.
