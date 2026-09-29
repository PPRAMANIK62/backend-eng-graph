---
id: quic
title: QUIC
depth: deep
phase: 3
note: >-
  A transport on UDP that does TCP's and TLS's jobs in one: reliable
  streams, encryption in the same handshake, and connections that
  survive an address change.
needs: [udp, tls, head-of-line-blocking, tcp-handshake, nat]
leads_to: [http3]
compare_with: [tcp]
---


# QUIC

QUIC is a transport protocol that runs on top of [[udp|UDP]] and does what
[[tcp|TCP]] and [[tls|TLS]] do together: reliable, ordered streams of bytes, congestion
control, and encryption, set up in one combined handshake. The IETF
version is RFC 9000 (2021), with RFC 9001 for how it uses TLS and RFC
9002 for loss recovery. [[http3|HTTP/3]] runs on it. You'd care because
it cuts a round trip off every new connection, stops one lost packet
from stalling unrelated requests, and keeps a connection alive when a
phone moves from Wi-Fi to mobile data. It also costs more CPU and
doesn't get through every network.

## Why a new transport on UDP

If TCP had problems, why not fix TCP? Google, which built the first
QUIC as an experiment in 2013, gave two reasons.

- **TCP lives in the operating system.** Changing it means shipping
  new kernels to every client and server, and many devices run years
  behind.
- **The network has frozen TCP in place.** Firewalls drop traffic they
  don't recognise, [[nat|NATs]] rewrite transport headers, and many
  middleboxes inspect and modify the TCP header. A simple change to TCP
  now takes upwards of a decade to deploy widely.

[[udp|UDP]] gets through almost everywhere, and a protocol built on it
can live in a library inside the application and ship with it. QUIC
then encrypts nearly all of its own header, so middleboxes have nothing
to depend on and the protocol can keep changing. It's the same idea as
[[tls]] protecting the payload, extended to the transport's own
bookkeeping.

## One handshake instead of two

Over [[tcp]], a new HTTPS connection pays twice. The
[[tcp-handshake|TCP handshake]] costs at least one round trip, and TLS
1.3 adds another before any request can go out. QUIC merges the two:

![Three timelines side by side. TCP plus TLS 1.3: SYN, SYN-ACK, then ClientHello and ServerHello, and the request goes out after two round trips. QUIC: the Initial packet carries the ClientHello, the server answers with its Initial and Handshake packets, and the request goes out after one round trip. QUIC 0-RTT on a repeat connection: the request goes out in the very first flight, next to the ClientHello.](img/quic-handshake-rtts.svg)

*Round trips before the first request. The QUIC timelines are adapted from Jana Iyengar and Martin Thomson (editors), RFC 9000, "QUIC", figures 5 and 6 (2021).*

Step by step, for a first visit:

1. The client sends an **Initial** packet with the TLS ClientHello
   inside a CRYPTO frame. QUIC carries the TLS handshake messages
   itself; there are no TLS records.
2. The server answers with its own Initial (ServerHello) and a
   **Handshake** packet with the rest of TLS: certificate, signature,
   Finished. It can even add response data already, sent in 1-RTT
   packets.
3. The client finishes the handshake and sends its request in the same
   flight. One round trip has passed.

The whole exchange can fit in as few as four UDP datagrams, because
several QUIC packets can be packed into one datagram. On a repeat visit
the client can send data in its very first flight (**0-RTT**), using
keys from the previous connection. That data can be replayed by an
attacker, the same risk as in TLS ([[tls-resumption]]).

The application protocol is always agreed during the handshake, with
ALPN, so there's no guessing what's spoken on the connection.

## Packets, frames and streams

The layers stack like this: a UDP datagram holds one or more QUIC
packets, and each packet holds frames.

- **Packets** use a *long header* during the handshake, carrying the
  QUIC version and both sides' connection IDs, and a *short header*
  afterwards with just the destination connection ID and an encrypted
  packet number.
- **Frames** carry everything else: STREAM frames for data, ACK frames,
  CRYPTO frames for the handshake, PING, and so on. The whole packet is
  authenticated, and as much as possible is encrypted.

**Streams** are QUIC's version of the streams in [[http2]], built into
the transport. Each stream is its own ordered byte stream, and there is
no ordering between streams. A stream has a 62-bit ID whose two lowest
bits say who opened it and whether it's two-way or one-way. There's no
setup: a single STREAM frame can open a stream, carry its data and
close it.

This is where [[head-of-line-blocking]] goes away. When a packet is
lost, only the streams that had data in that packet wait for the
retransmission. The rest keep delivering to the application.

Flow control works like HTTP/2's: a window per stream and one for the
whole connection. Each side also limits how many streams the other may
open.

## Loss recovery without guessing

QUIC's reliability looks like TCP's, with one design change that makes
it simpler. TCP numbers bytes, and a retransmitted segment carries the
same sequence number as the original. When an ACK comes back, TCP can't
tell which copy it acknowledges, which muddles round-trip measurement
(see [[tcp-retransmission]]).

QUIC numbers *packets*, and a packet number is never used twice. When
data is lost, QUIC puts it in a new packet with a new number. Delivery
order comes from the byte offsets inside STREAM frames, not from packet
numbers. So every ACK names exactly one transmission, RTT samples are
clean, and spurious retransmissions are easy to spot. Some other
differences:

- ACK frames can list many ranges of received packets, where TCP's SACK
  option fits three.
- The receiver reports how long it held each ACK back, so the sender
  can correct its RTT estimate.
- There are three packet number spaces (Initial, Handshake, and
  application data), each with its own keys.

