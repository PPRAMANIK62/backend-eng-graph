---
id: grpc
title: gRPC
depth: deep
phase: 3
note: >-
  Remote calls over HTTP/2 with protobuf: unary and streaming calls,
  deadlines, status codes.
needs: [http2, protobuf]
leads_to: [deadline-propagation]
compare_with: [rest, kubernetes-networking]
---

# gRPC

gRPC lets one service call a function on another as if it were local.
You describe the methods and their messages in a `.proto` file, and
generated code turns each call into an [[http2|HTTP/2]] request
carrying [[protobuf]] bytes. Its choices (one long-lived connection, a
deadline on every call, the status in trailers) shape how you balance
load, retry and debug.

## From a .proto to a function call

A service is a list of methods, each taking one message type and
returning another:

```proto
service HelloService {
  rpc SayHello (HelloRequest) returns (HelloResponse);
}

message HelloRequest  { string greeting = 1; }
message HelloResponse { string reply = 1; }
```

A compiler plugin turns this into code for each language. The client
gets a *stub*, a local object with a `SayHello` method. You call it
with a `HelloRequest`; it encodes the message, sends it, waits, and
hands you a `HelloResponse`. On the server you implement `SayHello`,
and the gRPC runtime decodes requests, calls your code and encodes the
reply.

Protobuf is the default way to describe services and messages, but not
the only one; the protocol has room for other formats.

gRPC has four kinds of method, set by where you write `stream`:

- **Unary.** One request, one response, like a normal function call.
- **Server streaming.** One request, then a stream of responses:
  `returns (stream HelloResponse)`.
- **Client streaming.** A stream of requests, then one response.
- **Bidirectional streaming.** Both sides stream, independently. The
  server can wait for everything first, or answer each message as it
  arrives.

Within one call, messages arrive in the order they were sent.

## What a call looks like on the wire

Every gRPC call is one HTTP/2 stream. Here's a unary call, frame by
frame:

![A unary gRPC call as HTTP/2 frames on one stream. The client sends HEADERS with :method POST, :path /google.pubsub.v2.PublisherService/CreateTopic, grpc-timeout 1S, te trailers and content-type application/grpc+proto, then one DATA frame with END_STREAM. The server answers with HEADERS (:status 200), a DATA frame, and a final HEADERS frame with END_STREAM carrying the trailers grpc-status 0. Below, the layout of each message inside DATA: a 1-byte compressed flag, a 4-byte big-endian length, then the protobuf bytes.](img/grpc-unary-call-frames.svg)

*One unary call. Adapted from the gRPC authors, "gRPC over HTTP2" (the example in PROTOCOL-HTTP2.md).*

Step by step:

1. **Request headers.** Always `POST`. The path names the service and
   the method: `/package.Service/Method`. `content-type` starts with
   `application/grpc`. If the call has a deadline, it goes in
   `grpc-timeout` as a number of at most 8 digits and a one-letter unit
   (`H`, `M`, `S`, `m`, `u`, `n`), so `1S` is one second.
2. **Request messages.** Each message is framed with 5 bytes: a flag
   byte saying whether it's compressed, then a 4-byte big-endian
   length, then the protobuf bytes. The messages travel in DATA frames,
   and the frame boundaries have nothing to do with message boundaries.
   One message can span frames, and one frame can hold several. The
   client marks the last frame END_STREAM.
3. **Response headers.** HTTP status 200.
4. **Response messages,** framed the same way. One for unary, as many
   as the server likes for streaming.
5. **Trailers.** A last HEADERS frame, marked END_STREAM, with
   `grpc-status` and an optional `grpc-message`. The status goes here
   even when it's OK (0).

That last step is the unusual one. The HTTP status is 200 even when the
call fails; the real result is the gRPC status in the trailers. If the
server fails before sending anything, it can skip straight to a
"trailers-only" response.

