---
id: server-sent-events
title: Server-sent events
depth: short
phase: 3
note: >-
  A one-way stream of events from server to client over a plain HTTP
  response that never ends, with automatic reconnects.
needs: [http-1-1, http2]
leads_to: []
compare_with: [websockets, long-polling]
---


# Server-sent events

Server-sent events (SSE) let a server push a stream of messages to a
browser over an ordinary HTTP response that simply doesn't end. The
client makes one request, the server answers with the content type
`text/event-stream` and keeps writing lines of text as things happen.
There's no protocol switch and no new framing layer, so it works
through anything that handles [[http-1-1|HTTP]]. It's defined in the
HTML standard (section 9.2), together with the browser's `EventSource`
API.

## The format is lines of text

On the page, you open a stream and listen:

```js
const source = new EventSource("/updates");
source.onmessage = (event) => console.log(event.data);
```

The server sends UTF-8 text, one field per line, and a blank line ends
each event:

```
: this line is a comment

id: 41
event: price
data: {"symbol": "ACME", "price": 12.5}

id: 42
data: first line
data: second line

retry: 10000
```

- **`data:`** is the payload. Several `data:` lines in one event are
  joined with newlines, so the second event above arrives as
  `"first line\nsecond line"`.
- **`event:`** sets the event type. Without it the type is `message`,
  which is what `onmessage` receives; other types need
  `addEventListener("price", ...)`.
- **`id:`** sets the last event ID (more below).
- **`retry:`** sets how long, in milliseconds, the browser waits before
  reconnecting.
- A line starting with a colon is a **comment** and is ignored.

An event only fires when its blank line arrives. If the connection
drops halfway through an event, that partial event is thrown away.

## Reconnecting and catching up

What sets SSE apart from a hand-rolled streaming response is that the
browser reconnects by itself. If the connection closes or fails, it
waits for the reconnection time (a few seconds by default, or whatever
`retry:` said) and requests the URL again. Browsers may back off
further after repeated failures.

On that new request the browser sends a `Last-Event-ID` header with the
last `id:` it saw. A server that keeps a short history can resend
everything after that ID, so the client misses nothing across a
reconnect. The IDs mean whatever you want; the browser just echoes the
last one back.

The server stays in control of when to stop:

- A response with status `204 No Content` tells the client to stop
  reconnecting.
- Any status other than 200, or a content type other than
  `text/event-stream`, fails the connection for good.
- On the client, `source.close()` ends it.

## Where it gets tricky

**The HTTP/1.1 connection limit.** Browsers cap how many HTTP/1.1
connections they open to one domain, 6 across all tabs, and each open
event stream holds one of them for as long as it's open. Open the same
page in several tabs and the streams can use up every slot for that
domain. Chrome and Firefox have declined to change
it. Over [[http2|HTTP/2]] each stream is just one HTTP/2 stream on a
shared connection, and the limit is the number of concurrent
streams negotiated with the server, typically 100.

**Proxies and buffering.** Some older proxies close HTTP connections
that look idle, so send a comment line every 15 seconds or so. And
anything that buffers the response, including a layer that re-chunks
it without knowing the timing matters, delays your events. Make sure
each event is flushed through every hop when it's written.

**The API is limited.** The `EventSource` constructor takes a URL and a
single option, whether to send credentials. There's no way to set
request headers, so authentication has to come from cookies or the
URL. Events are always UTF-8 text; binary data has
to be encoded.

## What this means when you build

- Use SSE when only the server needs to push: notifications, progress
  updates, live feeds. For two-way traffic, [[websockets]] fit better.
- Give every event an `id:` and support `Last-Event-ID` if losing
  events during a reconnect would matter.
- Serve streams over HTTP/2 to avoid the 6-connection limit.
- Send a comment line on quiet streams, and turn off response buffering
  in your server and [[reverse-proxy|proxies]] for this endpoint.
- Remember every connected client holds an open request on your server.

## Further reading

- [HTML Living Standard, 9.2 Server-sent events](https://html.spec.whatwg.org/multipage/server-sent-events.html), WHATWG. The `EventSource` API, the event stream format, reconnection rules, and authoring notes on proxies.
- [Using server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events), MDN contributors. A practical guide, with the warning about the browser's HTTP/1.1 connection limit.
