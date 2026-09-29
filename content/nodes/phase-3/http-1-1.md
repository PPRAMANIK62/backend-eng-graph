---
id: http-1-1
title: HTTP/1.1
depth: deep
phase: 3
note: >-
  Text framing, keep-alive, chunked encoding, and why pipelining failed.
needs: [http-semantics]
leads_to: [http2, websockets, server-sent-events, reverse-proxy, request-smuggling, fuzzing]
compare_with: [http2, resp-protocol]
---


# HTTP/1.1

HTTP/1.1 is the text wire format of HTTP: each request and response is
written as lines of text, one message after another on a [[tcp|TCP]]
connection. Reading the lines is easy. The hard part is knowing exactly
where each message ends, because many requests share one connection,
and two programs that disagree about a boundary will read the rest of
the connection differently. That disagreement is what
[[request-smuggling]] exploits.

## A message is lines, an empty line, then bytes

What a request or response *means* is [[http-semantics]]. Here's how
HTTP/1.1 writes it down. Every line ends in CR LF, shown here as `\r\n`:

```
GET /users/42 HTTP/1.1\r\n
Host: api.example.com\r\n
Accept: application/json\r\n
\r\n
```

```
HTTP/1.1 200 OK\r\n
Content-Type: application/json\r\n
Content-Length: 27\r\n
\r\n
{"id":42,"name":"Ada Byte"}
```

Every message has the same layout:

- **A start line.** For a request: method, a single space, the target,
  a single space, the version. For a response: version, status code,
  reason phrase. Clients should ignore the reason phrase.
- **Header lines,** each `Name: value`. No whitespace is allowed
  between the name and the colon; a server must reject a request that
  has any, with 400.
- **An empty line,** which ends the headers.
- **The body,** if there is one.

A request must carry exactly one `Host` header. A server answers 400
to a request with none, or with two.

The usual way to parse this is: read the start line, read header lines
into a table until the empty line, then work out from the headers how
long the body is. Parse bytes, not text. HTTP/1.1 is defined on bytes
in an ASCII-compatible encoding, and decoding a message as Unicode first
opens holes, because string libraries differ on how they handle broken
byte sequences that contain a line feed.

The format has grown stricter over time. A bare CR is now forbidden
outside the body. Folding a long header value onto several lines is
deprecated. Whitespace before the first header line must be rejected or
ignored. Each of these used to be tolerated, and each tolerance has let
two parsers read the same bytes differently.

## Where does the body end?

TCP gives you a stream of bytes with no message boundaries (see
[[tcp]]). So HTTP/1.1 has to say in the message itself where the body
stops. There are three ways, plus the case of no body at all:

![Three responses shown as strips of bytes. The first has headers with Content-Length 5, then exactly 5 body bytes, and the next message starts right after. The second has headers with Transfer-Encoding chunked, then a chunk header 5, the 5 bytes hello, a zero-size chunk and an empty line, and the next message starts after that. The third has neither header; its body runs until the server closes the connection, so a response cut short by a network failure looks exactly the same as a complete one.](img/http-1-1-framing.svg)

*The three ways an HTTP/1.1 body ends. Drawn from the message body length rules in RFC 9112 section 6.3.*

- **`Content-Length: N`.** The body is exactly the next N bytes.
- **`Transfer-Encoding: chunked`.** The body is a series of chunks, each
  with its own size, ending with a chunk of size zero.
- **The connection closes.** Only for responses. The body is everything
  until the server closes the connection.
- **No body.** A request with neither header has no body. A response to
  HEAD, and any 1xx, 204 or 304 response, ends at the empty line, no
  matter what its headers say.

The spec gives an exact order for deciding, and most of it is about
what to do when the signals conflict:

- **Both `Transfer-Encoding` and `Content-Length`.** Transfer-Encoding
  wins. This goes back to early servers that sent both, the length only
  as a hint for progress bars. Today a message with both might be an
  attack, and should be treated as an error. A server may reject it or
  go by Transfer-Encoding alone, but either way it must close the
  connection afterwards, and a proxy that forwards it must drop the
  `Content-Length` first.
- **An invalid `Content-Length`** (not a number, or several different
  values) means the framing can't be trusted. A server answers 400 and
  closes the connection. A proxy that gets it in a response closes the
  connection to that server and sends the client a 502.
- **Chunked isn't the last encoding in a request.** The length can't be
  known, so the server answers 400 and closes.

Framing by closing the connection is left over from HTTP/1.0. Its flaw
is that a response cut off by a network failure looks exactly like a
complete one. Servers should frame by length or by chunks whenever
they can. Requests are never framed by closing, since the client still
needs the connection to read the answer.

