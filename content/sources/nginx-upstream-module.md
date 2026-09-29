---
id: nginx-upstream-module
title: Module ngx_http_upstream_module
author: nginx documentation
url: https://nginx.org/en/docs/http/ngx_http_upstream_module.html
kind: docs
primary: true
---

## Summary

The reference for nginx upstream groups (read when nginx 1.31 was the
current mainline): the list of backend servers, how failures mark a server
down, and the cache of idle keep-alive connections to backends.

## Key claims

- The `keepalive` directive caches idle connections to upstream servers. "Enables or disables caching of keepalive connections to upstream servers." (keepalive)
- The cache is per worker process, least recently used connections are closed past the limit. "The connections parameter sets the maximum number of idle keepalive connections to upstream servers that are preserved in the cache of each worker process." (keepalive)
- Since 1.29.7 it's on by default, 32 per worker. "Since 1.29.7, keepalive connections are enabled by default, with a default limit of 32 connections per each worker process." (keepalive)
- It limits idle connections, not total connections. "It should be particularly noted that the keepalive directive does not limit the total number of connections to upstream servers that an nginx worker process can open." (keepalive)
- For HTTP keep-alive upstream, use HTTP/1.1 (or 2) and clear Connection. "For HTTP, the proxy_http_version directive should be “1.1” (by default since 1.29.7) or set to “2” and the “Connection” header field should be cleared." (keepalive)
- A server is marked unavailable after `max_fails` failures within `fail_timeout`; example config uses `max_fails=3 fail_timeout=30s`. (Example Configuration, server)

Added for the load balancing nodes (re-read when the page mentioned nginx 1.31.0):

- `max_fails` defaults to 1, and what counts as a failure is set by `proxy_next_upstream`. "By default, the number of unsuccessful attempts is set to 1." (server, max_fails)
- `fail_timeout` defaults to 10 seconds, both as the window and as how long the server stays out. "By default, the parameter is set to 10 seconds." (server, fail_timeout)
- `resolve` re-resolves a server's DNS name and updates the group without a restart; free since 1.27.3. "Prior to version 1.27.3, this parameter was available only as part of our commercial subscription." (server, resolve)
- `service=` resolves DNS SRV records; the lowest-priority-number records become primary servers, the rest backups. "Highest-priority SRV records (records with the same lowest-number priority value) are resolved as primary servers, the rest of SRV records are resolved as backup servers." (server, service)
- `zone` keeps the group's run-time state in shared memory between worker processes. "Defines the name and size of the shared memory zone that keeps the group’s configuration and run-time state that are shared between worker processes." (zone)
- Without a zone, some limits are per worker. "If the server group does not reside in the shared memory, the limitation works per each worker process." (server, max_conns)
- `least_conn`: fewest active connections, weighted round robin among ties. "If there are several such servers, they are tried in turn using a weighted round-robin balancing method." (least_conn)
- `least_time` became open source in 1.31.0. "Prior to version 1.31.0, this directive was available only as part of our commercial subscription." (least_time)
- `random two` (since 1.15.1) picks two servers at random, then the one with fewer active connections by default. "The optional two parameter instructs nginx to randomly select two servers and then choose a server using the specified method." (random)
- Active periodic health checks are commercial only. "Dynamically configurable group with periodic health checks is available as part of our commercial subscription:" (Example Configuration)

## Visuals worth redrawing

None.

## My notes

- Per-worker pools are the thing Cloudflare's Pingora post complains
  about: more workers, worse reuse.
