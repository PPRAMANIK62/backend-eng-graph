---
id: network-layers
title: The layer model
depth: deep
phase: 2
note: >-
  Link, internet, transport, application: how the network is split into
  layers that each do one job, and where the model is a simplification.
needs: []
leads_to: [ethernet-and-arp, ip-addressing, network-latency, packet-capture]
compare_with: []
updated: 2026-09-29
---

# The layer model

The Internet's software is split into four layers: link, internet,
transport and application. Each layer does one job and leans on the one
below it. Almost every networking word you'll meet as a backend engineer
("the MAC address", "the route", "the port", "the header") belongs to one
of these layers, so knowing which is which is how you tell where a problem
lives.

## One request, four envelopes

Say your service calls an API at 203.0.113.10 with an HTTP request. Your
code writes a few hundred bytes of text into a socket (see
[[ports-and-sockets]]). From there, each layer wraps what it gets from the
layer above in its own header, like putting a letter in an envelope, then
that envelope in a bigger one:

1. **Application.** Your HTTP request: `GET /orders/42 ...`. The network
   doesn't care what this says.
2. **Transport.** [[tcp|TCP]] adds a header with the source and
   destination port, sequence numbers and a checksum. It's at least 20
   bytes. Now it's a TCP segment.
3. **Internet.** IP adds a header with the source and destination IP
   address and a hop limit. For IPv4 it's at least 20 bytes; for IPv6 it's
   40. Now it's an IP packet (the specs call it a datagram).
4. **Link.** Ethernet adds a header with a 48-bit destination hardware
   address, a 48-bit source address and a 16-bit type field: 14 bytes.
   Now it's a frame, and it goes on the wire.

![A request shown four times, each row wider than the last. The top row is the HTTP request alone. The next row adds a TCP header of at least 20 bytes in front of it. The next adds an IP header of at least 20 bytes in front of that. The bottom row adds a 14-byte Ethernet header at the very front. Labels on the right name each unit: data, segment, packet, frame.](img/network-layers-encapsulation.svg)

*Each layer puts its own header in front of what the layer above handed
it. Header sizes are the minimums for IPv4, TCP and Ethernet.*

On the server the process runs backwards. The Ethernet layer reads its
header, sees from the type field that the frame holds IP, strips its
header and hands the rest up. IP checks the destination address is its
own, sees the packet holds TCP, and hands it up. TCP finds the connection
by its ports and delivers the bytes to the right socket. Each header is
written by one layer and read only by the same layer on the other side.

The same packet also crosses routers on the way. A router unwraps only as
far as the IP header, picks where to send the packet next, and wraps it in
a fresh link-layer header for the next hop. It never needs to look at TCP
or HTTP.

![Two hosts and two routers in a row. Each host has four stacked boxes: application, transport, internet, link. Each router has only internet and link. Solid arrows join the internet and link layers from one box to the next, hop by hop. Dashed arrows run straight from Host A's transport and application layers to Host B's, showing that those layers talk end to end.](img/network-layers-hosts-and-routers.svg)

*Hosts run all four layers. Routers in the middle only run the bottom two,
so transport and application are a conversation between the two ends.*

## What each layer promises

**Link.** Gets a frame to another machine on the same network, and no
further. There's a link protocol for each kind of network. By 1988 IP
already ran over Ethernet and other local networks, satellite links,
packet radio and serial lines. On Ethernet the link layer also
needs a way to find the hardware address that goes with an IP address;
that's [[ethernet-and-arp]].

**Internet.** Gets a packet from the source host to the destination host,
across as many networks as it takes. This is IP, with its addresses
([[ip-addressing]]) and its hop-by-hop forwarding ([[ip-routing]]). IP
promises almost nothing. A packet may arrive damaged, duplicated, out of
order, or not at all. That's by design.

**Transport.** Turns host-to-host delivery into program-to-program
delivery, using ports to pick the program. TCP gives you a reliable,
ordered byte stream with flow control, built on top of IP's unreliable
packets. [[udp|UDP]] is a connectionless datagram service: each message
goes on its own.

**Application.** Everything else: HTTP, [[dns|DNS]], SMTP, your own
protocol. The Internet model doesn't split this layer further, though some
application protocols have layers of their own inside.

## Why the lines are drawn there

The split between TCP and IP wasn't in the first design. TCP and IP began
as one protocol. They were separated when it became clear that not every
program wanted a reliable stream. A remote debugger, for example, needs to
work exactly when the network is failing, so it's better off using
whatever packets get through than waiting for every byte in order.
Real-time voice had the same problem: it needs packets on a steady
schedule, and a lost packet can be covered with a moment of silence,
while waiting for a retransmission stalls everything behind it. So IP became
a plain datagram service, a building block, and reliability moved into an
optional layer above it.

The second idea is where state lives. The Internet's designers wanted the
network to keep working when routers failed. If the routers held the
state of every connection, a router crash would kill every connection
through it. So they put that state at the ends, in the hosts, and made
routers forward each packet on its own without remembering anything about
it. David Clark called this "fate-sharing": the connection's state is lost
only when the host that owns it is lost, and then it doesn't matter.

