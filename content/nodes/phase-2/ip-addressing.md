---
id: ip-addressing
title: IP addresses and subnets
depth: deep
phase: 2
note: >-
  IPv4 and IPv6 addresses, subnets and CIDR notation: what the numbers
  mean and how a network is carved up.
needs: [network-layers]
leads_to: [ip-routing, nat, ports-and-sockets]
compare_with: []
updated: 2026-09-29
---

# IP addresses and subnets

An IP address is a number that says where a network interface sits. Part
of the number names a network, the rest names one interface on it, and a
prefix length like `/24` says where the split falls. You write these
numbers into configs, firewall rules, allowlists and logs all the time, and
getting the split wrong breaks things in confusing ways.

## Names, addresses and routes

The IPv4 spec (RFC 791, 1981) draws a line that's still useful: a name
says what you want, an address says where it is, and a route says how to
get there. `api.example.com` is a name; [[dns]] turns it into an address.
The address is what goes in every packet's IP header, the internet layer
from [[network-layers]]. Picking the route is [[ip-routing]].

## An IPv4 address is 32 bits with a split in it

An IPv4 address is 32 bits, written as four decimal bytes: `192.0.2.10`.
From the start, an address was a network number followed by a local part
that picks one host on that network. What changed over the years is how
you know where one ends and the other begins.

Today you say it explicitly with a prefix length. `192.0.2.10/24` means
the first 24 bits are the network and the last 8 are the host:

![The address 192.0.2.10 written as 32 bits in four groups of eight: 11000000, 00000000, 00000010, 00001010. A bracket over the first 24 bits reads "network: 192.0.2.0/24" and a bracket over the last 8 reads "host: .10". Below, the mask 255.255.255.0 is shown as 24 ones then 8 zeros. A second row shows the same 24-bit network split into four /26 subnets, starting at .0, .64, .128 and .192, each with 64 addresses.](img/ip-addressing-prefix-bits.svg)

*A prefix length is a count of network bits. Moving it right by two cuts
the /24 into four /26 subnets.*

The same split can be written as a mask: 24 one-bits followed by 8
zero-bits, which is `255.255.255.0`. Masks and prefix lengths say the same
thing; the mask must be contiguous ones, so the prefix length is all you
need.

A prefix covers a power-of-two block of addresses:

| Prefix | Addresses in the block |
|---|---|
| /32 | 1 (a single host, a "host route") |
| /31 | 2 (a point-to-point link) |
| /24 | 256 |
| /16 | 65,536 |
| /8 | 16,777,216 |
| /0 | all 4,294,967,296 (the "default route") |

In an ordinary IPv4 subnet, the all-zeros and all-ones host parts are
reserved for the network itself and for broadcast, so a /24 has 254
usable host addresses, not 256.

**Subnetting** is moving the split to the right to carve a block into
smaller ones. Your team gets `10.20.0.0/16`. Moving the split 8 bits right
gives 2^8 = 256 subnets of /24 each: `10.20.0.0/24`, `10.20.1.0/24`, and so
on up to `10.20.255.0/24`. Each extra bit doubles the number of subnets
and halves their size.

**Is this address on my network?** Apply your own prefix length to both
addresses and compare. With `192.0.2.10/24`, the address `192.0.2.200` has
the same first 24 bits, so it's local and you can reach it directly.
`198.51.100.7` doesn't match, so it has to go through a router. That test
is the first step of every packet send.

## From classes to CIDR

The 1981 design didn't have prefix lengths. The first bits of the address
told you its class: class A had 7 network bits and 24 host bits, class B
14 and 16, class C 21 and 8. Organizations got a whole class-sized block.

By the early 1990s this was breaking. A class C block (254 hosts) was too
small for a mid-sized organization and a class B (65,534 hosts) far too
big, so class B space was running out. Routing tables were growing faster
than routers could handle. In 1992 an IETF group named three problems:
class B exhaustion, routing table growth, and the eventual end of IPv4
addresses altogether.

