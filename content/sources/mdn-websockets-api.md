---
id: mdn-websockets-api
title: The WebSocket API (WebSockets)
author: MDN contributors
url: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API
kind: docs
primary: false
---

## Summary

MDN's overview of the browser WebSocket APIs, read when this was
written. Notes the browser `WebSocket` interface has no backpressure,
that `WebSocketStream` adds it but is non-standard, and that
WebTransport is expected to replace WebSockets for many uses.

## Key claims

- The `WebSocket` interface has no backpressure. "However it doesn't support backpressure." (intro)
- So fast senders can exhaust a slow client. "when messages arrive faster than the application can process them it will either fill up the device's memory by buffering those messages, become unresponsive due to 100% CPU usage, or both." (intro)
- `WebSocketStream` adds backpressure but isn't standard. "However, WebSocketStream is non-standard and currently only supported in one rendering engine." (intro)
- WebTransport is expected to take over many uses. "Additionally, the WebTransport API is expected to replace the WebSocket API for many applications." (intro)

## Visuals worth redrawing

None.

## My notes

- Browser support statements go stale; re-check before relying on them.
