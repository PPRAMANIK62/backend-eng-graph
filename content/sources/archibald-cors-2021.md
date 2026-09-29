---
id: archibald-cors-2021
title: How to win at CORS
author: Jake Archibald
url: https://jakearchibald.com/2021/cors/
kind: blog
primary: false
---

## Summary

A long explainer (2021) by a browser developer who has worked on the
Fetch spec. Why CORS is shaped the way it is: no-CORS embeds and their
leaks, the same-origin policy from Netscape 2, origins vs sites, why
"just drop credentials" wasn't enough, and the header opt-in. Then the
practical rules, including Vary and preflight caching.

## Key claims

- Old embeds (img, script, link) send the other site's cookies and leak details. "When you request other-site content using one of the methods above, it sends along the credentials for the other-site." (Cross-origin access without CORS)
- The same-origin rule came with Netscape 2's frames and scripting. "they decided that cross-frame scripting would only be allowed if both pages had the same origin." (The same-origin policy)
- Origins vs sites: help.yourbank.com and profile.yourbank.com are different origins but the same site. "Cookies are the most common feature that operate at a site level, as you can create cookies that are sent to all subdomains of yourbank.com." (Origins vs sites)
- Sites are decided by the public suffix list. "That list is now maintained as a separate community project known as the public suffix list, and it's used by all browsers and many other projects." (Origins vs sites)
- Dropping credentials isn't enough, because of intranets and IP-based access. "A lot of company intranets assume they're 'private' because they're only accessible from a particular network." (Remove credentials?)
- So the resource must opt in. "There's no way to know that a resource contains private data, so we need some way for the resource to declare "hey, it's fine, let the other site read my content"." (Remove credentials?)
- Routers and IoT devices also assume only local users reach them. "Some routers and IoT devices assume they're only accessible by well-meaning folks because they're restricted to your home network" (Remove credentials?)
- Headers were the natural place for the opt-in. "And besides, HTTP already has a place for resource metadata…" (In-resource opt-in?)
- CORS responses still hit caches; add Vary when headers are conditional. "A lot of popular "cloud storage" hosts get this wrong. They add CORS headers conditionally, and don't include the Vary header." (CORS requests)
- The preflight never includes credentials. "The preflight request never includes credentials, even if the main request will." (Preflight request)
- The preflight only permits the request; the real response is checked too. "Oh, and the preflight only gives the go-ahead for the request. The eventual response must also pass a CORS check." (Preflight response)
- Preflight status must be 2xx, even if the real answer will be 404. "But if the request requires a preflight, the preflight must return a 200-299 code, even if the eventual response is going to be 404." (Preflight response)
- Browsers cap Access-Control-Max-Age: 600 seconds in Chrome and 86400 in Firefox when written (2021). "In Chrome it's 600 (10 minutes), and in Firefox it's 86400 (24 hours)." (Preflight response)

## Visuals worth redrawing

None; the post's CORS playground is interactive.

## My notes

- Browser caps are from 2021 and may have changed; the article says so
  if it uses them.
- Author works on browsers (Firefox when opened, Chrome earlier) but
  didn't build CORS itself, so primary: false.