Classless Inter-Domain Routing (CIDR) fixed the first two by dropping
classes for prefixes of any length, handed out to follow the Internet's
shape so they could be aggregated: one route for a provider's whole block
instead of one per customer. Routing protocols had to carry the prefix
length, since it could no longer be read off the address. CIDR was
meant to last three to five years while something better was designed. It
never went away: RFC 4632 (2006) replaced the original CIDR spec after
more than twelve years in use, and it's still how addresses work.

Addresses flow down a hierarchy. IANA hands /8 blocks to the five
Regional Internet Registries; the registries hand smaller blocks to
internet providers; providers hand them to customers. On 2011-02-03 IANA
gave out its last five /8 blocks, one to each registry, and its free pool
of IPv4 addresses was empty. CIDR slowed the third problem down but never
claimed to solve it.

## Addresses with special jobs

Some blocks are reserved. The ones you'll meet:

| Block | What it's for |
|---|---|
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` | Private networks (RFC 1918) |
| `127.0.0.0/8` | Loopback |
| `169.254.0.0/16` | Link-local |
| `100.64.0.0/10` | Shared address space (allocated 2012) |
| `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24` | Documentation and examples |
| `255.255.255.255/32` | Limited broadcast |

Private addresses need a little more explanation. Anyone can use them
without asking a registry. The price is that they're only unique inside your own
network, and routes for them must never leak onto the Internet. A host
with a private address can't be reached directly from outside; to get out
it goes through a gateway, such as [[nat]] or an application proxy.

This article uses the documentation ranges for examples. You should too,
in tests and docs, so an example can never hit a real machine.

## IPv6: the same idea with 128 bits

IPv6 addresses are 128 bits, written as eight groups of 16 bits in hex,
separated by colons: `2001:db8:0:0:8:800:200c:417a`. Leading zeros in a
group can be dropped, and one run of all-zero groups can be replaced by
`::`, once per address. So that address is also `2001:db8::8:800:200c:417a`,
and the loopback address `0:0:0:0:0:0:0:1` is just `::1`.

Prefixes work the same way as in IPv4: `2001:db8::/32` is the block
reserved for documentation. The layout of an ordinary global address is
fixed at one boundary:

![A 128-bit IPv6 address drawn as a bar split into three parts. The first part, n bits, is the global routing prefix assigned to a site. The second, m bits, is the subnet ID. Together they make 64 bits, the subnet prefix. The last 64 bits are the interface ID, which names one interface on that subnet.](img/ip-addressing-ipv6-layout.svg)

*A global IPv6 unicast address: the first 64 bits pick the subnet, the
last 64 pick the interface. Adapted from RFC 4291, section 2.5.4.*

The interface ID is 64 bits for global unicast addresses (except a few
special ranges that start with binary 000), so a normal IPv6 subnet is a
/64. A site is assigned a routing prefix and numbers its subnets in the bits
between that prefix and bit 64.

A few more differences from IPv4:

- **Every interface has several addresses.** Each one has a link-local
  address in `fe80::/10`, which routers never forward, and can have global
  ones as well.
- **There's no broadcast.** Multicast does that job; ARP's broadcast
  lookups are replaced by [[ethernet-and-arp|Neighbor Discovery]] over
  multicast.
- **Private-style addresses exist too.** `fc00::/7` is set aside for
  unique-local addresses, the rough counterpart of RFC 1918.
- **Bigger headers.** The IPv6 header is 40 bytes against IPv4's minimum
  of 20.

## Addresses belong to interfaces, not machines

In both versions an address names a network interface, not a computer. A
machine with two network cards has at least two addresses, and one
interface can carry several. That matters the moment you open a listening
socket and have to say which address it listens on, which is where
[[ports-and-sockets]] picks up.

## Where it gets tricky

**Two private networks can't simply be joined.** Private blocks are only
unique inside one organization. When two networks that both used
`10.0.0.0/8` need to talk (a merger, a VPN to a partner, peering two
cloud VPCs), their addresses collide, and the fix is renumbering or
translation.

**Class thinking lingers.** Equipment built around classes can't be
expected to work on today's Internet, but the habit outlives the
equipment: it's easy to read `10.x` as a /8 or `192.168.x` as a /24 without
checking. The prefix length is the only truth.

**One IPv6 address has many spellings.** `2001:DB8::1`,
`2001:db8:0:0:0:0:0:1` and `2001:0db8::0001` are the same address, and
all of them are valid ways to write it, so software receives all of
them. Compare parsed addresses, never strings.

**IPv4 can show up inside IPv6.** An IPv4-mapped IPv6 address is 80 zero
bits, then 16 one bits, then the IPv4 address, written like
`::ffff:192.0.2.10`. It's how an IPv4 peer's address can be expressed as
an IPv6 one, so an address that looks like IPv6 in a log may really be
IPv4.

**The address isn't the host.** Because addresses belong to interfaces and
can be reassigned, an IP address is a weak identity. Behind [[nat]] many
hosts share one address.

**Special ranges are a snapshot.** The table above follows RFC 6890 (2013).
IANA keeps the live registries, so check there for newer entries.

## What this means when you build

- Store addresses in a type that knows both families and parses them,
  not in strings. Store prefixes as address plus length.
- Write allowlists and firewall rules as prefixes, and double-check the
  length: `/16` versus `/24` is a factor of 256.
- Before picking a private range for a new network, check what else it
  may one day connect to, so it doesn't collide.
- Use `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24` and
  `2001:db8::/32` in examples and tests.
- Expect IPv6. Code that assumes an address fits in 32 bits or contains
  dots will break.
- Log the full client address, and remember that behind NAT or a proxy it
  may not be the client at all.

## Further reading

- [RFC 791: Internet Protocol](https://www.rfc-editor.org/rfc/rfc791), J. Postel (ed.), 1981. The IPv4 spec: 32-bit addresses, the original classes, and "names, addresses, routes".
- [RFC 4632: Classless Inter-domain Routing (CIDR)](https://www.rfc-editor.org/rfc/rfc4632), V. Fuller and T. Li, 2006. Why classes were dropped, slash notation, the prefix-size table, and how addresses are handed out.
- [RFC 1918: Address Allocation for Private Internets](https://www.rfc-editor.org/rfc/rfc1918), Y. Rekhter et al., 1996. The private ranges and the rules for using them.
- [RFC 4291: IP Version 6 Addressing Architecture](https://www.rfc-editor.org/rfc/rfc4291), R. Hinden and S. Deering, 2006. IPv6 address types, text forms, prefixes, and the 64-bit interface ID.
- [RFC 1122: Requirements for Internet Hosts -- Communication Layers](https://www.rfc-editor.org/rfc/rfc1122), R. Braden (ed.), 1989. The "is it on my network?" mask test a host runs before every send (section 3.3.1.1).
- [RFC 4861: Neighbor Discovery for IP version 6 (IPv6)](https://www.rfc-editor.org/rfc/rfc4861), T. Narten et al., 2007. How IPv6 does address resolution over multicast instead of ARP's broadcast.
- [RFC 6890: Special-Purpose IP Address Registries](https://www.rfc-editor.org/rfc/rfc6890), M. Cotton et al., 2013. Every reserved block, IPv4 and IPv6, with what it's for.
- [RFC 8200: Internet Protocol, Version 6 (IPv6) Specification](https://www.rfc-editor.org/rfc/rfc8200), S. Deering and R. Hinden, 2017. The IPv6 header and its size compared with IPv4.
- [Free Pool of IPv4 Address Space Depleted](https://www.nro.net/ipv4-free-pool-depleted/), Number Resource Organization, 2011. The day IANA ran out of IPv4 addresses.
