---
id: go-net-http
title: net/http (Go package documentation)
author: The Go Authors
url: https://pkg.go.dev/net/http
kind: docs
primary: true
---

## Summary

The Go standard library's HTTP client and server package, read at
go1.27.1. For connection pooling, the parts that matter are
`Transport`, which keeps idle connections per host for reuse, its
limits and timeouts, and the rule that a response body must be fully
read and closed before its connection can be reused.

## Key claims

- Transport keeps connections for reuse by default. "By default, Transport caches connections for future re-use." (type Transport)
- Clients and Transports hold cached connections, so reuse them. "Transports should be reused instead of created as needed." (type Transport)
- The default number of idle connections kept per host is 2. "const DefaultMaxIdleConnsPerHost = 2" (Constants)
- DefaultTransport keeps up to 100 idle connections in total, closes idle ones after 90 s, and dials with TCP keepalive every 30 s. `MaxIdleConns: 100, IdleConnTimeout: 90 * time.Second`, dialer `KeepAlive: 30 * time.Second` (var DefaultTransport)
- MaxConnsPerHost caps dialing, active and idle connections together; past it, dials wait. "On limit violation, dials will block." (type Transport, MaxConnsPerHost)
- Zero MaxConnsPerHost means no limit. (type Transport, MaxConnsPerHost)
- IdleConnTimeout is how long an idle connection stays open. "IdleConnTimeout is the maximum amount of time an idle // (keep-alive) connection will remain idle before closing // itself." (type Transport; the `//` are comment markers in the struct listing)
- The server side has its own idle timeout for keep-alive connections. "IdleTimeout is the maximum amount of time to wait for the // next request when keep-alives are enabled." (type Server; `//` are comment markers)
- HTTP keep-alive and TCP keepalive are different things. "This is unrelated to the similarly named TCP keep-alives." (type Transport, DisableKeepAlives)
- A connection is reused only after the body is read to the end and closed. "If the Body is not both read to EOF and closed, the Client's underlying RoundTripper (typically Transport) may not be able to re-use a persistent TCP connection to the server for a subsequent \"keep-alive\" request." (func (*Client) Do)
- Transport retries after a network error only on a connection that already worked, and only for idempotent requests. "Transport only retries a request upon encountering a network error if the connection has already been used successfully and if the request is idempotent and either has no body or has its Request.GetBody defined." (type Transport)
- GET, HEAD, OPTIONS and TRACE count as idempotent, as do requests with an Idempotency-Key header. (type Transport)
- Shutdown (since go1.8) closes listeners, then idle connections, then waits for active ones to go idle. "Shutdown works by first closing all open listeners, then closing all idle connections, and then waiting indefinitely for connections to return to idle and then shut down." (func (*Server) Shutdown)
- The wait is bounded only by the context you pass. "If the provided context expires before the shutdown is complete, Shutdown returns the context's error" (func (*Server) Shutdown)
- Serve returns at once, so main must wait for Shutdown. "When Shutdown is called, Serve, ServeTLS, ListenAndServe, and ListenAndServeTLS immediately return ErrServerClosed. Make sure the program doesn't exit and waits instead for Shutdown to return." (func (*Server) Shutdown)
- Hijacked connections such as WebSockets are not waited for. "Shutdown does not attempt to close nor wait for hijacked connections such as WebSockets." (func (*Server) Shutdown)
- RegisterOnShutdown (go1.9) is the hook to tell such connections. "This function should start protocol-specific graceful shutdown, but should not wait for shutdown to complete." (func (*Server) RegisterOnShutdown)
- Close is the abrupt version. "For a graceful shutdown, use Server.Shutdown." (func (*Server) Close)
- The package example catches os.Interrupt with signal.Notify, calls Shutdown, and waits on a channel before exiting. (func (*Server) Shutdown, Example)
- Keep-alives can be turned off while shutting down. "Only very resource-constrained environments or servers in the process of shutting down should disable them." (func (*Server) SetKeepAlivesEnabled)
- The server starts one goroutine per accepted connection. "Serve accepts incoming connections on the Listener l, creating a new service goroutine for each." (func (*Server) Serve)

## Visuals worth redrawing

None.

## My notes

- The retry rule exists because a pooled connection can die while idle
  (the server closed it) and the client only finds out when it writes.
  That's our reading; the docs state the rule, not the reason.
