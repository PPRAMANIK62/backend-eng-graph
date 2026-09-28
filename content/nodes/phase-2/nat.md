---
id: nat
title: NAT
depth: short
phase: 2
note: >-
  Many private addresses sharing one public one, and why that breaks
  incoming connections.
needs: [ip-addressing, ports-and-sockets]
leads_to: [tcp-keepalive]
compare_with: []
updated: 2026-09-29
---

# NAT

Network address translation lets a whole network of machines with
private addresses reach the internet through one public address. Your
home router does it, and so do many office networks. It's why a laptop
can open a connection to any server in the world, but no server can
open one to the laptop.

## One public address, many private hosts

Three address ranges are set aside for private networks: `10.0.0.0/8`,
`172.16.0.0/12` and `192.168.0.0/16` (see [[ip-addressing]] for what
the `/8` means). Any organisation can use them without asking anyone,
so countless networks reuse the same ones. A reply addressed to
`10.0.0.10` can't find its way back to you across the internet, because
there's no telling which of all those `10.0.0.10`s you are.

NAT fixes this at the border router. Take the example from the NAT spec,
RFC 3022 (2001). A host at `10.0.0.10` opens a TCP connection from
[[ports-and-sockets|port]] 3017 to a server at `138.76.29.7`, port 23. The router's public address
is `138.76.28.4`.

1. The packet leaves the host with source `10.0.0.10:3017`.
2. The router picks a free public port, say 1024, and writes down a
   binding: `10.0.0.10:3017` ↔ `138.76.28.4:1024`.
3. It rewrites the source to `138.76.28.4:1024` and sends the packet on.
   The server sees only the public address.
4. The reply comes back to `138.76.28.4:1024`. The router looks up the
   binding, rewrites the destination to `10.0.0.10:3017`, and delivers
   it.

![Three private hosts on 10.0.0.0/8 behind a NAT router with public address 138.76.28.4. An outgoing packet from 10.0.0.10 port 3017 to 138.76.29.7 port 23 leaves the router with source 138.76.28.4 port 1024. The router's table maps 10.0.0.10:3017 to 138.76.28.4:1024, and the reply is rewritten back to 10.0.0.10:3017.](img/nat-translation.svg)

*One outgoing connection through NAT and the table entry it creates. Adapted from Figure 3 of RFC 3022, "Traditional IP Network Address Translator" (Srisuresh and Egevang, 2001).*

Translating ports as well as addresses is what lets many hosts share
one public address. The spec calls it NAPT (network address port
translation), and it's what people usually mean by NAT. Ping works the same way:
an ICMP echo has no port, so the router maps its identifier field
instead (see [[icmp]]).

Changing an address isn't free. The router has to fix the IP header
checksum, and also the TCP or UDP checksum, because that one covers a
"pseudo header" that includes both addresses.

## Why incoming connections fail

The binding is created by the first packet going **out**. Until then the
router has no entry, so when a packet arrives for `138.76.28.4:1024`
from somewhere new, it doesn't know which private host should get it.
So sessions through a NAT are one-way: they start from inside the
private network.

That's the whole reason a home server or a peer-to-peer app needs extra
work: a port forward (a static binding you configure by hand), or tricks
where both sides send first so each NAT opens a binding.

What a NAT lets back in depends on its **filtering** rule. Some let any
host reply to a binding once it exists. Others only accept packets from
the exact address, or address and port, you sent to. The UDP behaviour
spec, RFC 4787 (2007), names these rules precisely and drops the older
"full cone" and "symmetric" labels, because they described real NATs
badly. The old words are still common.

## Bindings expire

The router can't keep every binding forever, so it forgets the quiet
ones. For TCP, a NAT must not drop an established connection that's
been idle for less than 2 hours 4 minutes (RFC 5382, 2008). The number
comes from TCP keepalives, which by default go out every 2 hours. For
UDP there's no connection to watch, and the floor is two minutes, with
five or more recommended (RFC 4787, 2007).

Those are minimums in the specs. The timeouts can be configured, and
some NATs clear out idle state on their own schedule. Once a binding is
gone, packets from the outside have nowhere to go, and the connection
stops working.

## Where it gets tricky

**NAT is not a firewall, though it acts like one.** Blocking unsolicited
inbound traffic is a side effect of having no binding. How strict it is
depends on the filtering behaviour. How the NAT picks public ports
makes no difference to security; only what it lets back in does.

**Fragments don't translate.** Only the first fragment of a fragmented
packet carries the TCP or UDP ports, so the NAT can't tell which binding
the later fragments belong to, and translating them fails. More on that in
[[mtu-and-fragmentation]].

**The address stops meaning a host.** Behind a NAT, many clients share
one address, so a server that rate-limits or bans by IP address can hit
a whole office at once.

## What this means when you build

- Assume your clients are behind NAT and can't accept connections.
  Design so the client dials out, and push data back over that
  connection.
- Long-lived connections that go quiet ([[tcp]] to a database, a
  message broker, a websocket) can be dropped by a NAT in between. Send
  application-level heartbeats or tune TCP keepalives well under the
  shortest idle timeout on your path, and still expect a quiet
  connection to turn out dead.
- For [[udp]] protocols, send something at least every couple of
  minutes if the other side needs to reach you.
- Don't identify users by IP address alone.

## Further reading

- [RFC 3022: Traditional IP Network Address Translator](https://www.rfc-editor.org/rfc/rfc3022), P. Srisuresh and K. Egevang, 2001. The definition of NAT and NAPT, the worked example, and the limits (checksums, fragments, end-to-end addressing).
- [RFC 4787: NAT Behavioral Requirements for Unicast UDP](https://www.rfc-editor.org/rfc/rfc4787), F. Audet and C. Jennings, 2007. Precise names for mapping and filtering behaviour, and the UDP timeout floor.
- [RFC 5382: NAT Behavioral Requirements for TCP](https://www.rfc-editor.org/rfc/rfc5382), S. Guha et al., 2008. TCP idle timeouts and why the 2 hour 4 minute figure exists.
