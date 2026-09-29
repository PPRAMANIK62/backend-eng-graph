---
id: l4-vs-l7
title: L4 vs L7 load balancing
depth: short
phase: 3
note: >-
  Balancing connections by address and port vs balancing requests by
  reading them. What each can see and do.
needs: [load-balancing, network-layers]
leads_to: []
compare_with: []
---

# L4 vs L7 load balancing

A layer 4 load balancer picks a backend for each connection, looking
only at addresses and ports. A layer 7 balancer reads each request and
picks a backend for each one. Which kind sits in front of your service
decides what it can route on, what it can retry, and how much CPU it
burns doing it.

## Where the numbers come from

The numbers are layer numbers from the OSI reference model, published
by the ITU as X.200 and by ISO as 7498-1. It has seven numbered layers:
physical (1), data link (2), network (3), transport (4), session (5),
presentation (6) and application (7). The Internet itself uses a
simpler four-layer model: application, transport, internet and link
(see [[network-layers]]). People kept OSI's numbers as shorthand anyway. So
"L3" means IP, "L4" means [[tcp|TCP]] or [[udp|UDP]], and "L7" means
the application protocol: HTTP, gRPC, a database protocol.

## What a layer 4 balancer sees

A client opens a TCP connection to a service's virtual IP on port 443.
The first packet that reaches the balancer carries the source address
and port and the destination address and port. Those four fields, the
4-tuple, sit in the IP and TCP headers, which is all an L4 balancer
reads. It picks a backend for that 4-tuple, remembers the choice, and
sends every later packet of the connection to the same place.

It never looks at the payload. If the connection carries TLS, the
bytes pass through still encrypted, and the balancer couldn't read the
HTTP inside even if it wanted to. That's what makes L4 cheap: no
decryption, no parsing, no buffering of requests. Cloudflare measured
its L4 balancer, Unimog, at under 1% of the CPU of the servers it runs
on.

The price is that the only decision it can make is which server gets
the connection. Once chosen, that's fixed for the connection's whole
life. It can't route `/images` differently from `/api`, can't retry a
failed request, and can't see a 500. It can only tell whether a
connection worked.

## What a layer 7 balancer sees

An L7 balancer is a [[reverse-proxy]]. It accepts the client's TCP
connection itself, finishes the [[tls]] handshake, and parses the
requests ([[http-1-1]] or newer). Then it opens its own connections to
the backends. There are two separate connections, one on each side of
the proxy.

![Two panels. Left, an L4 balancer: the client's single TCP connection passes through the balancer to one backend; the balancer reads only source and destination addresses and ports, and the payload stays encrypted. Right, an L7 proxy: the client's connection ends at the proxy, which decrypts TLS and reads each HTTP request's method, path and headers, then sends request 1 to backend A and request 2 to backend B over its own connections.](img/l4-vs-l7-what-each-sees.svg)

*What each kind of balancer can see, and what it can choose.*

Because it sees every request, it can pick a backend per request,
route by host, path or header, retry a request that failed, add or
strip headers, and count status codes per backend. It pays for that by
decrypting and parsing every byte, and by holding buffers and state for
both sides of every connection.

## Why it matters for HTTP/2 and gRPC

With HTTP/1.1, a connection carries one request at a time, so busy
clients open several connections and cycle through them. Balancing
connections spreads the requests well enough.

[[http2]] changed that. It multiplexes many requests over one
long-lived connection, and a [[grpc]] client sends its calls over one
such connection.
Put an L4 balancer in front, and every call from that client is pinned
to whichever backend got the connection. Other backends sit idle while
one is overloaded. The fix is to balance calls, not connections: either
an L7 proxy that spreads requests, or a client that keeps a connection
to every backend and picks one per call.

## Where it gets tricky

**The backend may not see the client.** Behind an L7 proxy, the
backend's TCP connection comes from the proxy, so its source address
is the proxy's. Getting the real client address back needs headers or
the PROXY protocol, and those can lie ([[client-ip-forwarding]]). L4
balancers that wrap packets in another header, like Unimog, keep the
original packet and its addresses intact.

**The labels are loose.** An "L4" balancer reads layer 3 addresses as
well as layer 4 ports, and nothing stops a product from reading a bit
more. Ask what a balancer terminates and what it parses, not what layer
it's named after.

## What this means when you build

- Use L4 when you need raw throughput, any TCP or UDP protocol, or TLS
  that passes through untouched.
- Use L7 when you need per-request routing, retries, or balancing of
  multiplexed protocols like HTTP/2 and gRPC.
- Big sites run both: an L4 tier spreading connections over a fleet of
  L7 proxies (see [[load-balancing]]).

## Further reading

- [ITU-T X.200: OSI Basic Reference Model](https://www.itu.int/rec/T-REC-X.200-199407-I/en), ITU-T, 1994. Section 6.1.2 lists the seven layers and their numbers, where "L4" and "L7" come from.
- [RFC 1122: Requirements for Internet Hosts -- Communication Layers](https://www.rfc-editor.org/rfc/rfc1122), R. Braden (ed.), IETF, 1989. The Internet's own four layers, next to OSI's seven.
- [Unimog - Cloudflare's edge load balancer](https://blog.cloudflare.com/unimog-cloudflares-edge-load-balancer/), David Wragg, Cloudflare, 2020. What a layer 4 balancer can and can't do, from people who run one.
- [gRPC Load Balancing on Kubernetes without Tears](https://kubernetes.io/blog/2018/11/07/grpc-load-balancing-on-kubernetes-without-tears/), William Morgan, 2018. Why connection-level balancing pins HTTP/2 and gRPC traffic to one backend.