## Chunked: sending a body before you know its size

Content-Length needs the whole body up front. A server generating a
page, or streaming the output of a query, often doesn't know the size
until it's done. Chunked encoding sends the body in pieces, each
prefixed with its size in hexadecimal:

```
HTTP/1.1 200 OK\r\n
Transfer-Encoding: chunked\r\n
\r\n
5\r\n
hello\r\n
7\r\n
, world\r\n
0\r\n
\r\n
```

A chunk of size 0 ends the body. Between it and the final empty line,
the sender can add **trailer** fields, for things only known at the
end, like a checksum of what was sent. A chunk size can also carry
extensions after a semicolon; a recipient ignores the ones it doesn't
know.

Two details matter when you write a parser. Chunk sizes are
hexadecimal numbers with no length limit, so a parser has to guard
against a huge value overflowing its integer type. And a chunked body
that stops before its zero-size chunk is incomplete, even if the
connection closed cleanly.

Transfer-Encoding belongs to one hop. It describes how this message is
packed on this connection, not the content itself, which is what
`Content-Encoding` is for. A proxy may remove chunking and add it
again, and `Transfer-Encoding` is one of the headers each hop handles
for itself. When other encodings are used, as in
`Transfer-Encoding: gzip, chunked`, chunked has to come last so the
message is still framed. (A response may instead end by closing the
connection; a request has no such way out.)

## Keep-alive: many requests on one connection

In HTTP/1.0, the client opened a connection, sent one request, and the
server closed the connection after the response. Some implementations
added an opt-in `Connection: keep-alive` to keep it open. It broke in
practice: a proxy that didn't understand `Connection` passed the header
on to the next server, and the connection hung.

HTTP/1.1 made **persistent connections** the default. A connection
stays open after each response unless one side sends
`Connection: close`, which means "this is the last message on this
connection". Keeping connections open saves a new [[tcp-handshake]],
and with HTTPS a new [[tls]] handshake, for every request. Reusing
them well is the job of [[connection-pooling]].

Persistence only works if every message frames itself, since the end of
a message can no longer be marked by closing. And it only works if both
sides read every message to the end. A server that answers without
reading the whole request body has to close the connection, or the
unread bytes will be parsed as the next request. The same goes for a
client that doesn't read a whole response and puts the connection back
in its pool.

Idle connections bring their own race. Servers close connections that
sit idle past some timeout, and the spec sets no number for it. A
client can start sending a request at the same moment the server
decides to close. From the server's side it closed an idle connection;
from the client's, a request failed in flight. This is where retry
rules come in: a client can resend an idempotent request on a new
connection, as [[http-semantics]] explains, and has to think twice
about anything else.

Closing has a trap of its own. If a server closes a TCP connection
while more data from the client is arriving, its TCP stack answers
with a reset, and the reset can wipe out the last response before the
client has read it. So servers close in stages: first shut down their
sending side (a half-close, see [[tcp]]), then keep reading until the
client closes too or the response has surely arrived, and only then
close fully.

## Pipelining, and why it failed

HTTP/1.1 has no request ID. A response belongs to a request only
because of its position: the first response on a connection answers the
first request, and so on.

**Pipelining** uses that. A client sends several requests without
waiting for each response. The server may work on them in parallel if
they're all safe, but it must send the responses back in the order the
requests arrived.

![Two timelines between a client and a server. On the left, keep-alive without pipelining: the client sends A, waits for the response to A, then sends B, then C, one round trip each. On the right, pipelining: the client sends A, B and C at once. The server finishes B and C quickly, but A is slow, so B and C have to wait behind A before they can be sent, and all three responses come back in order.](img/http-1-1-pipelining.svg)

*Pipelining saves round trips, but responses must come back in request order, so one slow response holds up the rest.*

On paper it saves a round trip per request. In practice it never
worked well:

- **One slow response blocks the rest.** Responses must be returned in
  order, so a slow first request holds every response behind it. This
  is [[head-of-line-blocking]] at the HTTP layer.
- **Failures are hard to recover from.** If the connection drops with
  three requests outstanding, the client can't tell which ones the
  server ran. It can resend the idempotent ones, and shouldn't pipeline
  anything after a non-idempotent request until that one's response
  arrives.
- **Servers and middleboxes got it wrong.** Some servers ignored
  pipelined requests or corrupted the responses. So did proxies,
  including transparent ones the user never set up and can't see.

