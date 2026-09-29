---
id: cloudflare-go-http-timeouts-2016
title: The complete guide to Go net/http timeouts
author: Filippo Valsorda, Cloudflare
url: https://blog.cloudflare.com/the-complete-guide-to-golang-net-http-timeouts/
kind: blog
primary: false
---

## Summary

A 2016 walk through every timeout in Go's net/http (written against Go
1.6 and 1.7): deadlines on connections, the server's read and write
timeouts, the client's total timeout, and the per-phase client
timeouts for dial, TLS handshake and response headers. The
per-phase breakdown is a good general picture of where an HTTP call
can hang; the Go version details are old.

## Key claims

- Timeouts are easy to get wrong, and the mistake shows up only when the network glitches. "a mistake can have no consequences for a long time, until the network glitches and the process hangs." (intro)
- The defaults are often not what you want. "Indeed, the defaults are often not what you want." (intro)
- A deadline is an absolute time, not a timeout, and doesn't reset as data moves. "Deadlines are not timeouts. Once set they stay in force forever (or until the next call to SetDeadline), no matter if and how the connection is used in the meantime." (SetDeadline)
- So Go's HTTP timeouts don't reset on progress. "all timeouts are implemented in terms of Deadlines, so they do NOT reset every time data is sent or received." (SetDeadline)
- A server without timeouts leaks file descriptors to slow or vanished clients. "Otherwise very slow or disappearing clients might leak file descriptors" (Server Timeouts)
- The package-level convenience functions leave timeouts off. "Those functions leave the Timeouts to their default off value, with no way of enabling them" (http.ListenAndServe is doing it wrong)
- Streaming servers can't use an absolute write timeout. "Sadly, this means that streaming servers can't really defend themselves from a slow-reading client." (About streaming)
- http.Client.Timeout covers the whole exchange, dial to body. "It covers the entire exchange, from Dial (if a connection is not reused) to reading the body." (Client Timeouts)
- http.Client.Timeout includes time spent following redirects. "http.Client.Timeout includes all time spent following redirects, while the granular timeouts are specific for each request" (Client Timeouts)
- http.Get and friends use a client with no timeout. "the package level functions such as http.Get use a Client without timeouts, so are dangerous to use on the open Internet." (Client Timeouts)
- Per-phase client timeouts: dial, TLS handshake, response header. "net.Dialer.Timeout limits the time spent establishing a TCP connection (if a new one is needed)." / "http.Transport.TLSHandshakeTimeout limits the time spent performing the TLS handshake." / "http.Transport.ResponseHeaderTimeout limits the time spent reading the headers of the response." (Client Timeouts)
- An idle timeout that resets on each read allows streaming without getting stuck. "We could go on streaming like this forever without risk of getting stuck." (Cancel and Context)
- Cancelling a parent context cancels its children down the pipeline. "Contexts have the advantage that if the parent context (the one we passed to context.WithCancel) is canceled, ours will be, too, propagating the command down the entire pipeline." (Cancel and Context)

## Visuals worth redrawing

- The client phases diagram (dial, TLS handshake, request, response
  headers, body) with which timeout covers which span. Redraw as a
  generic timeline, not Go-specific.

## My notes

- Written at Go 1.6/1.7. Current field names are checked in go-net-http
  (pkg.go.dev), not here.
- Marked primary: false: Cloudflare didn't build net/http, though the
  author later worked on Go.
