---
id: mtu-and-fragmentation
title: MTU and fragmentation
depth: short
phase: 2
note: >-
  The largest packet a link carries, and what happens to packets that
  are bigger.
needs: [ip-routing]
leads_to: []
compare_with: [icmp]
---

# MTU and fragmentation

Every link has a largest packet it can carry, its MTU (maximum
transmission unit). When a packet is bigger than the next link's MTU,
it has to be split into fragments or dropped. Fragments work on paper
and break in practice, so modern protocols go out of their way to never
need them. When they fail, you get the strangest kind of bug: small
requests work and big ones hang.

## Link MTU and path MTU

On Ethernet the MTU is 1500 bytes: that's the largest IP packet that
fits in one frame (RFC 894, 1984). Other links have other limits. The
specs only promise a floor: every IPv4 link must carry at least 68
bytes, every IPv6 link at least 1280.

A packet crosses many links on its way, one hop at a time (that's
[[ip-routing]]). The **path MTU** is the smallest link MTU along the
whole path. And because routes change, the path MTU can change too, in
the middle of a connection.

## What a router does with a packet that's too big

Say your server sends a 1500-byte IPv4 packet (20 bytes of header, 1480
of data), and a router along the way has to forward it onto a link with
an MTU of 1400. It has two choices, and a bit in the IP header picks
between them: **DF**, "don't fragment".

**DF is 0: the router fragments.** It cuts the data into pieces, each
with its own copy of the IP header:

- All fragments carry the same 16-bit **identification** value, so the
  receiver knows they belong together.
- Each carries a **fragment offset**: where its data sits in the
  original, counted in 8-byte units.
- All but the last have the **more fragments** flag set.

Only the destination puts them back together. It collects fragments
with the same identification, source, destination and protocol, and
places each one at its offset.

![A 1500-byte IPv4 packet reaches a router whose next link has an MTU of 1400. With DF set to 0 it becomes two fragments: 1396 bytes with offset 0 and more-fragments set, and 124 bytes with offset 172 and more-fragments clear, both with the same identification. With DF set to 1 the router drops the packet and sends an ICMP fragmentation needed message back to the sender, carrying the MTU of 1400.](img/mtu-and-fragmentation-split.svg)

*One packet, two outcomes. The byte counts follow RFC 791's rules: the first fragment's data must be a multiple of 8 bytes, so it carries 1376 of the 1480, and the second starts at offset 1376 ÷ 8 = 172.*

**DF is 1: the router drops it** and sends back an [[icmp]] message,
"fragmentation needed" in IPv4 or "Packet Too Big" in IPv6, that says
what MTU the next link has. The sender then sends smaller packets. This
is **path MTU discovery**: set DF on everything, and shrink when told.

IPv6 made the second behaviour the only one. Routers never fragment
IPv6 packets. Only the sender may, and it has to know the path MTU
first.

## Why fragments break

The IETF wrote a whole Best Current Practice about this, RFC 8900
(2020), titled "IP Fragmentation Considered Fragile". The problems come
from one fact: only the first fragment carries the TCP or UDP header.
Everything that looks at ports gets confused by the rest.

- **NAT** needs ports to find the binding, so it must hold and
  reassemble fragments before it can translate them (see [[nat]]).
- **Stateless firewalls** can't see ports in later fragments. They
  either let them all through or drop them all.
- **Load balancers and multipath routing** hash on ports when they're
  there and on addresses only when they're not. Packets of one flow can
  end up split across different links.
- **At high rates the IPv4 identification wraps.** Sixteen bits run out,
  fragments from two packets get glued together, and the TCP and UDP
  checksums aren't strong enough to always catch it.
- **Plenty of networks just drop fragments.** Studies cited in RFC 8900
  found at least 28% of sampled paths wouldn't carry IPv6 fragments.

## Where it gets tricky

**Path MTU discovery depends on an ICMP message getting back to you.**
If a firewall drops it (many consumer routers do, by mistake), or it's
rate-limited, or it gets routed to a different server behind the same
[[anycast]] address, the sender never learns. It keeps sending
too-big packets with DF set, and they vanish. That's a **PMTU black
hole**: the TCP handshake and small requests work, because they're
small, and the first full-size packet disappears.

**576 is not the minimum MTU.** It's the size every IPv4 host must be
able to reassemble. The minimum link MTU is 68.

**Some things still need fragments.** DNS over [[udp]] can send
responses too big for one packet, especially with DNSSEC, which is why
RFC 8900 stops short of deprecating fragmentation. The DNS workaround is
to truncate and have the client retry over TCP.

**There's a fix that doesn't rely on ICMP.** Packetization layer path
MTU discovery (PLPMTUD) probes with real packets of different sizes and
watches which ones get acknowledged.

## What this means when you build

- Don't design a protocol that relies on IP fragmentation. [[tcp]]
  already avoids it by keeping each segment under a maximum segment
  size. If you build on UDP, keep datagrams small or discover the path
  MTU yourself.
- If small requests work and large ones hang, suspect the path MTU
  and a black hole before anything else.
- Don't block all ICMP at your firewalls. Let "fragmentation needed" and
  "Packet Too Big" through.

## Further reading

- [RFC 8900: IP Fragmentation Considered Fragile](https://www.rfc-editor.org/rfc/rfc8900), R. Bonica et al., 2020. Link MTU, path MTU, how fragmentation and discovery work, and every way they fail. Start here.
- [RFC 791: Internet Protocol](https://www.rfc-editor.org/rfc/rfc791), J. Postel, 1981. The fragmentation fields and the reassembly rules, from the source.
- [RFC 894: Transmission of IP Datagrams over Ethernet](https://www.rfc-editor.org/rfc/rfc894), C. Hornig, 1984. Where the 1500-byte Ethernet MTU comes from.