[[congestion-control|Congestion control]] is the sender's choice. The
spec describes one similar to TCP NewReno, and a sender can use CUBIC
or another algorithm without asking the receiver. Because QUIC runs in
the application, changing the algorithm means updating a library, not a
kernel.

## Connections that survive a new address

A TCP connection is identified by its four-tuple: two addresses, two
ports ([[ports-and-sockets]]). Change any of them and it's a different
connection. That happens more than you'd think. A phone switches
networks, or a NAT that forgot an idle mapping gives the client a new
port.

QUIC identifies a connection by **connection IDs** instead. Each side
picks the IDs the other puts in its packets' Destination Connection ID
field, and hands out spare ones with NEW_CONNECTION_ID frames:

![A phone talks to a server over Wi-Fi from address 198.51.100.7 port 51000, sending packets with destination connection ID c1. It moves to mobile data, now 203.0.113.9 port 40200, and keeps sending on the same connection with destination connection ID c2, a spare ID the server issued earlier. The server finds the connection by either ID, checks the new path, and carries on; the two paths can't be linked by an observer because the IDs differ.](img/quic-connection-migration.svg)

*Connection migration: the addresses change, the connection doesn't.*

When packets for a known connection arrive from a new address, the
server validates the new path (checking the client really receives
packets there, so a spoofed address can't hijack the connection) and
carries on. The client switches to a fresh connection ID when it
migrates, so an observer can't match the old path to the new one.

A few rules: in QUIC version 1 only the client can migrate, and not
until the handshake is confirmed. Connection IDs are at most 20 bytes.

## Where it gets tricky

**UDP doesn't get through everywhere.** In Google's 2017 measurements,
4.4% of video clients couldn't use QUIC at all, commonly on corporate
networks behind firewalls that block UDP. So QUIC always needs a TCP fallback. Google's
clients learned a server spoke QUIC from an `Alt-Svc` response header,
then raced QUIC against TCP on the next connection, giving QUIC a head
start of up to 300 ms.

**It costs more CPU.** When Google first measured serving YouTube over
its QUIC, server CPU use was about 3.5 times that of TLS over TCP. The
main costs were cryptography, sending and receiving UDP packets, and
connection state. After tuning it was about twice TLS/TCP. Those are
2017 numbers for Google's pre-IETF QUIC and may not hold for today's
implementations, so measure your own stack.

**Middleboxes still get in.** QUIC leaves a few header bits
unencrypted so a receiver can find the connection. Google once changed
one flag bit and broke users behind a firewall brand that used that bit
to spot QUIC: first packets passed, later ones were dropped, and the
TCP fallback never kicked in. Encryption limits ossification; it doesn't
end it.

**Idle UDP flows get forgotten fast.** NATs and firewalls can drop
the state for an idle UDP flow quickly. Keeping most middleboxes from
losing it takes a packet about every 30 seconds. QUIC's own idle
timeout is the smaller of the two sides' values, after which the
connection is silently dropped. A PING frame restarts both clocks; it
plays the role [[tcp-keepalive|TCP keepalive]] plays for TCP.

**The first packets aren't really secret.** Initial packets are
encrypted with keys derived from the client's connection ID, which is
in plain sight. Anyone on the path can read and tamper with them. Real
protection starts with the Handshake keys.

**Size rules.** QUIC needs a path that carries 1200-byte UDP payloads,
and it must never be fragmented at the IP layer (see
[[mtu-and-fragmentation]]). A client pads its first Initial to at least
1200 bytes. Until the server has confirmed the client's address, it may
send no more than three times what it received, so it can't be used to
flood a spoofed victim.

**Head-of-line blocking isn't gone, just smaller.** Data inside one
stream is still in order, and a packet carrying several streams blocks
all of them when lost.

**Google's gains aren't a promise.** Google reported Search latency
down 8.0% on desktop and 3.6% on mobile, and YouTube rebuffering down
18.0% and 15.3%, when QUIC was over 30% of its egress traffic. That was
Google's own QUIC, its own network and its own apps.

## What this means when you build

- Always keep TCP as a fallback, and let UDP through to your QUIC
  servers wherever you expect QUIC to work.
- A load balancer that routes by four-tuple breaks migration. Route
  QUIC by connection ID; RFC 9000 leaves room to encode routing
  information in the IDs you issue.
- Don't put requests with side effects in 0-RTT data.
- Plan for idle NAT timeouts: send something about every 30 seconds on
  connections that must stay up.
- Budget more CPU per byte than TCP, and measure it on your own
  hardware.
- QUIC is a library, not a kernel feature, so its version is yours to
  track and upgrade, like any other dependency.

## Further reading

- [RFC 9000](https://www.rfc-editor.org/rfc/rfc9000), Jana Iyengar, Martin Thomson (editors), IETF, 2021. The transport: streams, connection IDs, the handshake, migration, packet formats.
- [RFC 9001](https://www.rfc-editor.org/rfc/rfc9001), Martin Thomson, Sean Turner (editors), IETF, 2021. How QUIC carries TLS 1.3, header protection, and 0-RTT replay.
- [RFC 9002](https://www.rfc-editor.org/rfc/rfc9002), Jana Iyengar, Ian Swett (editors), IETF, 2021. Loss detection and congestion control, with section 4 listing the differences from TCP.
- [RFC 9293](https://www.rfc-editor.org/rfc/rfc9293), Wesley Eddy (editor), IETF, 2022. What identifies a TCP connection, for comparison with connection IDs.
- [The QUIC Transport Protocol: Design and Internet-Scale Deployment](https://research.google/pubs/the-quic-transport-protocol-design-and-internet-scale-deployment/), Adam Langley et al., Google, SIGCOMM 2017. Why QUIC exists, and what deploying it at scale cost and gained.
