---
id: reverse-proxy
title: Reverse proxies
depth: deep
phase: 3
note: >-
  A server that takes client requests and forwards them to backends.
  What it can add: TLS, retries, caching, limits.
needs: [http-1-1, connection-pooling]
leads_to: [request-smuggling, client-ip-forwarding, zero-downtime-reload, load-balancing, cdn, api-gateway, egress-proxy]
compare_with: []
---


# Reverse proxies

A reverse proxy is a server that clients talk to as if it were the real
site, and that passes each request on to one of the servers behind it.
nginx, HAProxy and Envoy are well-known examples. If your backend
sits behind one, what it does to your requests (rewriting headers,
buffering bodies, retrying, timing out, reusing connections) is part of
how your service behaves, whether you configured it or not.

## One request, two connections

Take a browser loading `https://shop.example/cart`. DNS for
`shop.example` points at the proxy, not at your application. Here's
what happens:

1. The browser opens a [[tcp|TCP]] connection to the proxy and does a
   [[tls|TLS]] handshake with it. The proxy holds the certificate.
2. The proxy decrypts the bytes and parses the HTTP request
   ([[http-1-1]] or [[http2|HTTP/2]]).
3. It looks at the host and path and picks a group of backends, then
   one backend in that group, say `10.0.0.12:8080`.
4. It sends the request to that backend, usually over a connection it
   already has open.
5. It reads the backend's response and writes it back to the browser.

![A browser on the left connects over TLS to a reverse proxy in the middle. The proxy terminates TLS, parses the request, picks a route and a backend, and forwards the request over a pooled, already-open connection to one of three backends on the right. Labels show that the client side is called downstream and the backend side upstream, and that these are two separate connections.](img/reverse-proxy-two-connections.svg)

*A reverse proxy sits between two separate connections: one from the client, and one (usually reused) to a backend.*

The key thing: there are two separate connections. The client's
connection ends at the proxy. The proxy opens, or reuses, its own
connection to the backend. Your application never sees the browser's
TCP connection, its TLS session or its address. It sees a request
coming from the proxy.

A chain can be longer. HTTP counts every hop: a request through three
intermediaries crosses four connections, and some options apply to one
hop only, others to the whole chain.

## Three kinds of middlebox

The HTTP spec (RFC 9110, 2022) names three kinds of intermediary:

- A **proxy** is chosen by the client.
  A company might send all its staff's web traffic through one.
- A **gateway**, "a.k.a. reverse proxy", is chosen by the server's
  owner. To the client it looks exactly like the origin server. Behind
  it, it can talk to the real servers in any protocol it likes.
- A **tunnel** relays bytes blindly and stops being part of the HTTP
  conversation once it's set up.

The spec lists the classic reasons to run a gateway: to put a front on
old or untrusted services, to cache responses ("accelerator" caching),
and to spread load over several machines.

Proxy software has its own words for the two sides. Envoy calls the
client side **downstream** and the backend side **upstream**; a group
of interchangeable backends is a **cluster**, and each backend is an
**endpoint**. nginx calls the group an upstream too. The RFC's
version of the same idea is that requests travel **inbound**, toward
the origin, and responses travel outbound.

## What the proxy must change in each request

Forwarding a request isn't copying bytes. A proxy that follows the spec
has to edit the message:

- **Hop-by-hop headers come off.** Some headers describe only the
  current connection: `Connection` and every header it names, plus
  `Keep-Alive`, `TE`, `Transfer-Encoding` and `Upgrade`. The proxy acts
  on them and removes them, then adds its own for the next hop. So the
  way the client framed its request isn't necessarily the way the
  backend sees it framed.
- **Host usually changes.** nginx, by default, doesn't pass the
  client's `Host` and `Connection` headers on. It sends the upstream's
  own name as `Host` unless you configure otherwise. If your application builds URLs from
  `Host`, you have to tell the proxy to pass the original.
- **Via may be added.** Each intermediary can append itself to a `Via`
  header, like the `Received` lines in an email. A gateway is required
  to add it to requests it forwards to the backend, and may use a
  pseudonym to hide internal host names.
- **The client's address is lost,** so proxies add it back in a header
  such as `X-Forwarded-For`. How to do that without being lied to is
  [[client-ip-forwarding]].
- **Unknown things pass through.** New methods, status codes and
  headers the proxy doesn't recognise must be forwarded anyway, or HTTP
  couldn't grow.
- **No loops.** A proxy must not forward a request to itself unless
  something stops an endless loop.

## What a proxy can add

Once all traffic goes through one place, that place is a good spot for
jobs you'd otherwise repeat in every service.

**TLS termination.** The proxy holds the certificates and does the
handshakes. The backend can speak plain HTTP on a private network, or
TLS again if it must.

**Routing and load balancing.** The proxy picks a backend per request,
by host, path or headers, and skips backends that look dead. That's
[[load-balancing]].

**Connection reuse.** The browser's connection lives and dies with the
browser. The proxy's connections to backends can stay open and carry
many clients' requests one after another, which saves the backend a
[[tcp-handshake|TCP handshake]] and a TLS handshake per request. That
reuse is [[connection-pooling]].

**Buffering.** By default nginx reads the whole request body from the
client before it sends anything to the backend, and it reads the
backend's response as fast as the backend can send it, into memory
buffers (one memory page each, 4 or 8 KB) and then into a temporary
file on disk if the response is bigger. The backend is done as soon
as the proxy has the response, and the slow part of the exchange, a
client on a bad phone connection say, happens between the client and
the proxy. The cost is that nothing reaches the client piece by piece.
With response buffering off, bytes are passed to the client as they
arrive, which is what a stream of events needs.