Chromium tried pipelining with safeguards: only to origins that had
already proven they spoke HTTP/1.1 with properly framed, keep-alive
responses, and a blacklist for any origin that failed. It still removed
the option, citing crashing bugs, head-of-line blocking, and many
servers and middleboxes that behaved badly. The big desktop browsers
never turned pipelining on by default, and Firefox and Chrome later
dropped it entirely. curl disabled it in version 7.62.0 and removed the
code in 7.65.0 (2019).

What clients did instead was open several connections to the same
server and send one request at a time on each. Early specs set a
maximum number of connections per server; the current one doesn't, and
only asks clients to be conservative, because many parallel connections
cost the server resources and can congest the network together. The
real fix for concurrency was multiplexing in [[http2]]: many requests
in flight on one connection, answered in any order. The failure of
pipelining was one of the main reasons HTTP/2 was built.

## Where it gets tricky

**Two lenient parsers are worse than one strict one.** The spec lets a
recipient accept some sloppy input: a bare LF as a line end, several
kinds of whitespace in the request line. One server doing that alone
is harmless. A proxy and a backend being lenient in *different* ways
is how a request that one of them sees as one message becomes two for
the other. That's [[request-smuggling]], and it's why the rules on
Transfer-Encoding with Content-Length, invalid lengths and whitespace
before the colon end in "reject and close". It's also why testing a
parser against another implementation, by [[fuzzing]], finds real
bugs.

**A response can't be parsed without its request.** A response to
HEAD carries headers like `Content-Length` but no body. A parser that
doesn't remember the request was a HEAD will wait for bytes that never
come, or read the next response as a body.

**The spec still allows pipelining.** It's defined and permitted in
the current RFC, while the most widely used clients have removed it.
Supporting it in a server is still expected; relying on it in a client
isn't sensible.

**Some servers refuse chunked requests.** A server may answer a request
body with no Content-Length by 411 (Length Required), and some services
do, even though they understand chunked. So a client that knows the
length should send Content-Length.

**Hop-by-hop really means per hop.** `Connection`, `Transfer-Encoding`
and `Keep-Alive` describe one connection. A [[reverse-proxy]] has to
remove or rewrite them, reframe the body for the next connection, and
put its own HTTP version in the start line, instead of copying the
client's bytes through.

**The same connection can become something else.** A client can ask to
switch the connection to another protocol with the `Upgrade` header;
if the server agrees, it answers 101 (Switching Protocols) and the
bytes after that are no longer HTTP/1.1. The spec's own example asks
for `websocket`; see [[websockets]].

**Old specs everywhere.** HTTP/1.1 was first standardised in RFC 2068
(1997), revised as RFC 2616 (1999), then RFC 7230 (2014). The current
spec is RFC 9112 (2022), which moved everything version-independent
into RFC 9110.

## What this means when you build

- When parsing, reject instead of guessing. Whitespace before a colon,
  both Transfer-Encoding and Content-Length, conflicting lengths, and
  chunked not last in a request should end in 400 and a closed
  connection.
- Bound everything: request line, header size, chunk sizes, chunk
  extensions. Support request lines of at least 8,000 bytes, as the
  spec recommends.
- Always frame what you send with Content-Length or chunked. Avoid
  ending a response by closing.
- Reuse connections, read every body to the end before reusing one,
  and close gracefully: half-close, drain, then close.
- Expect an idle connection to die under you. Retry only idempotent
  requests on a fresh connection.
- Don't pipeline. Use a few connections, or HTTP/2.

## Further reading

- [RFC 9112](https://www.rfc-editor.org/rfc/rfc9112), R. Fielding, M. Nottingham, J. Reschke (editors), IETF, 2022. The HTTP/1.1 spec: message syntax, the body length rules, chunked, persistence, pipelining and closing.
- [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), R. Fielding, M. Nottingham, J. Reschke (editors), IETF, 2022. Framing in general, the `Connection` header, `Upgrade`, and when a request may be retried.
- [RFC 9113](https://www.rfc-editor.org/rfc/rfc9113), M. Thomson, C. Benfield (editors), IETF, 2022. Its introduction explains what pipelining left unsolved and why HTTP/1.1 clients open many connections.
- [HTTP Pipelining](https://www.chromium.org/developers/design-documents/network-stack/http-pipelining/), The Chromium Projects. Chrome's attempt at pipelining: the risks, the safeguards, and why the option was removed.
- [curl says bye bye to pipelining](https://daniel.haxx.se/blog/2019/04/06/curl-says-bye-bye-to-pipelining/), Daniel Stenberg, 2019. Why curl dropped pipelining, and how its failure led to HTTP/2 multiplexing.
