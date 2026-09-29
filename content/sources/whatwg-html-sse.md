---
id: whatwg-html-sse
title: "HTML Living Standard, 9.2 Server-sent events"
author: WHATWG
url: https://html.spec.whatwg.org/multipage/server-sent-events.html
kind: spec
primary: true
---

## Summary

The spec for server-sent events: the browser's `EventSource` API and
the `text/event-stream` format. The server keeps an HTTP response open
and writes lines of `field: value`; a blank line ends an event. The
browser reconnects on its own and sends the last event ID it saw.

## Key claims

- The server sends events with the `text/event-stream` MIME type. "On the server-side, the script ("updates.cgi" in this case) sends messages in the following form, with the text/event-stream MIME type:" (9.2.1)
- The default event type is "message". "The default event type is "message"." (9.2.1)
- UTF-8 only. "Event streams are always decoded as UTF-8. There is no way to specify another character encoding." (9.2.1)
- Clients reconnect, and 204 tells them to stop. "Clients will reconnect if the connection is closed; a client can be told to stop reconnecting using the HTTP 204 No Content response code." (9.2.1)
- The constructor takes a URL and one option, `withCredentials`. (9.2.2, the `EventSourceInit` dictionary)
- The reconnection time starts at a browser-chosen value of a few seconds. "This must initially be an implementation-defined value, probably in the region of a few seconds." (9.2.2)
- A non-200 status or a wrong content type ends it for good. "if res's status is not 200, or if res's `Content-Type` is not `text/event-stream`, then fail the connection." (9.2.2)
- Browsers may back off after failures. "user agents might introduce an exponential backoff delay to avoid overloading a potentially already overloaded server." (9.2.3)
- On reconnect the browser sends the last event ID in a header. "HTTP request header reports an EventSource object's last event ID string to the server when the user agent is to reestablish the connection." (9.2.4)
- A blank line dispatches the event. "If the line is empty (a blank line)" then "Dispatch the event" (9.2.6)
- A line starting with a colon is a comment. "If the line starts with a U+003A COLON character (:)" then "Ignore the line." (9.2.6)
- The fields are event, data, id and retry; retry sets the reconnection time in milliseconds. "If the field name is "retry"" (9.2.6)
- An event cut off before its blank line is dropped. "If the file ends in the middle of an event, before the final empty line, the incomplete event is not dispatched." (9.2.6)
- Send a comment every 15 seconds or so to keep proxies from closing idle connections. "To protect against such proxy servers, authors can include a comment line (one starting with a ':' character) every 15 seconds or so." (9.2.7)
- Chunking by a layer that doesn't know about the timing can hurt. "HTTP chunking can have unexpected negative effects on the reliability of this protocol, in particular if the chunking is done by a different layer unaware of the timing requirements." (9.2.7)
- Per-server connection limits bite when many pages open an EventSource. "Clients that support HTTP's per-server connection limitation might run into trouble when opening multiple pages from a site if each page has an EventSource to the same domain." (9.2.7)

- The reconnection time is in milliseconds. "A reconnection time, in milliseconds." (9.2.2)
- A closed EventSource doesn't reconnect. "The connection is not open, and the user agent is not trying to reconnect." (9.2.2, readyState CLOSED)
- close() aborts the request. "Aborts any instances of the fetch algorithm started for this EventSource object, and sets the readyState attribute to CLOSED." (9.2.2)
- Multiple data lines are joined with newlines: the spec's YHOO example gives "YHOO\n+2\n10". "The event's data attribute would contain the string "YHOO\n+2\n10" (where "\n" represents a newline)." (9.2.6)
- Other event types are handled with addEventListener. "source.addEventListener('add', addHandler, false);" (9.2.1)

## Visuals worth redrawing

None.

## My notes

- The spec defines reconnection time in milliseconds (9.2.2: "A reconnection time, in milliseconds.").
