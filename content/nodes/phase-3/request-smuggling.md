---
id: request-smuggling
title: Request smuggling
depth: short
phase: 3
note: >-
  When a proxy and a backend disagree about where one request ends and
  the next begins.
needs: [http-1-1, reverse-proxy, http2]
leads_to: [fuzzing]
compare_with: []
---


# Request smuggling

Request smuggling happens when a [[reverse-proxy]] and the backend
behind it read the same bytes and disagree about where one HTTP request
ends. An attacker uses that disagreement to leave part of their request
sitting on the backend connection, where it gets glued to the front of
the next request, often someone else's. It only exists because of
proxies, and it's why your proxy's HTTP parser matters for security.

## Two ways to say where a body ends

In [[http-1-1|HTTP/1.1]], requests on one connection are simply placed
back to back, with nothing between them. The receiver finds the end of
each one from its headers:

- `Content-Length: 6` means the body is the next 6 bytes.
- `Transfer-Encoding: chunked` means the body comes in chunks, each
  with its size in hex, and ends at a chunk of size zero.

If a request carries both, the spec (RFC 9112, 2022) says
Transfer-Encoding wins. That rule dates from early senders that sent
both, the length only for progress bars. The same spec also says such a
message "ought to be handled as an error", that a server may reject it
or use Transfer-Encoding alone but must close the connection
afterwards, and that a proxy that forwards it must strip the
Content-Length first.

The trouble starts when two programs in a chain don't follow those
rules the same way.

## One attack, byte by byte

The proxy takes requests from many clients and sends them to the
backend over a few reused connections. Now an attacker sends this:

```http
POST / HTTP/1.1
Host: example.com
Content-Length: 6
Transfer-Encoding: chunked

0

G
```

Suppose the proxy ignores Transfer-Encoding and trusts Content-Length.
It reads six bytes of body, `0`, CR, LF, CR, LF and `G`, and forwards
the whole thing. The backend uses Transfer-Encoding. It sees the `0`
chunk, decides the body is over, and answers. The `G` is left on the
connection.

![Two rows show the same bytes on the backend connection. Top row, how the proxy reads them: one request whose body, by Content-Length 6, is "0, CRLF, CRLF, G". Bottom row, how the backend reads them: the request ends after the zero-size chunk, the leftover "G" stays on the connection, and the next user's request "POST / HTTP/1.1" arrives behind it, so the backend reads it as "GPOST / HTTP/1.1".](img/request-smuggling-cl-te.svg)

*A CL.TE desync: the proxy trusts Content-Length, the backend trusts chunked, and the leftover byte becomes the start of the next request. Adapted from James Kettle, "HTTP Desync Attacks: Request Smuggling Reborn" (PortSwigger, 2019).*

The next request the proxy sends down that connection belongs to a
different user. The backend reads it as `GPOST / HTTP/1.1` and the user
gets an error about an unknown method. Swap the `G` for a whole
request line and headers, and the attacker controls the start of
another user's request.

This case is called **CL.TE**: the front end uses Content-Length, the
back end uses Transfer-Encoding. **TE.CL** is the reverse, with the
offsets flipped. Two Content-Length headers (**CL.CL**) rarely work,
because most servers reject duplicates. In practice attackers hide the
Transfer-Encoding header from one side with small spelling quirks: a
space before the colon, a tab after it, `xchunked`. Each quirk is
harmless when both sides share it and dangerous when only one does.

Pipelining isn't needed. All it takes is a proxy that reuses a backend
connection for different clients' requests, which is exactly the
[[connection-pooling]] every proxy does.

## What it's used for

Once an attacker can prepend bytes to other requests, they can route
someone else's request to a page of their choosing, get past rules the
proxy enforces (the backend never saw the proxy's check), capture parts
of other users' requests, and poison a shared [[http-caching|cache]] so that a harmful
response is served to everyone. The 2019 research that revived the
attack used it on PayPal's login page, among others. It was first
described in 2005.

## Where it gets tricky

**HTTPS doesn't help.** The ambiguity is inside the HTTP messages, after
[[tls|TLS]] has been removed.

**Patched is not fixed.** In 2025 the same researcher argued that six
years of stricter parsers and firewall rules had mostly hidden the
problem from the old detection methods rather than removed it, and
found new variants anyway. One, a desync inside Cloudflare's own
infrastructure, exposed over 24 million websites before it was patched
within hours.

**HTTP/2 at the front isn't enough.** [[http2|HTTP/2]] frames carry their own
lengths, so there's nothing to disagree about. But many front ends
speak HTTP/2 to the client and rewrite each request as HTTP/1.1 for the
backend. That adds a fourth way to state a length (Content-Length,
chunked, an implied zero, and HTTP/2's own) and is more dangerous than
HTTP/1.1 end to end. What matters is the hop between proxy and
backend, because that's the connection shared between users.

**Normalise or reject?** A proxy can clean up an ambiguous request
before forwarding it. A backend can't know what the proxy did, so it
should reject such requests and close the connection. Rejecting breaks
more legitimate traffic, which is why vendors are slow to do it.

## What this means when you build

- Speak HTTP/2 from the proxy to the backend if both support it. nginx
  added HTTP/2 to upstreams in 1.29.4; when the 2025 research was
  written, nginx, Akamai, CloudFront and Fastly were listed as lacking
  it.
- If you're stuck on HTTP/1.1 upstream: turn on every normalisation
  and validation option in the proxy, validate in the backend too,
  reject requests with a body on methods that don't need one (GET,
  HEAD, OPTIONS), and consider not reusing backend connections, at a
  cost in speed.
- If you write an HTTP parser, reject both headers together, reject
  malformed Transfer-Encoding, and close the connection on any framing
  error. Then test it against another implementation with the known
  smuggling cases as seeds: that's differential [[fuzzing]].

## Further reading

- [RFC 9112](https://www.rfc-editor.org/rfc/rfc9112), R. Fielding, M. Nottingham, J. Reschke (editors), IETF, 2022. Section 6.3, the ordered rules for working out a message's length, and 11.2 on smuggling.
- [HTTP Desync Attacks: Request Smuggling Reborn](https://portswigger.net/research/http-desync-attacks-request-smuggling-reborn), James Kettle, PortSwigger, 2019. The attack explained with real exploits, safe detection, and defences.
- [Module ngx_http_proxy_module](https://nginx.org/en/docs/http/ngx_http_proxy_module.html), nginx docs, 1.31. When HTTP/2 to backends arrived.
- [HTTP/1.1 must die: the desync endgame](https://portswigger.net/research/http1-must-die), James Kettle, PortSwigger, 2025. Why patches haven't ended it, HTTP/2 downgrading, and the case for HTTP/2 upstream.
