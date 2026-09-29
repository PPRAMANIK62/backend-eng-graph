---
id: nginx-limit-req-module
title: Module ngx_http_limit_req_module
author: nginx
url: https://nginx.org/en/docs/http/ngx_http_limit_req_module.html
kind: docs
primary: true
---

## Summary

The reference for nginx's request rate limiter: a per-key limit (often
the client IP) kept in shared memory, using what nginx calls the leaky
bucket method. Excess requests are delayed up to a burst, then rejected.

## Key claims

- Limits the request rate per key, using the leaky bucket method. "The limitation is done using the “leaky bucket” method." (intro)
- Excess requests are delayed to the rate, and rejected once they pass the burst. "Excessive requests are delayed until their number exceeds the maximum burst size in which case the request is terminated with an error." (limit_req)
- Burst defaults to zero. "By default, the maximum burst size is equal to zero." (limit_req)
- Example: 1 request per second on average, bursts up to 5. "allow not more than 1 request per second at an average, with bursts not exceeding 5 requests." (limit_req)
- `nodelay` serves the burst immediately instead of spacing it out. "If delaying of excessive requests while requests are being limited is not desired, the parameter nodelay should be used" (limit_req)
- `delay=` (1.15.7) sets the point where excess requests start being delayed. (limit_req)
- Rejected requests get 503 unless you change it. "Default: limit_req_status 503;" (limit_req_status)
- Dry-run mode (1.17.1) counts without limiting. "In this mode, requests processing rate is not limited, however, in the shared memory zone, the number of excessive requests is accounted as usual." (limit_req_dry_run)
- The state per key is small: 64 bytes on 32-bit, 128 bytes on 64-bit. "One megabyte zone can keep about 16 thousand 64-byte states or about 8 thousand 128-byte states." (limit_req_zone)
- When the zone is full, the least recently used state is dropped. "If the zone storage is exhausted, the least recently used state is removed." (limit_req_zone)
- Several limits can apply at once (per IP and per server). "There could be several limit_req directives." (limit_req)
- Sharing the zone between servers (`sync`) is in the commercial version only. (limit_req_zone)

## Visuals worth redrawing

None.

## My notes

- nginx's "leaky bucket" queues (delays) the excess, which is the
  shaping reading of the leaky bucket. Cloudflare and Brandur use the
  word for a counter that rejects.
