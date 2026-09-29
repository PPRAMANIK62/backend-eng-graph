---
id: haproxy-proxy-protocol
title: The PROXY protocol, versions 1 & 2
author: Willy Tarreau, HAProxy Technologies
url: https://www.haproxy.org/download/3.0/doc/proxy-protocol.txt
kind: spec
primary: true
---

## Summary

The spec for the PROXY protocol (first version 2010, last revised 2020,
as shipped with HAProxy 3.0): a short header a TCP-level proxy sends at
the start of each connection to the server, carrying the original
client's source and destination addresses and ports. Works for any
protocol because the proxy doesn't parse what's inside.

## Key claims

- Relaying TCP through proxies loses the original addresses. "Relaying TCP connections through proxies generally involves a loss of the original TCP connection parameters such as source and destination addresses, ports, and so on." (1)
- Header-based schemes need the proxy to understand the protocol. "However, both mechanisms require a knowledge of the underlying protocol to be implemented in intermediaries." (1)
- Adding X-Forwarded-For only to the first request of a kept-alive connection breaks later requests. "The Stunnel patch will only add the X-Forwarded-For header to the first request of each connection and all subsequent requests will not have it." (1)
- The idea: one header at the start of the connection. "Another approach consists in prepending each connection with a header reporting the characteristics of the other side's connection." (1)
- It carries what getsockname()/getpeername() would have returned. "The information carried by the protocol are the ones the server would get using getsockname() and getpeername() :" (2)
- Version 1 is a human-readable line; version 2 is binary. "Version 1 was focused on keeping it human-readable for better debugging possibilities" (2)
- The receiver must be set up for it and must not guess whether it's there. "The receiver MUST be configured to only receive the protocol described in this specification and MUST not try to guess whether the protocol header is present or not." (2)
- So one port can't serve both trusted proxies and the public, or anyone could spoof an address. "Otherwise it would open a major security breach by allowing untrusted parties to spoof their connection addresses." (2)
- Only trusted proxies should be allowed to send it. "The receiver SHOULD ensure proper access filtering so that only trusted proxies are allowed to use this protocol." (2)
- Not for connections that carry many clients' requests. "Such proxies MUST NOT implement this protocol on multiplexed connections because the receiver would use the address advertised in the PROXY header as the address of all forwarded requests's senders." (2)
- Example v1 line before an HTTP request. "PROXY TCP4 192.168.0.1 192.168.0.11 56324 443\r\n" (2.1)
- A v1 line is at most 107 characters. "If the CRLF sequence is not found in the first 107 characters, the receiver should declare the line invalid." (2.1)
- Version 2 starts with a fixed 12-byte signature. "The binary header format starts with a constant 12 bytes block containing the protocol signature :" (2.2)

## Visuals worth redrawing

- A TCP stream with the PROXY line in front of the HTTP request.

## My notes

- The document header carries a revision date; don't copy it.
