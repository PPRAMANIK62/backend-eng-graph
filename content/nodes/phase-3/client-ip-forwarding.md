---
id: client-ip-forwarding
title: Client IP forwarding
depth: short
phase: 3
note: >-
  How a backend learns the real client address behind a proxy:
  X-Forwarded-For, Forwarded, the PROXY protocol, and why the header can
  lie.
needs: [reverse-proxy]
leads_to: []
compare_with: []
---


# Client IP forwarding

Behind a [[reverse-proxy]], every request your backend receives comes
from the proxy's address. The client's real address has to be passed
along separately, in a header or in a small preamble on the connection,
and whatever carries it can be forged. If you rate-limit, block, log or
geolocate by IP, you need to know which part of that information you
can trust.

## The address stops at the proxy

The client's [[tcp|TCP]] connection ends at the proxy, and the proxy opens its
own connection to the backend. Ask the backend's socket who's on the
other end and you get the proxy, which tells you nothing. Yet the
client address is what you need for diagnostics, access control and
handling abuse.

## X-Forwarded-For: a list each proxy appends to

The usual fix is a request header that each proxy extends with the
address it received the request from:

```http
X-Forwarded-For: 203.0.113.7, 192.0.2.10
```

The leftmost entry is the claimed client. Each proxy appends the
address of whoever connected to it, so the rightmost entry is whoever
connected to the last proxy. The proxy that talks to your
backend doesn't list itself: it's the socket's peer address. In nginx
this is one line, `proxy_set_header X-Forwarded-For
$proxy_add_x_forwarded_for`, which takes whatever the client sent and
appends the connecting address.

"Whatever the client sent" is the problem. Nothing stops a client from
sending its own X-Forwarded-For. The proxy appends to it, and the
forged value ends up leftmost, where a naive backend looks for
the client.

![A client at 203.0.113.7 sends a request that already carries a forged header "X-Forwarded-For: 198.51.100.9". Proxy A, an edge proxy at 192.0.2.10, appends 203.0.113.7. Proxy B at 10.0.0.5 appends 192.0.2.10. The backend's socket shows the peer 10.0.0.5, and the header reads "198.51.100.9, 203.0.113.7, 192.0.2.10". Reading from the right and skipping the trusted proxy 192.0.2.10 gives 203.0.113.7, the real client. The leftmost value, 198.51.100.9, is marked as forged.](img/client-ip-forwarding-xff-chain.svg)

*Each proxy appends what it saw. Read from the right, skip your own proxies, and stop at the first address you didn't add.*

## Reading it from the right

Only the entries added by proxies you run can be trusted. So read the
list from the right:

- **Trusted proxy list.** Configure the addresses of your proxies.
  Walk the list from the right, skip entries that belong to them, and
  take the first one that doesn't. That's the address that connected to
  your outermost proxy.
- **Trusted proxy count.** If you know there are exactly N proxies in
  front of you, count in from the right. With one proxy, the rightmost
  entry is the client.

The address you get may be a proxy the client used rather than the
client itself, but it's the only one you can rely on for security. Use
the leftmost value only where a lie does no harm. nginx's realip module
implements the list method: trusted senders go in `set_real_ip_from`,
and `real_ip_recursive on` makes it take the last address that isn't
trusted, instead of the last one.

## Forwarded, the standard version

RFC 7239 (2014) defined a standard header, `Forwarded`, to replace
X-Forwarded-For and its cousins `X-Forwarded-By` and
`X-Forwarded-Proto`. Each proxy adds one element with named parameters:

```http
Forwarded: for=192.0.2.43, for=198.51.100.17;by=203.0.113.60;proto=http;host=example.com
```

`for` is who connected, `by` is the proxy's own interface, `proto`
says whether the client used http or https, which matters when the
proxy terminates [[tls|TLS]] and the backend only sees plain HTTP, and
`host` is the original Host header. IPv6 addresses go in quotes and
brackets. Each element keeps one proxy's facts together, which the
separate X- headers can't. It's much less used than X-Forwarded-For,
and it has the same trust problem: the RFC says it "cannot be relied
upon to be correct".

## The PROXY protocol, for proxies that don't read HTTP

A proxy working at the TCP level, like a TLS terminator or a load
balancer in TCP mode (see [[l4-vs-l7]]), doesn't parse HTTP, so it
can't add a header. The PROXY protocol, from HAProxy, solves this by
sending one line before any of the client's bytes:

```text
PROXY TCP4 192.168.0.1 192.168.0.11 56324 443\r\n
GET / HTTP/1.1\r\n
```

It carries the source and destination addresses and ports: what the
backend would have got from `getpeername()` and
`getsockname()` if the client had connected directly. Version 1 is
that text line, at most 107 characters; version 2 is binary and starts
with a fixed 12-byte signature. It works for any protocol, HTTP or not.

Two rules make it safe. The backend must be configured to expect the
header and must never guess whether it's there, so a port that accepts
PROXY can't also accept connections from the public, or anyone could
send a forged line. And it must not be used on a connection that
carries many clients' requests, because the backend would apply one
address to all of them.

## Where it gets tricky

- **A backend reachable directly trusts nothing.** If clients can
  bypass the proxy and connect straight to your backend, they can send
  any header they like, and no part of the list is safe to use.
- **Several headers make one list.** A request can carry more than one
  X-Forwarded-For header. Join them in order into one list; reading
  only one of them can give you the wrong address.
- **Forged entries may not be addresses at all.** Parse and validate
  each entry before using it.

## What this means when you build

- Set the client address in one place, your outermost proxy, from the
  socket, and overwrite or strip what the client sent.
- In the backend, trust forwarding headers only from your proxies'
  addresses, and read X-Forwarded-For from the right.
- Keep backends unreachable except through the proxy.
- Use the PROXY protocol between TCP-level hops, on private ports.

## Further reading

- [RFC 7239](https://www.rfc-editor.org/rfc/rfc7239), A. Petersson and M. Nilsson, IETF, 2014. The Forwarded header, its parameters, a two-proxy example, and why it can't be trusted.
- [The PROXY protocol, versions 1 & 2](https://www.haproxy.org/download/3.0/doc/proxy-protocol.txt), Willy Tarreau, HAProxy Technologies, revised 2020. Passing the client address in front of any TCP connection, and the rules that keep it safe.
- [X-Forwarded-For](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Forwarded-For), MDN contributors, 2025. The clearest practical rules for parsing the header and choosing an address.
- [Module ngx_http_proxy_module](https://nginx.org/en/docs/http/ngx_http_proxy_module.html), nginx docs, 1.31. What `$proxy_add_x_forwarded_for` appends.
- [Module ngx_http_realip_module](https://nginx.org/en/docs/http/ngx_http_realip_module.html), nginx docs. The trusted-list method as configuration, including the PROXY protocol source.
