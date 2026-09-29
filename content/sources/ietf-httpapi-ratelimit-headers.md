---
id: ietf-httpapi-ratelimit-headers
title: RateLimit header fields for HTTP (draft-ietf-httpapi-ratelimit-headers-11)
author: R. Polli, A. Martinez, D. Miller, IETF HTTPAPI working group
url: https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/
kind: spec
primary: true
---

## Summary

An Internet-Draft (work in progress, version -11 when this was read) that
defines two response headers, `RateLimit-Policy` and `RateLimit`, so a
server can tell clients their quota before they hit it. Not an RFC yet.
Its appendix is a short survey of the non-standard `X-RateLimit-*`
headers in use today.

## Key claims

- There's no standard way today for servers to tell clients their quotas. "Currently, there is no standard way for servers to communicate quotas so that clients can throttle their requests to prevent errors." (1)
- Two fields: a policy and the current quota under it. "RateLimit: the quota currently available under a specific policy." (1)
- The draft doesn't pick an algorithm. "This specification does not mandate a specific throttling algorithm." (1.1)
- Policy parameters: `q` (quota), `qu` (unit), `w` (window in seconds), `pk` (partition key). Example: `RateLimit-Policy: "permin";q=50;w=60,"perhr";q=1000;w=3600`. (3.1, 3.2)
- Quota units can be requests, content bytes, or concurrent requests. "concurrent-requests:  This value indicates the quota is based on the number of concurrent requests processed by the resource server." (3.1.2)
- The current limit: `r` (remaining) and `t` (seconds in the effective window). Example: `RateLimit: "default";r=50;t=30`. (4, 4.2)
- The window is a number of seconds, not a timestamp, so clocks don't need to agree and clients aren't all told the same instant. "it mitigates the risk related to thundering herd when too many clients are serviced with the same timestamp." (4.1.2)
- Remaining quota is a hint, not a promise. "Clients MUST NOT assume that a positive available quota is a guarantee that further requests will be served." (4.1.1)
- Retry-After wins if both are present. "If a response contains both the RateLimit and Retry-After fields, the Retry-After field MUST take precedence and the effective window MAY be ignored." (7)
- Proxies can retry and use up quota without the client knowing. "For example, it is legitimate for a proxy to retransmit a request without notifying the client, and thus consuming quota units." (7.2)
- Ignore the fields on cached responses. "they SHOULD be ignored on responses that come from cache" (7.3)
- If failed-auth responses count against a quota, an attacker can learn about someone else's traffic. "if error responses (such as 401 (Unauthorized) and 403 (Forbidden)) count against quota, a malicious client could probe the endpoint to get traffic information of another user." (8.2)
- Quotas can be per user, per IP, per area, and stacked (per second, per minute, per hour). "Quotas may be enforced on different basis (e.g. per user, per IP, per geographic area, etc.) and at different levels." (Appendix A)
- Example of stacked limits. "a user may be allowed to issue: 10 requests per second; limited to 60 requests per minute; limited to 1000 requests per hour." (Appendix A, list flattened)
- Servers over quota usually answer with a 4xx such as 429 or 403, or drop connections. "When quota is exceeded, servers usually do not serve the request replying instead with a 4xx HTTP status code (e.g. 429 or 403) or adopt more aggressive policies like dropping connections." (Appendix A)
- Today's headers (X-RateLimit-Limit, -Remaining, -Reset and variants) mean different things at different vendors. "each implementation associates different semantics to the same header field names" (A.1)

## Visuals worth redrawing

None.

## My notes

- Still a draft. Re-check when it becomes an RFC; field names changed
  across versions (older drafts had three separate fields).
- Read from the -11 text on ietf.org; the datatracker URL always points
  to the latest version.