**Timeouts.** The proxy decides how long to wait for a backend. nginx's
defaults are 60 seconds to connect and 60 seconds for reading, and the
read timeout counts the gap between two reads, not the whole response.
A backend that sends one byte every 59 seconds never times out.

**Retries.** When a backend fails, the proxy can try another one. This
gets its own section, because it's where proxies can do damage.

**Caching.** A proxy can store responses and serve repeats itself, following [[http-caching|HTTP's caching rules]]. Put
caching proxies close to users all over the world and you have a
[[cdn]].

**Error responses.** When the backend fails, the proxy has to answer
something. The spec gives it two codes of its own: 502 Bad Gateway when
the backend's response was invalid, and 504 Gateway Timeout when no
response came in time. When you see those, the proxy is telling you
about the hop behind it.

## Retries: only when it's safe to send twice

Say the proxy sends `POST /orders` to a backend and the connection
drops before any response arrives. Did the order get created? The proxy
can't know. If it sends the request to another backend, the customer
may get two orders.

HTTP's answer is [[http-semantics|idempotence]]. A method is idempotent if sending it twice
has the same intended effect as sending it once. GET, HEAD, OPTIONS,
TRACE, PUT and DELETE are; POST isn't. The spec is blunt: a
proxy must not automatically retry a non-idempotent request.

nginx shows what that looks like in practice:

- By default it tries the next server only on a connection error or a
  timeout (`proxy_next_upstream error timeout`). Retrying on 500, 502,
  503, 504 or 429 responses is opt-in.
- POST, LOCK and PATCH are not passed to another server once they've
  been sent to one. You can override that with `non_idempotent`, which
  goes against the spec.
- It can only retry if nothing has been sent to the client yet. If the
  backend dies halfway through a response, it's too late.
- If request buffering is off and part of the body has already gone to
  the backend, the request can't be retried either, since the proxy no
  longer has the whole body.

Retries at several layers also multiply: if the client retries and the
proxy retries too, one failure turns into several requests. Retry
budgets and backoff come in later phases; for now, know that your proxy
may already be retrying for you.

## Connections to backends, per worker

A proxy's upstream connection pool is only as good as the number of
requests that can share it. Both nginx and Envoy keep pools per worker:
in Envoy, each worker thread handles a client connection for its whole
life and has its own pool of upstream connections; in nginx, each
worker process keeps its own cache of idle connections. Since nginx
1.29.7 that cache is on by default, with up to 32 idle connections per
worker, and it caps idle connections, not the total a worker may open.

Per-worker pools cost reuse. Cloudflare found that with NGINX, adding
workers made reuse worse, because the connections were spread over
more separate pools. Its replacement, Pingora (2022), shares pools
across threads. For one large customer the share of requests that
reused an existing connection went from 87.1% to 99.92%, and new
connections to their origins dropped 160 times.

## Where it gets tricky

**Two parsers must agree.** The proxy parses each request, and so does
the backend. If they disagree about where a request ends, an attacker
can hide a second request inside the first, and because the proxy
reuses backend connections for many users, that hidden request can land
in front of someone else's. This is [[request-smuggling]], and it's the
price of the connection reuse above.

**Old defaults linger in old advice.** Before nginx 1.29.7, nginx
spoke HTTP/1.0 to backends by default and didn't keep upstream
connections open unless you set `proxy_http_version 1.1`, cleared the
`Connection` header and added a `keepalive` line. The nginx docs still
show that setup for older versions. Check the version you run. HTTP/2
to backends arrived in 1.29.4.

**"Upstream" means two things.** In proxy configs, upstream is the
backend. In RFC 9110, messages flow from upstream to downstream, so for
a response the backend is upstream but for a request the client is.
This article uses the proxy meaning.

**Buffering changes what the client sees.** The spec warns that
intermediaries may buffer or delay messages, so neither side can count
on partial messages arriving as they're sent. If your server streams,
test it through the proxy, not directly.

**The proxy becomes a place things break.** Its timeouts, size limits
and retry rules now apply to every request, and a config reload that
drops connections is an outage for everyone at once. How proxies reload
without dropping anything is [[zero-downtime-reload]].

## What this means when you build

- Know which proxy is in front of your service and read its defaults:
  timeouts, buffering, retry rules, HTTP version to the backend.
- Make the proxy pass the original `Host` and the client address if
  your application needs them, and trust those headers only from the
  proxy.
- Make any request the proxy might retry safe to repeat, or turn off
  retries for it.
- Turn off response buffering for anything that streams.
- When you see 502 or 504, look at the hop between the proxy and the
  backend first.

## Further reading

- [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), R. Fielding, M. Nottingham, J. Reschke (editors), IETF, 2022. Sections 3.7 and 7.6: what proxies, gateways and tunnels are, and what an intermediary must do when it forwards a message; 9.2.2 on retries.
- [Module ngx_http_proxy_module](https://nginx.org/en/docs/http/ngx_http_proxy_module.html), nginx docs, 1.31. The defaults of a real reverse proxy: buffering, header rewriting, retries, timeouts.
- [Module ngx_http_upstream_module](https://nginx.org/en/docs/http/ngx_http_upstream_module.html), nginx docs, 1.31. Backend groups and the per-worker cache of keep-alive connections.
- [Life of a Request](https://www.envoyproxy.io/docs/envoy/latest/intro/life_of_a_request), Envoy docs, 1.40. One request through a modern L7 proxy step by step, with the downstream/upstream vocabulary.
- [How we built Pingora, the proxy that connects Cloudflare to the Internet](https://blog.cloudflare.com/how-we-built-pingora-the-proxy-that-connects-cloudflare-to-the-internet/), Yuchen Wu and Andrew Hauck, Cloudflare, 2022. Why per-worker connection pools hurt reuse, with production numbers.