This is the end-to-end argument in practice. Some jobs, such as making
sure data arrived intact, can only be done fully by the two ends, because
only they know what "intact" means. The network can help, but it can't do
the job for them. That's why reliability lives in TCP, at the ends, and
not in the routers.

## Four layers or seven?

You'll also meet the OSI reference model, which has more layers. The
Internet's four layers map onto it loosely: the Internet application layer does the work
of OSI's top two layers, presentation and application. People still
borrow OSI's numbers when they talk, and Linux's own ARP documentation
calls hardware addresses "Layer2" addresses. When someone says "layer 2",
they mean the link layer.

The four-layer model is the one the Internet's own host requirements
(RFC 1122, 1989) are written against.

## Where it gets tricky

**The layers leak.** Strict layering says each layer should only use its
own header. Real protocols don't manage that. TCP's checksum covers a
"pseudo-header" that includes the IP source and destination addresses, so
TCP has to ask the IP layer for them. A misrouted segment then fails the
checksum, which is the point. Another leak is packet size: the transport
layer needs to know how big a packet the links below can carry, which is
the subject of [[mtu-and-fragmentation]].

**Some argue layering itself costs too much.** RFC 3439 (2002) has a
section titled "Layering Considered Harmful". Its case: if each layer has
to finish its work before the next starts, each gets optimized alone, and
multiplexing and splitting data into pieces hide facts a lower layer
needs.
Layer N ends up needing information from layer N-2. The authors'
conclusion is to split systems side by side rather than stack them deeper.
Treat the layer model as a map for thinking; plenty of real protocols
bend it.

**Some protocols don't sit in one layer.** [[icmp|ICMP]], IP's
error-reporting protocol, counts as part of IP but is carried inside IP
packets, like a transport. ARP, which maps IP addresses to hardware addresses on IPv4, goes
straight into Ethernet frames with its own type field, with no IP header
at all. IPv6 moved the same job into ICMPv6 packets, which sit on top of
IP. The same job lives at a different layer depending on the IP version.

**"The network is reliable" is the wrong reading of TCP.** TCP makes the
byte stream reliable between the two TCP endpoints. It doesn't know
whether your program on the other side processed the request, wrote it to disk, or
crashed right after the bytes arrived. The end-to-end argument applies to
you too: if your application needs to know a request was handled, it
needs an application-level answer.

## What this means when you build

- When something breaks, walk up the layers. Is the link up and does the
  neighbor answer (link)? Is there a route to the address (internet)? Is
  something listening on that port (transport)? Does the server answer
  sensibly (application)? Each question has its own tools.
- Count header overhead for small messages. An IPv4 packet carrying TCP
  spends at least 40 bytes on IP and TCP headers before your first byte;
  over IPv6 it's at least 60. On top of that comes the link header.
- In the Internet's design, routers keep no connection state. If your design needs
  state (a session, a retry, a deduplication key), it lives at the ends,
  in your hosts.
- Don't take "TCP is reliable" as "my request was handled". Confirm at the
  application layer.
- To see the layers for real, capture traffic ([[packet-capture]]): every
  packet shows up as nested headers, one per layer. Every layer also adds
  its own delay, which [[network-latency]] takes apart.

## Further reading

- [RFC 1122: Requirements for Internet Hosts -- Communication Layers](https://www.rfc-editor.org/rfc/rfc1122), R. Braden (ed.), 1989. The four layers as the IETF defines them, and the design assumptions behind them (section 1.1).
- [The Design Philosophy of the DARPA Internet Protocols](http://ccr.sigcomm.org/archive/1995/jan95/ccr-9501-clark.pdf), David D. Clark, 1988. Why TCP and IP were split, why IP is a datagram service, and fate-sharing, from the architect.
- [RFC 1958: Architectural Principles of the Internet](https://www.rfc-editor.org/rfc/rfc1958), B. Carpenter (ed.), 1996. The end-to-end argument and fate-sharing in two pages.
- [RFC 3439: Some Internet Architectural Guidelines and Philosophy](https://www.rfc-editor.org/rfc/rfc3439), R. Bush and D. Meyer, 2002. The case against strict layering (section 3).
- [RFC 9293: Transmission Control Protocol (TCP)](https://www.rfc-editor.org/rfc/rfc9293), W. Eddy (ed.), 2022. The pseudo-header, a concrete place where TCP reaches into IP (section 3.1).
- [RFC 8200: Internet Protocol, Version 6 (IPv6) Specification](https://www.rfc-editor.org/rfc/rfc8200), S. Deering and R. Hinden, 2017. Minimum header sizes for IPv4, IPv6 and TCP (section 8.3).
- [RFC 826: An Ethernet Address Resolution Protocol](https://www.rfc-editor.org/rfc/rfc826), David C. Plummer, 1982. The Ethernet header fields and the type field that lets many protocols share one wire.
- [arp(7)](https://man7.org/linux/man-pages/man7/arp.7.html), Linux man-pages, 2026. Where Linux calls hardware addresses "Layer2" addresses.
- [RFC 4861: Neighbor Discovery for IP version 6 (IPv6)](https://www.rfc-editor.org/rfc/rfc4861), T. Narten et al., 2007. How IPv6 moved address resolution into ICMPv6.