Because the result lives at the end of the stream, a server can send a
thousand streamed messages and only then say the call failed. The
client can't know how the call ended until the trailers arrive.

Your own key-value metadata rides along as extra headers (and
trailers). Keys ending in `-bin` carry binary values, base64-encoded on
the wire, and keys starting with `grpc-` are reserved.

## Deadlines on every call

A deadline is the point in time after which the client stops waiting.
gRPC doesn't set one by default, so without one a client can wait for
a response effectively forever. Always set one.

The deadline travels as `grpc-timeout`, a remaining duration rather
than a clock time. When a call arrives, the server knows how much time
is left without trusting that its clock matches the client's.

When the deadline passes:

- the client fails the call with `DEADLINE_EXCEEDED`;
- the server's gRPC runtime cancels the call;
- but your server code has to notice the cancellation and stop its own
  work. Anything it already changed stays changed; cancelling doesn't
  roll anything back.

Services call other services, so deadlines need to flow downstream.
Say a client gives a user service 2 seconds. The user service spends
0.5 seconds, then calls a billing service. That call should get the
1.5 seconds that are left, not a fresh budget. The Java and Go
libraries pass the incoming deadline on to outgoing calls by default;
in C++ you have to turn it on.

## Status codes

A call ends with one of 17 status codes, 0 to 16. A few you'll see
most:

| Code | Name | Means |
|---|---|---|
| 0 | `OK` | Success. |
| 1 | `CANCELLED` | The caller cancelled. |
| 3 | `INVALID_ARGUMENT` | The request is bad, whatever the system's state. |
| 4 | `DEADLINE_EXCEEDED` | Time ran out. The work may still have happened. |
| 5 | `NOT_FOUND` | The thing asked for doesn't exist. |
| 9 | `FAILED_PRECONDITION` | The system isn't in a state where this can run. Don't retry until it is. |
| 10 | `ABORTED` | A concurrency conflict. Retry the whole read-modify-write. |
| 12 | `UNIMPLEMENTED` | No such method on this server. |
| 13 | `INTERNAL` | Something that should never break did. |
| 14 | `UNAVAILABLE` | Usually temporary. Retrying with backoff often works. |

Some codes are only ever produced by the gRPC library: a missed
deadline, an unknown method, a server shutting down, a message over the
size limit, a failed keepalive. Seven codes, including
`INVALID_ARGUMENT`, `NOT_FOUND` and `ABORTED`, are never generated by
the library, so if you see one, your application sent it.

There's a rule of thumb for retries: `UNAVAILABLE` means retry
the call, `ABORTED` means retry at a higher level, `FAILED_PRECONDITION`
means don't retry until something changes. But there's no official
list of retryable codes. The library emits the same code for different
causes, and each application has to decide for itself.

## One connection, many calls

A gRPC client opens a *channel* to a server, and the channel keeps
HTTP/2 connections open. HTTP/2 multiplexes many streams over one
connection, so many calls can share a single [[tcp|TCP]] connection.
That saves a [[tcp-handshake]] and a [[tls]] handshake per call, and
it's why you should reuse channels rather than make new ones.

It also breaks connection-level [[load-balancing|load balancing]]. An
[[l4-vs-l7|L4 load balancer]] picks a backend when a connection opens.
With [[http-1-1|HTTP/1.1]], a client needs many connections for many requests at
once, and those connections come and go, so connections end up spread
over the backends. With gRPC, one connection may carry all of a
client's calls for as long as it stays open, and every one of them
lands on the backend that got the connection. A backend added later
gets nothing from clients that are already connected.

The fixes all move the decision from connections to calls:

- an L7 proxy that understands HTTP/2 and sends each stream to a
  backend of its choosing (see [[load-balancing]]);
- client-side balancing, where the client learns the backend list
  (from [[service-discovery]], for example a [[dns|DNS]] name with many A
  records), keeps a connection to each, and picks one per call.

