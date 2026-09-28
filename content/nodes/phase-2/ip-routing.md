---
id: ip-routing
title: How a packet finds its way
depth: deep
phase: 2
note: >-
  Hop by hop forwarding with routing tables and longest prefix match.
needs: [ip-addressing]
leads_to: [bgp, mtu-and-fragmentation, icmp, tun-tap]
compare_with: []
updated: 2026-09-29
---

# How a packet finds its way

No machine on the Internet knows the whole path to anywhere. Each host and
each router keeps a routing table, a list of address prefixes with a next
hop for each. For every packet it finds the most specific prefix that
matches the destination, hands the packet to that next hop, and forgets
about it. Knowing this one lookup explains why your server can reach one
network and not another, why a more specific route always wins, and what
a Linux box does with the packets you send it.

## First decision: is it on my network?

Take a server with the address `192.0.2.10/24` (see [[ip-addressing]]).
Before it sends anything, the IP layer asks one question: is the
destination on a network I'm directly connected to?

It masks the destination with its own prefix length and compares. For
`192.0.2.20` the first 24 bits match, so the destination is on the same
link and the packet goes straight to it: the kernel finds the
destination's hardware address with [[ethernet-and-arp|ARP]] and sends the
frame. For `198.51.100.7` they don't match, so the packet has to go to a
router, often called the gateway, which will pass it on. The frame is
addressed to the gateway's hardware address, but the IP header still says
`198.51.100.7`.

Hosts are meant to keep this simple. The Internet's design puts routing
complexity in the routers, not the hosts. A host has to work even with no
router at all, on a single isolated network.

## A routing table is a list of prefixes

In practice the "is it local?" test is just one entry in the routing
table. A small server's table might look like this (a made-up example):

| Destination | Next hop | Interface |
|---|---|---|
| `192.0.2.0/24` | directly connected | eth0 |
| `10.20.0.0/16` | `192.0.2.254` | eth0 |
| `10.20.5.0/24` | `192.0.2.253` | eth0 |
| `0.0.0.0/0` (default) | `192.0.2.1` | eth0 |

The first row covers the local network. The last row is the default
route: `/0` has no network bits, so it matches every address. It's where
everything goes when nothing better matches. The two middle rows send an
internal range to a different router, with one subnet of it sent
somewhere else again.

## Longest prefix match

For each packet, the lookup starts with every route in the table and
throws routes away until one is left:

1. **Basic match.** Keep only routes whose prefix matches the
   destination. For a destination of `10.20.5.9`, the routes
   `10.20.0.0/16`, `10.20.5.0/24` and the default all match; `192.0.2.0/24`
   doesn't.
2. **Longest match.** Of those, keep the ones with the longest prefix.
   `/24` beats `/16`, which beats `/0`. The packet goes to `192.0.2.253`.
3. **Ties.** If several routes are left with the same length, the router
   can pick one or split traffic across them. Linux uses the route's
   metric: lower wins.
4. **Nothing left.** If no route matches at all (a table with no default,
   say), the packet is dropped as unreachable.

