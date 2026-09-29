---
id: nginx-proxy-module
title: Module ngx_http_proxy_module
author: nginx documentation
url: https://nginx.org/en/docs/http/ngx_http_proxy_module.html
kind: docs
primary: true
---

## Summary

The reference for nginx's HTTP proxying directives, read when nginx
1.31 was the current mainline. Shows what a production reverse proxy does by
default: it buffers request and response bodies, rewrites Host and
Connection, retries failed requests on another server under narrow
rules, and applies per-read timeouts.

## Key claims

- Response buffering is on by default; a response that doesn't fit in memory can go to a temp file. "If the whole response does not fit into memory, a part of it can be saved to a temporary file on the disk." (proxy_buffering)
- With buffering off, the response is streamed to the client as it arrives. "When buffering is disabled, the response is passed to a client synchronously, immediately as it is received." (proxy_buffering)
- The default buffer size is one memory page. "This is either 4K or 8K, depending on a platform." (proxy_buffers)
- Request body buffering is on by default: the whole body is read from the client before the request goes upstream. "When buffering is enabled, the entire request body is read from the client before sending the request to a proxied server." (proxy_request_buffering)
- Without request buffering, a request whose body has started going upstream can't be retried elsewhere. "In this case, the request cannot be passed to the next server if nginx already started sending the request body." (proxy_request_buffering)
- Host and Connection from the client are not passed on by default. "By default, the header fields “Host” and “Connection” from the original request are not passed to the proxied server." (proxy_set_header)
- For HTTP/1.x upstreams they are replaced with the upstream's name and `Connection: close`. "proxy_set_header Connection close;" (proxy_set_header)
- The upstream HTTP version default changed to 1.1 in 1.29.7. "Since 1.29.7, version 1.1 is used by default." (proxy_http_version)
- Before that it was 1.0. "Before 1.29.7, version 1.0 was used by default." (proxy_http_version)
- HTTP/2 to upstreams exists as an option, added in 1.29.4. "Version 1.1 or 2 (1.29.4) is recommended for use with keepalive connections" (proxy_http_version)
- Retrying on error status codes is opt-in, one parameter per code. "http_429 a server returned a response with the code 429 (1.11.13)" (proxy_next_upstream)
- `non_idempotent` turns on retries of POST, LOCK and PATCH. "enabling this option explicitly allows retrying such requests" (proxy_next_upstream)
- The connect timeout defaults to 60 seconds. "proxy_connect_timeout 60s;" (proxy_connect_timeout, default)
- Default retry rule: pass to the next server on connection errors and timeouts. "proxy_next_upstream error timeout;" (proxy_next_upstream, default)
- Non-idempotent requests are not retried once sent, unless you opt in. "normally, requests with a non-idempotent method (POST, LOCK, PATCH) are not passed to the next server if a request has been sent to an upstream server (1.9.13)" (proxy_next_upstream)
- A retry is only possible before anything has gone to the client. "One should bear in mind that passing a request to the next server is only possible if nothing has been sent to a client yet." (proxy_next_upstream)
- Retries can be limited by count and by time. "Passing a request to the next server can be limited by the number of tries and by time." (proxy_next_upstream)
- The read timeout is between two reads, not for the whole response; default 60 s. "The timeout is set only between two successive read operations, not for the transmission of the whole response." (proxy_read_timeout)
- `$proxy_add_x_forwarded_for` appends the client address to any incoming X-Forwarded-For. "the “X-Forwarded-For” client request header field with the $remote_addr variable appended to it, separated by a comma." (Embedded Variables)

## Visuals worth redrawing

None.

## My notes

- The 1.29.7 default changes (HTTP/1.1 and keep-alive upstream) are
  recent; older tutorials that tell you to set `proxy_http_version 1.1`
  and clear Connection were written for the old defaults.
- `proxy_connect_timeout` default is 60s as well.
- Re-read when 1.31.6 was current. The proxy_set_header section still
  says HTTP/1.x upstreams get `Connection: close`, but the 1.29.7 entry in
  nginx's CHANGES file says the Connection header "is not sent by default
  anymore". The two disagree, so articles don't state either.
