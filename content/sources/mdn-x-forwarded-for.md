---
id: mdn-x-forwarded-for
title: X-Forwarded-For header
author: MDN contributors
url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Forwarded-For
kind: docs
primary: false
---

## Summary

MDN's reference page for X-Forwarded-For (last modified 2025 when
read): syntax, order of addresses, and practical rules for parsing it
and choosing an address you can trust.

## Key claims

- XFF is a de facto standard; Forwarded is the standard version but used much less. "A standardized version of this header is the HTTP Forwarded header, although it's much less frequently used." (intro)
- Order: leftmost is the client, rightmost the most recent proxy. "This means that the rightmost IP address is the IP address of the most recent proxy and the leftmost IP address is the address of the originating client (assuming well-behaved client and proxies)." (Directives)
- The server itself only sees the last proxy's address. "If a client connection passes through any forward or reverse proxies, the server only sees the final proxy's IP address, which is often of little use." (Description)
- If the server can be reached directly, nothing in the list is trustworthy. "If the server can be directly connected to from the internet — even if it is also behind a trusted reverse proxy — no part of the X-Forwarded-For IP list can be considered trustworthy or safe for security-related uses." (Security and privacy concerns)
- Security uses must only use addresses added by a trusted proxy. "Any security-related use of X-Forwarded-For (such as for rate limiting or IP-based access control) must only use IP addresses added by a trusted proxy." (Security and privacy concerns)
- Several XFF headers must be combined into one list. "It is insufficient to use only one of multiple X-Forwarded-For headers." (Parsing)
- Trusted proxy count: search from the right. "The X-Forwarded-For IP list is searched from the rightmost by that count minus one." (Selecting an IP address)
- Trusted proxy list: skip trusted addresses from the right; the first other one is the answer. "The X-Forwarded-For IP list is searched from the rightmost, skipping all addresses that are on the trusted proxy list." (Selecting an IP address)
- With one reverse proxy, use the rightmost address. "For example, if there is only one reverse proxy, that proxy will add the client's IP address, so the rightmost address should be used." (Selecting an IP address)
- The first trustworthy address may be an untrusted proxy, but it's the only one safe for security. "The first trustworthy X-Forwarded-For IP address may belong to an untrusted intermediate proxy rather than the actual client, but it is the only IP suitable to identify a client for security purposes." (Selecting an IP address)
- Spoofed entries may not be IP addresses at all, so check each one. "We say \"a valid address\" above because spoofed values may not be actual IP addresses." (Selecting an IP address, note)

## Visuals worth redrawing

None.

## My notes

- Secondary source, but its rules match RFC 7239 section 8.1 and
  nginx's realip module.
