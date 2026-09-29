---
id: kettle-http1-must-die-2025
title: "HTTP/1.1 must die: the desync endgame"
author: James Kettle, PortSwigger Research
url: https://portswigger.net/research/http1-must-die
kind: paper
primary: true
---

## Summary

Kettle's 2025 follow-up (Black Hat / DEF CON): six years of patches and
WAF rules have made request smuggling harder to detect but not gone. New
desync classes (0.CL, Expect-based) hit Akamai, Cloudflare and Netlify.
Argues the root cause is HTTP/1.1's weak message boundaries and that
only HTTP/2 between proxy and back-end fixes it.

## Key claims

- HTTP/1.1's flaw: requests are concatenated with no delimiters and several ways to state length. "Requests are simply concatenated on the underlying TCP/TLS socket with no delimiters, and there are multiple ways to specify their length." (The fatal flaw in HTTP/1.1)
- Reverse proxies funnel different users' requests into a shared pool. "Major websites often use reverse proxies, which funnel requests from different users down a shared connection pool to the back-end server." (The fatal flaw in HTTP/1.1)
- Downgrading HTTP/2 to HTTP/1.1 upstream is worse than HTTP/1.1 end to end, adding a fourth length interpretation. "Downgrading incoming HTTP/2 messages is even more dangerous than using HTTP/1.1 end to end, as it introduces a fourth way to specify the length of a message." (Mitigations that hide but don't fix)
- The four: CL, TE, implicit zero, HTTP/2's own length. (Mitigations that hide but don't fix, list)
- Six years of mitigations hid the problem without fixing it. "Six years of attempted mitigations have hidden the issue, but failed to fix it." (Abstract)
- Mitigations like WAF regexes hide the problem. "WAFs now use regexes to detect and block requests with an obfuscated Transfer-Encoding header, or potential HTTP requests in the body." (Mitigations that hide but don't fix)
- A desync inside Cloudflare's own infrastructure exposed over 24 million sites. "This finding exposed over 24,000,000 websites to complete site takeover!" (Hacking 20 million websites by accident)
- Cloudflare patched it within hours. "Cloudflare patched it within hours, published a post-mortem and awarded a $7,000 bounty." (Hacking 20 million websites by accident)
- HTTP/1.1 is only simple if you don't proxy it. "First, HTTP/1.1 is only simple if you're not proxying." (Why patching HTTP/1.1 is not enough)
- HTTP/2 upstream makes desyncs far less likely because its lengths are unambiguous. "HTTP/2 is a binary protocol, much like TCP and TLS, with zero ambiguity about the length of each message." (How secure is HTTP/2 compared to HTTP/1?)
- Client-to-front-end HTTP/1.1 is less dangerous because those connections aren't shared. "These connections are rarely shared between different users and, as a result, they're significantly less dangerous." (How to defeat request smuggling with HTTP/2)
- When written, nginx, Akamai, CloudFront and Fastly lacked upstream HTTP/2. "Unfortunately, the following vendors have not yet added support for upstream HTTP/2: nginx, Akamai, CloudFront, Fastly." (How to defeat request smuggling with HTTP/2)
- If stuck on HTTP/1.1: normalise and validate at the front, validate at the back, consider disabling upstream reuse, reject bodies on GET/HEAD/OPTIONS. "Reject requests that have a body, if the method doesn't require one to be present (GET/HEAD/OPTIONS)" (How to survive with HTTP/1.1)
- Stricter validation would help but vendors fear breaking old clients. "Applying robust validation or normalisation on front-end servers would help, but we're too afraid of breaking compatibility with legacy clients to do this." (Why patching HTTP/1.1 is not enough)
- New desync classes were found (0.CL, Expect-based). "This paper introduces several novel classes of HTTP desync attack capable of mass compromise of user credentials." (Abstract)

## Visuals worth redrawing

None beyond the 2019 paper's diagram.

## My notes

- The nginx docs now list `proxy_http_version 2` (added in 1.29.4),
  so the vendor list is already partly out of date.
