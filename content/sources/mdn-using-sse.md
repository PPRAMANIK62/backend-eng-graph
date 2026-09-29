---
id: mdn-using-sse
title: Using server-sent events
author: MDN contributors
url: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
kind: docs
primary: false
---

## Summary

MDN's guide to `EventSource`, read when this was written. Useful mainly
for its warning about the browser's connection limit when server-sent
events run over HTTP/1.1.

## Key claims

- Over HTTP/1.1, browsers allow only 6 connections per browser and domain, across all tabs. "When not used over HTTP/2, SSE suffers from a limitation to the maximum number of open connections, which can be especially painful when opening multiple tabs, as the limit is per browser and is set to a very low number (6)." (warning box)
- Browsers won't change it. "The issue has been marked as "Won't fix" in Chrome and Firefox." (warning box)
- Over HTTP/2 the stream limit is negotiated instead. "When using HTTP/2, the maximum number of simultaneous HTTP streams is negotiated between the server and the client (defaults to 100)." (warning box)

## Visuals worth redrawing

None.

## My notes

- "Defaults to 100" is loose: RFC 9113 sets no default limit and recommends servers allow at least 100.