![Three columns of routes. The first column holds every route in the table: 128.12.0.0/16, 10.0.0.0/8, 10.144.0.0/16 and 10.144.2.0/24. The second column, basic match, keeps the three whose prefix covers the destination 10.144.2.5 and greys out 128.12.0.0/16. The third column, longest match, keeps only 10.144.2.0/24, highlighted, because 24 is the longest prefix. A line at the bottom says the packet goes to that route's next hop.](img/ip-routing-longest-match.svg)

*Next-hop selection as a funnel. Adapted from the worked example in
RFC 1812, section 5.2.4.3.*

The rule is simple, and it has a big consequence: **the most specific
route always wins**, no matter where it came from or how it got there.
That's how you override part of a range, and it's also how a wrong
announcement on the Internet can pull traffic away from its real owner
(see [[bgp]]).

## Hop by hop

Every router runs the same lookup, on its own table, for every packet.
None of them plans the whole path. Router 1 sends the packet to router 2
because its table says so; router 2 decides again from scratch. Real
routers may implement the lookup however they like to make it fast, as
long as the result is the same as this simple algorithm.

Each router also decrements the packet's time to live (TTL). The IPv4
spec defines TTL in seconds, but since every router must subtract at
least one, in practice it's a hop count. IPv6 dropped the pretense and
calls it the Hop Limit. When it reaches zero, the router drops the packet
and sends an ICMP "time exceeded" message back to the sender (see
[[icmp]]). That's what keeps a routing loop from circling packets forever.
Linux starts packets it sends with a TTL of 64 by default.

![A packet travels from a server through three routers to a destination. Above each link the packet's TTL is shown: 64 leaving the server, then 63, 62 and 61 after each router. Under each router: longest match in its own table, TTL minus 1. A note at the bottom says that if the TTL hit zero at a router, it would drop the packet and send ICMP time exceeded back to the server.](img/ip-routing-hops.svg)

*Each router decides on its own and takes one off the TTL.*

## Where routes come from

A table fills up in three ways:

- **Connected routes.** Networks the machine sits on directly need no
  router, which is the local test above. Linux marks routes it installs
  on its own as `proto kernel`.
- **Static routes.** A person or a setup tool adds them, like the default
  route to the gateway. A route added without saying where it came from
  is marked `proto boot`, and a routing daemon clears those out when it
  starts.
- **Routing protocols.** Routers tell each other what they can reach.
  Inside one organization's network that's an interior protocol such as
  OSPF or IS-IS. Between networks on the Internet it's [[bgp|BGP]]. Since
  CIDR, all of these carry the prefix length along with each prefix.

Big networks keep tables small by **aggregation**: announcing one short
prefix instead of many long ones. A provider holding a /16 announces that
one route rather than every customer's piece. The catch is
that a router announcing an aggregate must also hold a "discard" route
for it. If part of the aggregate becomes unreachable, the more specific
route disappears, and without the discard route the packet would match a
shorter route, often the default, and loop back the way it came.

## Linux: tables, rules and route types

Linux holds more than one table.

- The **main** table (ID 254) holds the normal routes you see and edit.
- The **local** table (ID 255) holds routes for the machine's own
  addresses and broadcast addresses. The kernel maintains it, and it's
  consulted first. A packet to one of your own addresses matches a `local`
  route and is looped back.
- A **rule list** (the routing policy database) decides which table to
  look in. At boot it has three rules: priority 0 looks in local, 32766 in
  main, 32767 in an empty default table. Extra rules let you route by
  source address or a firewall mark, which is called policy routing.

Routes also have types. Besides normal `unicast` routes there are
`blackhole` (drop silently; a local sender gets `EINVAL`), `unreachable`
(drop and send ICMP host unreachable; a local sender gets `EHOSTUNREACH`)
and `prohibit` (drop and send ICMP administratively prohibited; a local
sender gets `EACCES`). If your program's `connect` fails with one of those
errors, a route may be the reason.

`ip route get <address>` asks the kernel which route it would really use
for a destination, as if it sent a packet. That's more reliable than
reading the table and doing the match in your head.

One more default matters when you build anything that passes packets
along, like the phase 2 lab on [[tun-tap]]: `net.ipv4.ip_forward` is 0
by default. A Linux machine doesn't forward packets between its
interfaces, and isn't a router, until you turn that on.

## Where it gets tricky

**Routing looks only at the destination.** Classic routing ignores where
a packet came from. A server with two interfaces can receive a request on
one and send the reply out the other, because the reply's destination
matched a route there. Policy routing rules that match on source address
are the fix.

**Paths aren't symmetric, and some hosts check.** The route out and the
route back can differ. Linux's reverse path filter (`rp_filter`), in
strict mode, drops an incoming packet if the interface it arrived on isn't
the one the host would use to reply. It's off in the kernel's default,
but some distributions turn it on, and it silently drops traffic on
asymmetric paths. Loose mode is the recommended setting for those.

**A more specific route beats a "better" one.** Longest match comes
before any notion of cost or distance. A metric only breaks ties between
routes of the same length.

**Reading the table isn't the same as asking the kernel.** With policy
rules, the main table may not be the one used. Use `ip route get`.

**TTL is not a timer any more.** It was specified in seconds, but routers
decrement it per hop, and it's treated as a hop count. The tools that
lean on that behavior are covered in [[icmp]].

**Packets that are too big.** Every link has a maximum packet size, and a
route can cross a link smaller than the one you started on. What happens
then is [[mtu-and-fragmentation]].

## What this means when you build

- When a host can't reach something, run `ip route get` for the address
  first. It tells you the interface, next hop and source address the
  kernel will use.
- Remember the next hop has to be resolvable on the link. A correct route
  to an unreachable gateway still goes nowhere.
- To send one range somewhere special, add a more specific route. It
  wins over the default without touching anything else.
- On machines with more than one interface, think about the reply path.
  If replies leave the wrong way, you need source-based policy rules, and
  you may hit `rp_filter`.
- A Linux box that should forward packets (a VPN endpoint, a container
  host, the TUN device in the lab) needs `ip_forward` turned on.
- Use `blackhole` or `unreachable` routes on purpose, to cut off a range
  quickly, and recognize their errors when you see them.

## Further reading

- [RFC 1812: Requirements for IP Version 4 Routers](https://www.rfc-editor.org/rfc/rfc1812), F. Baker (ed.), 1995. The forwarding algorithm, next-hop selection by basic and longest match, and TTL handling (sections 5.2 and 5.3.1).
- [RFC 1122: Requirements for Internet Hosts -- Communication Layers](https://www.rfc-editor.org/rfc/rfc1122), R. Braden (ed.), 1989. How a host decides between direct delivery and a gateway (section 3.3.1).
- [RFC 4632: Classless Inter-domain Routing (CIDR)](https://www.rfc-editor.org/rfc/rfc4632), V. Fuller and T. Li, 2006. Longest-match forwarding, aggregation and the discard route (section 5).
- [RFC 791: Internet Protocol](https://www.rfc-editor.org/rfc/rfc791), J. Postel (ed.), 1981. Where TTL was defined in seconds, and why every hop takes at least one off anyway.
- [RFC 8200: Internet Protocol, Version 6 (IPv6) Specification](https://www.rfc-editor.org/rfc/rfc8200), S. Deering and R. Hinden, 2017. The Hop Limit field, IPv6's TTL.
- [ip-route(8)](https://man7.org/linux/man-pages/man8/ip-route.8.html), iproute2. Linux route types and the errors they return, the main and local tables, and `ip route get`.
- [ip-rule(8)](https://man7.org/linux/man-pages/man8/ip-rule.8.html), iproute2. The routing policy database and its three default rules.
- [IP Sysctl](https://docs.kernel.org/networking/ip-sysctl.html), Linux kernel documentation. `ip_forward`, the default TTL, and reverse path filtering.
