---
id: kettle-http-desync-attacks-2019
title: "HTTP Desync Attacks: Request Smuggling Reborn"
author: James Kettle, PortSwigger Research
url: https://portswigger.net/research/http-desync-attacks-request-smuggling-reborn
kind: paper
primary: true
---

## Summary

The 2019 Black Hat / DEF CON research that brought request smuggling
back. A front-end proxy and a back-end server share connections for many
users' requests; if they disagree on where one request ends, an attacker
can leave bytes on the connection that get glued onto the next user's
request. Covers CL.TE and TE.CL, header obfuscation, safe timing-based
detection, real exploits (including PayPal), and defences.

## Key claims

- HTTP/1.1 requests on one connection are just placed back to back. "HTTP requests are simply placed back to back, and the server parses headers to work out where each one ends and the next one starts." (Core concepts)
- This isn't pipelining, which the attack doesn't need. "This is often confused with HTTP pipelining, which is a rarer subtype that's not required for the attacks described in this paper." (Core concepts)
- Front-ends route many users' requests over one back-end connection, so both must agree on message ends. "This multi-tiered architecture takes HTTP requests from multiple different users and routes them over a single TCP/TLS connection" (Core concepts)
- The attacker gets to prepend content to the next user's request. "This gives the attacker the ability to prepend arbitrary content at the start of the next legitimate user's request." (Core concepts)
- Duplicate Content-Length rarely works because many systems reject it. "In real life, the dual content-length technique rarely works because many systems sensibly reject requests with multiple content-length headers." (Core concepts)
- The usual trick is to hide Transfer-Encoding from one of the two servers so it falls back to Content-Length. "Whenever we find a way to hide the Transfer-Encoding header from one server in a chain it will fall back to using the Content-Length and we can desynchronize the whole system." (Core concepts)
- Small header quirks are harmless if both sides share them, dangerous if not. "Each of these quirks is harmless if both the front-end and back-end server have it, and a major threat otherwise." (Core concepts)
- Header quirks that hide Transfer-Encoding from one server include `xchunked`, a space before the colon and a tab after it. "Here's a few examples of requests where only some servers recognise the Transfer-Encoding: chunked header." (Core concepts, list: `Transfer-Encoding: xchunked`, `Transfer-Encoding : chunked`, `Transfer-Encoding:[tab]chunked`)
- CL.TE names the case where the front-end uses Content-Length and the back-end uses Transfer-Encoding. "Let's assume the front-end server uses the Content-Length header, and the back-end uses the Transfer-Encoding header. I'll refer to this orientation as CL.TE for short." (Detect)
- The attack was first documented in 2005. "HTTP Request Smuggling was first documented back in 2005 by Watchfire" (Abstract)
- More layers, more risk. "If your website is free of load balancers, CDNs and reverse proxies, this technique is not a threat." (Defence)
- HTTPS doesn't prevent it. "Whenever I discuss an attack technique I get asked if HTTPS prevents it. As always, the answer is 'no'." (Defence)
- Fixes that remove the whole class: HTTP/2 to the back-end, or no back-end connection reuse. "you can resolve all variants of this vulnerability by configuring the front-end server to exclusively use HTTP/2 to communicate to back-end systems, or by disabling back-end connection reuse entirely." (Defence)
- Back-ends should reject ambiguous requests and drop the connection rather than normalise. "Normalising requests is not an option for back-end servers - they need to outright reject ambiguous requests, and drop the associated connection." (Defence)
- Smuggling can be used to poison web caches. "poison web caches, and compromise PayPal's login page." (Abstract)
- In the basic example the leftover "G" turns the next user's POST into GPOST. "the injected 'G' will corrupt the green user's request and they will probably get a response along the lines of \"Unknown method GPOST\"." (Core concepts)
- Uses: reroute victims' requests, trigger harmful responses, steal credentials. "I'll show you how to delicately amend victims' requests to route them into malicious territory, invoke harmful responses, and lure credentials into your open arms." (Abstract)
- It lets an attacker get around trust placed in the front-end. "exploit every modicum of trust placed on the front-end, gain maximum privilege access to internal APIs" (Abstract)
- Rejecting hurts legitimate traffic more than normalising. "Since rejecting requests is more likely to affect legitimate traffic than simply normalising them, I recommend focusing on preventing request smuggling via the front-end server instead." (Defence)

## Visuals worth redrawing

- The core diagram: a front-end and back-end, with an attacker's
  request whose tail (the "prefix") is left on the back-end connection
  and glued onto the next user's request.

## My notes

- The page shows publication and update dates; keep them out of
  articles. Say 2019.
