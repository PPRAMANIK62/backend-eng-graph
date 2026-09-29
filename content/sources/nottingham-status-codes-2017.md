---
id: nottingham-status-codes-2017
title: How to Think About HTTP Status Codes
author: Mark Nottingham
url: https://www.mnot.net/blog/2017/05/11/status_codes
kind: blog
primary: true
---

## Summary

A 2017 post by one of the HTTP spec editors on how to pick status
codes. Codes have two levels of meaning (the class digit and the
specific code), they're generic across all resources, and they exist
for the benefit of generic HTTP software (caches, clients, proxies,
crawlers). Application detail belongs in the response body.

## Key claims

- The first digit gives the kind of response, the rest the specific handling. "the first digit indicates what kind of response it is, and the other two indicate specific handling for the response." (Two Levels of Meaning)
- The class lets new codes degrade gracefully. "This allows newly defined status codes to gracefully degrade to generic handling" (Two Levels of Meaning)
- Status codes are generic, like methods. "status codes are defined to be potentially applicable to every HTTP resource; we say that they have generic semantics (just like HTTP methods)." (Generic Semantics)
- Forcing your app into status codes backfires. "Trying to make your application “fit” into a set of status codes is only going to cause pain and disappointment." (Generic Semantics)
- Per-endpoint lists of codes are always incomplete, because proxies and servers add their own (421, 429, 500). "The set of status codes that a client can potentially encounter is much larger than the handful they list" (Generic Semantics)
- Codes have specific effects on generic software: 301 redirects, 401 triggers auth, 429 asks the client to slow down. "429 Too Many Requests tells the client that it’s rate-limited, so it ought to calm down and stop sending so many requests." (Specific Effects)
- Even 404 is acted on: caches may negatively cache it. "caches will often perform so-called “negative caching” (i.e., assigning heuristic freshness lifetime to it)" (Specific Effects)
- Crawlers read 404 as gone. "automated agents like Web crawlers will use it as a signal that the resource isn’t there any more." (Specific Effects)
- 202 Accepted means the outcome has to be found some other way. "if your application uses 202 Accepted to indicate that a request has been queued but you don’t know the outcome yet, it’s worth mentioning that in your documentation." (Specific Effects)
- Coarse codes are fine. "When in doubt, it’s OK to use the generic status codes 200 OK, 400 Bad Request and 500 Internal Service Error when there isn’t a better fit." (Specific Effects)
- App-specific meaning goes in the body. "The right place to put application-specific semantics is in the body’s format." (Refining the Semantics of a Status Code)

## Visuals worth redrawing

None.

## My notes

- The post writes "500 Internal Service Error"; the spec name is
  "Internal Server Error". Quote kept as written.
