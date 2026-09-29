---
id: websockets
title: WebSockets
depth: short
phase: 3
note: >-
  A two-way channel upgraded from an HTTP request: after one handshake,
  both sides send framed messages whenever they like.
needs: [http-1-1, http2]
leads_to: [realtime-sync]
compare_with: [server-sent-events, long-polling]
---


# WebSockets

A WebSocket turns one HTTP request into a long-lived, two-way channel.
The client sends an ordinary [[http-1-1|HTTP/1.1]] request asking to
switch protocols; if the server agrees, the same [[tcp|TCP]] connection stops
carrying HTTP and starts carrying small framed messages in both
directions, sent whenever either side likes. It's defined in RFC 6455
(2011), and it's what games, stock tickers and shared editors use
instead of polling the server with request after request.

## The upgrade handshake

The client's request looks like normal HTTP with a few extra headers:

```
GET /chat HTTP/1.1
Host: server.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
Origin: http://example.com
```

And a server that agrees answers:

```
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

The accept value proves the server read a real WebSocket handshake, so
an attacker can't get a WebSocket server to accept something else, like
a crafted form post, as a connection. The server appends a fixed GUID, `258EAFA5-E914-47DA-95CA-C5AB0DC85B11`, to the
client's key, hashes the result with SHA-1 and base64-encodes it. The
example above is the one from the spec, and you can check it with
`openssl sha1 -binary | base64`.

Any status other than 101 means no WebSocket; the connection is still
plain HTTP. Two other headers matter. `Origin` tells the server which
web page's script is connecting, so it can refuse other sites. And
`Sec-WebSocket-Protocol` lets the client offer application protocols
(say `chat`), of which the server picks one.

![Sequence between client and server over one TCP connection. The client sends GET with Upgrade: websocket; the server replies 101 Switching Protocols. After that both sides send frames independently: a text message from the client, two from the server, a ping answered by a pong, and finally a close frame from each side.](img/websockets-upgrade.svg)

*One HTTP exchange, then frames in both directions on the same connection.*

## Frames and messages

After the handshake, data moves as **messages**, each made of one or
more **frames**. A frame header is 2 bytes at minimum:

- **FIN** marks the last frame of a message.
- **Opcode** says what the frame is: text (UTF-8), binary,
  continuation of a message, or one of three control frames: close,
  ping and pong.
- **Mask** says whether a 4-byte masking key follows.
- **Payload length** is 7 bits; the values 126 and 127 mean a 16-bit
  or 64-bit length follows.

Unlike raw [[tcp]], you get message boundaries for free. But don't
depend on frame boundaries: an intermediary may split or merge a
message's frames.

Ping and pong frames let either side check the other is still there.
The receiver of a ping must answer with a pong carrying the same data.
It's a keepalive at the WebSocket level, like
[[tcp-keepalive|TCP keepalive]] one layer down.

## Why clients mask everything

Every frame from client to server is masked: XORed with a random
4-byte key carried in the frame. Servers must reject unmasked frames,
and must not mask their own. This happens even over [[tls|TLS]].

The reason is proxies, not privacy. While the protocol was being
designed, an experiment showed that a script could open an upgraded
connection to an attacker's server and then send bytes that looked like
an ordinary HTTP GET. Some caching proxies on the path took that for a
real request, cached the attacker's reply, and served it to other
users. Masking means the script can't choose the exact bytes that
appear on the wire, so it can't forge a request a confused proxy would
believe.

## Where it gets tricky

**HTTP/2 has no Upgrade.** [[http2|HTTP/2]] carries many requests on
one connection, so it can't switch the whole connection to another
protocol, and it has no `101` status. RFC 8441 (2018) fixes this with
an "extended CONNECT": once the server signals support with the
`SETTINGS_ENABLE_CONNECT_PROTOCOL` setting, the client sends a
CONNECT request with the pseudo-header `:protocol: websocket`. That one
HTTP/2 stream then carries the WebSocket frames, alongside ordinary
requests on other streams.

**No backpressure in the browser API.** The browser's `WebSocket`
object has no way to say "slow down". If messages arrive faster than
the page can handle them, they pile up in memory or peg the CPU. A
streams-based `WebSocketStream` adds backpressure but isn't standard
and ships in only one engine when this was written, and WebTransport is
expected to take over many WebSocket uses. Until then, flow control is
up to your own protocol, for example by having the client acknowledge
batches.

## What this means when you build

- A WebSocket is a stateful, long-lived connection. Each one holds a
  socket and memory on your server for as long as it stays open, and
  every proxy on the path must allow that.
- Check `Origin` on the handshake if browsers connect to you.
- Send pings on idle connections so dead peers and silent [[nat|NAT]] timeouts
  are noticed.
- Build your own acknowledgments or rate limits if a slow client could
  fall behind.
- If data only flows from server to client, [[server-sent-events]] are
  simpler.

## Further reading

- [RFC 6455](https://www.rfc-editor.org/rfc/rfc6455), Ian Fette, Alexey Melnikov, IETF, 2011. The WebSocket protocol: handshake, framing, masking and why (section 10.3).
- [RFC 8441](https://www.rfc-editor.org/rfc/rfc8441), Patrick McManus, IETF, 2018. Opening a WebSocket on one HTTP/2 stream with extended CONNECT.
- [The WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API), MDN contributors. The browser side, and its missing backpressure.