The client-side option has a catch. gRPC's default balancing policy,
`pick_first`, sends every call on a channel to the first address that
answers. You have to ask for `round_robin` (or something smarter) in
the service config to get calls spread over the backends at all.

Streams make this worse. A long-lived stream can't be moved to another
backend once it has started, so stream only when it gives a real
benefit.

There's also a ceiling on one connection. Each connection usually has
a limit on how many streams can be open at once. When a client hits it,
extra calls queue inside the client until others finish. The
workaround is a pool of channels, which brings back
[[connection-pooling]] one level up.

## Where it gets tricky

**`DEADLINE_EXCEEDED` doesn't mean nothing happened.** The response
may just have been slow. For a call that changes state, the change may
have gone through. Client and server decide success separately, and
they can disagree: the server thinks it sent everything, the client
thinks the answer came too late.

**Retries need idempotency.** gRPC doesn't assume calls are
idempotent (the idea is the same as in [[http-semantics]]). A call that
can't be proven to have started isn't retried automatically. Two cases
are safe: an HTTP/2 `REFUSED_STREAM` reset, which means the server did
no work, and streams past the last one a server accepted before sending
GOAWAY while shutting down. Both map to `UNAVAILABLE` and can go to
another server.

**Trailers break some proxies.** A proxy that drops HTTP trailers
drops the status of every call. The `te: trailers` request header is
there so incompatible proxies can be detected. Put gRPC behind a
[[reverse-proxy]] that fully supports HTTP/2 end to end.

**Browsers can't speak it directly.** Browsers don't expose HTTP/2
framing to JavaScript. gRPC-Web works around this: it
runs over any HTTP version, puts the trailers inside the body as a
final message, and expects a proxy to translate to real gRPC.

**Balancing options have moved on.** gRPC once had its own lookaside
balancing policy, `grpclb`, where clients asked a separate balancer
which backend to use. It's now deprecated, and the project recommends
xDS instead.

## What this means when you build

- Set a deadline on every call, and pass the remaining time on to
  every call you make while serving it.
- Check for cancellation in long server work, and stop.
- Decide per method which status codes to retry, and only retry calls
  that are safe to repeat.
- Don't put gRPC behind a connection-level balancer and expect even
  load. Balance per call, with an L7 proxy or a client-side policy
  that isn't the default `pick_first`.
- Reuse channels. If one connection's stream limit becomes the
  bottleneck, pool a few.
- Use streaming for real streams of data, not as a speed trick.

## Further reading

- [gRPC over HTTP2](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md), gRPC authors. The wire protocol: headers, message framing, trailers, `grpc-timeout`, and how HTTP/2 errors map to status codes.
- [Core concepts, architecture and lifecycle](https://grpc.io/docs/what-is-grpc/core-concepts/), gRPC authors. Services, the four kinds of method, what happens during a call, cancellation and metadata.
- [Deadlines](https://grpc.io/docs/guides/deadlines/), gRPC authors. Why to always set one, what the server must do, and how deadlines propagate without clock skew.
- [Status codes and their use in gRPC](https://github.com/grpc/grpc/blob/master/doc/statuscodes.md), gRPC authors. Every code, which ones the library generates and when, and the advice on retries.
- [Performance Best Practices](https://grpc.io/docs/guides/performance/), gRPC authors. Reusing channels, when to stream, and the per-connection stream limit.
- [gRPC Load Balancing on Kubernetes without Tears](https://kubernetes.io/blog/2018/11/07/grpc-load-balancing-on-kubernetes-without-tears/), William Morgan (Buoyant), 2018. Why connection-level balancing pins every call to one backend, and the ways out.
- [gRPC Web](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-WEB.md), gRPC authors. How the browser variant differs, and why it needs a proxy.
- [Load Balancing in gRPC](https://github.com/grpc/grpc/blob/master/doc/load-balancing.md), gRPC authors. How client-side balancing works: the resolver, the per-call policy, and the default `pick_first`.
