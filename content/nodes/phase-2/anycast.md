---
id: anycast
title: Anycast
depth: short
phase: 2
note: >-
  One address announced from many places, so each user reaches the
  nearest. How DNS roots and CDNs work.
needs: [bgp, tcp]
leads_to: [cdn]
compare_with: []
---

# Anycast

Anycast means announcing the same IP address from many places at once and
letting routing deliver each client to whichever copy is nearest. Nothing
about the address itself is special. It's how the DNS root servers run as
about two thousand instances behind a handful of addresses, and content delivery
networks use it too.

## One address, many sites

Normally one address lives in one place, and every route on the Internet
leads there. With anycast, several independent sites each hold the same
service address and each announce a route to it, on the Internet with
[[bgp|BGP]]. Every network hears several routes to the same prefix and
picks one by its usual rules. Clients in different regions end up at
different sites without doing anything.

![One service address, 192.0.2.53, served from three sites, one each in Europe, Asia and North America. Each site announces the same prefix, 192.0.2.0/24. Clients in each region send to the same address, and routing delivers each to the site in its own region. A note at the bottom says that if the European site withdraws its route, its clients shift to the next-best site.](img/anycast-sites.svg)

*Every site announces the same prefix; routing picks the site for each
client.*

The DNS root is the best-known example. There are 13 root server
identifiers, the letters A to M, run by 12 organizations, and each letter
is one IPv4 and one IPv6 address. When this was written, root-servers.org counted
2,045 instances behind those addresses.

In IPv6 an anycast address looks exactly like a normal unicast one; the
machines holding it just have to be told it's shared. IPv4 has no anycast
format either: the service address is an ordinary address that happens to
be announced from several places. The client can't tell it's talking to
one of many.

## Health is an announcement

Since routing decides who gets traffic, a site controls its traffic by
announcing or withdrawing its route. The usual design ties the two
together: the site announces the route while the service is healthy and
withdraws it when the service fails, and clients drift to the next site.
Flapping back and forth quickly causes its own trouble, so sites wait a
while after a withdrawal before announcing again.

There's a practical limit on what can be announced. Networks on the
Internet filter out very specific routes, so a single-address (/32) route
won't spread. An IPv4 anycast service usually announces a covering /24.

## What it's good for

- **Spreading load, roughly.** Clients split between sites by where they
  are, not by how busy each site is, so load between sites is usually
  unbalanced. Coarse distribution is what you get.
- **Containing attacks.** Attack traffic lands on the sites nearest its
  sources, so one site can be flooded while the others keep working.
- **Shorter round trips, often.** A nearby site usually means a shorter
  trip, but not always.
- **One address instead of a list.** Clients need to know one address,
  not many.

## Where it gets tricky

**Nearest by routing isn't nearest by time.** BGP picks by policy and AS
path, not by measured delay (see [[bgp]]). Closeness in routing terms
doesn't in general match round-trip time, and a client can be sent to a
site that's farther away in milliseconds.

**Connections assume one server.** A TCP connection lives on one machine.
If routes shift mid-connection, packets can start arriving at a different
site, which has never heard of the connection and resets it. The IETF's
architecture board wrote in 2014 that TCP over anycast isn't "safe" in the
architectural sense, and that [[udp|UDP]] is anycast's usual transport. A
DNS query over UDP is one packet each way, which is the ideal case. In the
same document it noted that anycast with [[tcp|TCP]] is spreading anyway,
for content delivery networks among others. It works in practice when
routes stay stable for much longer than a connection lasts.

**You can't see it from one place.** Each vantage point reaches a
different site, so a check from your office tests one site out of many.
Monitor from many locations and record which site answered.

## What this means when you build

- A good fit is short request-and-response traffic: [[dns]], small API
  calls, the first step of a longer exchange.
- For long connections, expect the occasional reset when routing changes,
  and make clients reconnect and retry cleanly.
- Tie announcements to [[health-checks|health checks]], and damp them so a sick site
  doesn't flap.
- Don't expect even load between sites. Plan each site's capacity for the
  region that routes to it.

## Further reading

- [RFC 4786: Operation of Anycast Services](https://www.rfc-editor.org/rfc/rfc4786), J. Abley and K. Lindqvist, 2006. The operator's guide: what anycast is good for, which services suit it, health-driven announcements, covering prefixes and monitoring.
- [RFC 7094: Architectural Considerations of IP Anycast](https://www.rfc-editor.org/rfc/rfc7094), D. McPherson et al., IAB, 2014. Why stateful transports like TCP and anycast don't mix well, and where it's done anyway.
- [RFC 4291: IP Version 6 Addressing Architecture](https://www.rfc-editor.org/rfc/rfc4291), R. Hinden and S. Deering, 2006. Why an IPv6 anycast address looks like any unicast one (sections 2.4 and 2.6).
- [Root Server Technical Operations Association](https://root-servers.org/), root server operators. Live counts of root server instances per letter, and the FAQ on how 13 identifiers map to addresses.
