---
id: encrypted-dns
title: Encrypted DNS
depth: short
phase: 3
note: >-
  DNS over TLS, HTTPS or QUIC: hiding lookups from the network between
  you and your resolver.
needs: [dns, tls]
leads_to: []
compare_with: []
---

# Encrypted DNS

Plain [[dns]] sends every lookup in clear text, so anything on the
network between you and your resolver can read your queries and change
the answers. Encrypted DNS carries the same DNS messages inside
[[tls]]: DNS over TLS (DoT), DNS over HTTPS (DoH), and DNS over QUIC
(DoQ). It protects that one network hop. The resolver at the other end
still sees every name you ask for.

## The same DNS messages, three ways to wrap them

None of the three changes the DNS messages, only how they travel.

**DNS over TLS** (RFC 7858, 2016). The client opens a [[tcp]]
connection to port 853 and starts a TLS handshake right away. After
that, it sends ordinary DNS messages, each with the same two-byte
length prefix that DNS over TCP always used. Port 853 never carries
cleartext DNS, and DoT is never run on port 53. Keeping the two apart
makes it harder for an attacker to push a client back to plain DNS. Clients are meant
to keep the connection open, send several queries without waiting, and
match each answer to its query by the DNS message ID, because answers
can come back in any order.

**DNS over HTTPS** (RFC 8484, 2018). Each DNS query becomes one HTTPS
request. With GET, the query is base64url-encoded into a `dns`
parameter in the URL. With POST, the raw DNS message is the body, with
content type `application/dns-message`. The answer comes back as the
body of the response. [[http2|HTTP/2]] is the minimum recommended
version: [[udp|UDP]] DNS answers arrive in any order with little overhead, and
HTTP needs parallel requests, reordering and header compression to keep
up. DoH uses port 443 and can share a connection
with other HTTPS traffic, which makes it hard for the network to single
out.

**DNS over QUIC** (RFC 9250, 2022). DNS on [[quic|QUIC]], on UDP port
853, with one query per QUIC stream. A lost packet then delays only its
own query, not the ones behind it (see [[head-of-line-blocking]]). The
goal is DoT's privacy with latency closer to plain UDP DNS. DoT and
DoH were written for the hop from a stub to its resolver; DoQ is meant
for every hop, including resolvers talking to authoritative servers.

![A stub resolver on your machine sends queries across the local network and the ISP to a recursive resolver, which then asks authoritative servers. With plain DNS, an observer on the local network or ISP sees every name. With encrypted DNS that path is encrypted, but the recursive resolver still sees every name and your address, and the hop from resolver to authoritative servers isn't covered by DoT or DoH.](img/encrypted-dns-what-it-hides.svg)

*What encrypted DNS protects: the hop from your stub resolver to the recursive resolver, and nothing past it.*

## What it hides, and from whom

Someone watching your network sees encrypted traffic to the resolver's
address, not the names. The resolver itself still reads every query,
and knows your IP address. DoH adds more ways to recognise you
there: one long-lived connection groups your queries together, [[tls-resumption|TLS
session resumption]] links connections, and HTTP brings cookies and
headers. A DoH client shouldn't accept cookies unless it really needs
them.

Encryption doesn't hide sizes and timing either, and those still leak
information. Padding the messages helps a little.

## It's only as good as the server check

TLS without checking who's on the other end only stops listeners. An
attacker in the middle can pretend to be the resolver.

DoT can run in two ways. With **opportunistic** privacy,
the client tries TLS and uses it if it works, without insisting on
authenticating the server. That protects you from passive listeners
only. With **key pinning**, the client knows the resolver's public key
fingerprint in advance and refuses any server that doesn't match. DoH
uses the normal HTTPS check of the server's certificate, and a DoH
client must use only the server it was configured with.

## Where it gets tricky

**It doesn't make answers trustworthy.** Encryption protects the path
to the resolver. If the resolver lies, or is compromised, you get a
lie over a secure channel. Checking that an answer really came from the
zone's owner is [[dnssec]]. The two are independent, and each is
useful without the other.

**It costs round trips.** Compared with UDP, DoT first needs a TCP
handshake, one extra round trip, and then a TLS handshake. With TLS
1.2, current when DoT was specified, that was two more round trips.
That's why the specs push for long-lived connections and
resumption.

**It routes around the network's DNS.** Filtering or monitoring that
reads plain DNS stops working when an application uses DoH to a
resolver of its choice. That resolver also decides the answers, so
split DNS (see [[dns]]) may not work as the network intends.

**Finding the resolver is circular.** A DoH client can't look up its
DoH server's name through that same server. The first lookup has to
come from configuration, an IP address, or plain DNS with the HTTPS
certificate still checked.

**DoH errors hide inside 200s.** A DNS failure like NXDOMAIN or
SERVFAIL comes back as HTTP 200. Read the DNS answer for the result.

## What this means when you build

- Know which hop you're protecting. Encrypted DNS covers stub to
  resolver; it says nothing about what the resolver does.
- For a DoH client, use DNS ID 0 so identical queries cache the same,
  and subtract the `Age` header from the TTL. A DoH server's HTTP cache
  lifetime must not be longer than the smallest TTL in the answer.
- Keep DoT and DoH connections open and reuse them.
- Expect port 853 to be blocked on some networks. A DoT client should
  remember servers that failed, for something like an hour, instead of
  retrying every query.
- If you need answers you can trust as well as private, validate
  DNSSEC too.

## Further reading

- [RFC 7858](https://www.rfc-editor.org/rfc/rfc7858), Z. Hu, L. Zhu, J. Heidemann, A. Mankin, D. Wessels, P. Hoffman, IETF, 2016. DNS over TLS: port 853, framing, connection reuse, privacy profiles, costs and what still leaks.
- [RFC 8484](https://www.rfc-editor.org/rfc/rfc8484), P. Hoffman, P. McManus, IETF, 2018. DNS over HTTPS: GET and POST, caching against TTLs, and a long list of privacy and operational trade-offs.
- [RFC 9250](https://www.rfc-editor.org/rfc/rfc9250), C. Huitema, S. Dickinson, A. Mankin, IETF, 2022. DNS over QUIC, one query per stream.
