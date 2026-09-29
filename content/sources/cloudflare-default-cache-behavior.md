---
id: cloudflare-default-cache-behavior
title: Default cache behavior
author: Cloudflare documentation
url: https://developers.cloudflare.com/cache/concepts/default-cache-behavior/
kind: docs
primary: true
---

## Summary

What Cloudflare's CDN caches with no configuration, as documented when
this was written: which headers stop or allow caching, which file
extensions are cached, default edge lifetimes by status code, and
request collapsing.

## Key claims

- Responses aren't cached with private, no-store, no-cache or max-age=0, with Set-Cookie, or for non-GET methods. "The Cache-Control header is set to private, no-store, no-cache, or max-age=0." (intro list)
- Set-Cookie on a response stops caching. "The Set-Cookie header exists." (intro list)
- Only GET is cached. "The HTTP request method is anything other than a GET." (intro list)
- Many requests for one uncached object at a data center send one request to the origin. "Only the first request is forwarded to the origin to fetch the asset." (Request collapsing)
- Collapsing uses a cache lock, and waiting requests get the first response streamed to them. "The remaining requests wait for the first request to complete, after which the response is streamed to all waiting requests." (Request collapsing)
- Caching decisions are by file extension, and HTML and JSON aren't cached by default. "The Cloudflare CDN does not cache HTML or JSON by default." (Default cached file extensions)
- Extension, not MIME type. "Cloudflare only caches based on file extension and not by MIME type." (Default cached file extensions)
- Default edge lifetimes when the origin sends no Cache-Control or Expires: 200, 206, 301 for 120 minutes; 302, 303 for 20; 404, 410 for 3; others not cached. "All other status codes are not cached by default." (Edge TTL)

## Visuals worth redrawing

None.

## My notes

- Plan-dependent limits (upload and cacheable size) are on the page
  too; not needed and they change.
