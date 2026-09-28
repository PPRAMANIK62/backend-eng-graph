---
id: ethernet-and-arp
title: Ethernet and ARP
depth: short
phase: 2
note: >-
  How a frame reaches the next machine on the same network, and how an
  IP address is matched to a MAC address.
needs: [network-layers]
leads_to: [tun-tap]
compare_with: []
---

# Ethernet and ARP

IP addresses say where a packet is going, but the wire between two
machines doesn't understand them. On Ethernet, every frame is addressed
with a 48-bit hardware address, the MAC address, so before your server
can send a packet to its neighbor it has to find out that neighbor's MAC
address. ARP (Address Resolution Protocol, RFC 826, 1982) is how IPv4
does that lookup, and the kernel keeps a small cache of the answers.

## A frame and its header

Ethernet is the link layer from [[network-layers]]: it gets a frame to
another machine on the same network, and no further. Its header is short:

- a 48-bit destination hardware address,
- a 48-bit source hardware address,
- a 16-bit type field that says what's inside (an IP packet, an ARP
  message, something else).

The type field is what lets many protocols share one cable. The
receiving machine reads it to decide who gets the rest of the frame.

## Asking "who has this address?"

Your server is 192.0.2.10 on a /24 network, and it wants to send a
packet to 198.51.100.7, somewhere on the Internet. Routing
([[ip-routing]]) runs first and decides the next hop: the destination
isn't on the local network, so the packet goes to the gateway,
192.0.2.1. That's the address ARP has to resolve. The final destination's
IP address stays in the IP header; the MAC address in the frame is the
gateway's.

1. The kernel looks for 192.0.2.1 in its ARP cache. Say it isn't there.
2. It broadcasts an ARP request to every machine on the network. The
   request carries the sender's own IP and MAC address, and the IP address
   it's looking for.
3. Every machine reads it. The one that owns 192.0.2.1 swaps the fields
   around, fills in its own MAC address, and sends a reply straight back to
   the asker, not as a broadcast.
4. The asker stores the answer and sends the waiting packet.

![A sequence diagram with three lanes: your server at 192.0.2.10, the gateway at 192.0.2.1, and another host. The server broadcasts "who has 192.0.2.1? tell 192.0.2.10", which reaches both the gateway and the other host. Only the gateway replies, directly to the server, with "192.0.2.1 is at" its MAC address. Both the server and the gateway now have a cache entry for the other.](img/ethernet-and-arp-exchange.svg)

*One ARP lookup: a broadcast question, a direct answer, and both sides
learn each other's address.*

There's a small trick in step 3. The machine being asked records the
asker's IP-to-MAC mapping before it even checks whether the message is a
request. The reasoning from 1982 still holds: if A wants to talk to B, B
will probably want to talk back to A, so learning A's address now saves a
second broadcast.

ARP only broadcasts when it needs an answer. The designers ruled out
machines announcing their addresses on a timer, because most machines
only talk to a few others and would fill their tables with entries they
never use.

## The cache on Linux

Linux keeps the answers in a neighbor cache, and a few of its behaviors
(documented in arp(7), man-pages 6.19) are worth knowing:

- **Entries go stale.** A found neighbor stays valid for a random time
  around `base_reachable_time_ms`, 30 seconds by default. Traffic that
  proves the neighbor is still there, such as a TCP ACK coming back,
  extends it. Without that, the kernel re-checks: a unicast probe to the
  old MAC first, then a broadcast. It only probes when there's data waiting
  to go out.
- **Only a few packets wait.** While an address is being resolved, at most
  `unres_qlen` packets queue for it, 3 by default.
- **The cache has a size limit.** `gc_thresh3`, the hard maximum, defaults
  to 1024 entries. The settings live per interface under
  `/proc/sys/net/ipv4/neigh/`.

## IPv6 doesn't use ARP

IPv6 does the same job with Neighbor Discovery (RFC 4861, 2007), which
runs inside ICMPv6 packets and uses multicast instead of broadcast. It
also folds in router discovery and redirects, and it notices when a link
works in only one direction, which ARP can't.

## Where it gets tricky

**ARP believes anyone.** Nothing in ARP proves that a reply came from the
real owner of an address. Any machine on the network can answer every
request with its own MAC address and receive traffic meant for others.
A shared Ethernet segment is only as trustworthy as every machine on it.

**"Gratuitous ARP" is a normal packet.** It's a machine announcing its
own IP-to-MAC mapping without being asked; RFC 5227 (2008) calls it an
ARP Announcement. Machines send one when an interface comes up.

**The first packets to a new neighbor wait.** Resolution adds a round
trip on the local network before the first packet leaves, and only a few
packets can queue during it.

## What this means when you build

- A packet to a far-away host is framed for your gateway. If the gateway
  can't be resolved, nothing leaves the machine, whatever the route table
  says. Check the neighbor cache when "the network is down" but only for
  one host.
- On big flat networks with many neighbors (lots of containers or VMs on
  one segment), the default cache limit of 1024 entries can be too small.
- Don't treat the local network as trusted. Anyone on it can impersonate
  another machine, so use encryption and authentication between services.

## Further reading

- [RFC 826: An Ethernet Address Resolution Protocol](https://www.rfc-editor.org/rfc/rfc826), David C. Plummer, 1982. The problem, the packet format, and the request and reply rules, with the reasoning behind each field.
- [arp(7)](https://man7.org/linux/man-pages/man7/arp.7.html), Linux man-pages, 2026. How Linux's neighbor cache ages, re-probes and garbage-collects entries, with every tunable and its default.
- [RFC 5227: IPv4 Address Conflict Detection](https://www.rfc-editor.org/rfc/rfc5227), S. Cheshire, 2008. Why ARP can't be trusted (security section) and what "gratuitous ARP" really is.
- [RFC 1122: Requirements for Internet Hosts -- Communication Layers](https://www.rfc-editor.org/rfc/rfc1122), R. Braden (ed.), 1989. How a host decides whether a destination is on its own network or goes to the gateway (section 3.3.1.1).
- [RFC 4861: Neighbor Discovery for IP version 6 (IPv6)](https://www.rfc-editor.org/rfc/rfc4861), T. Narten et al., 2007. IPv6's replacement for ARP and how it differs (section 3.1).
