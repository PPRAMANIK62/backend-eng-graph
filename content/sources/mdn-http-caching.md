---
id: mdn-http-caching
title: HTTP caching (MDN Web Docs guide)
author: MDN contributors
url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching
kind: docs
primary: false
---

## Summary

MDN's guide to HTTP caching, as it read when this was written: private
vs shared caches (proxy and managed), heuristic caching, freshness and
Age, Vary, validation with Last-Modified and ETag, no-cache vs
no-store, reload and force reload, why stored responses can't be
deleted, request collapsing, and common header patterns (cache busting
with `immutable`, `no-cache` for HTML). Secondary: it explains RFC 9111
and browser behavior, it doesn't define them.

## Key claims

- A private cache is tied to one client, so it can hold personalized responses. "A private cache is a cache tied to a specific client — typically a browser cache." (Private caches)
- A cookie alone doesn't make a response private. "the presence of a cookie does not always indicate that it is private, and thus a cookie alone does not make the response private." (Private caches)
- Managed caches (reverse proxies, CDNs, service workers) are deployed by the service's own developers. "Managed caches are explicitly deployed by service developers to offload the origin server and to deliver content efficiently." (Managed caches)
- With HTTPS, proxy caches on the path mostly just tunnel. "proxy caches in the path can only tunnel a response and can't behave as a cache, in many cases." (Proxy caches)
- Managed caches can be purged; the HTTP spec has no delete. "the HTTP Caching specification essentially does not define a way to explicitly delete a cache — but with a managed cache, the stored response can be deleted at any time" (Managed caches)
- Heuristic caching stores responses even without Cache-Control. "HTTP is designed to cache as much as possible, so even if no Cache-Control is given, responses will get stored and reused if certain conditions are met." (Heuristic caching)
- Heuristic caching is a workaround; send Cache-Control explicitly. "basically all responses should explicitly specify a Cache-Control header." (Heuristic caching)
- Age from a shared cache reduces the remaining freshness at the client; max-age=604800 with Age: 86400 leaves 518400 s. "The client which receives that response will find it to be fresh for the remaining 518400 seconds" (Fresh and stale based on age)
- max-age replaced Expires because dates are hard to parse and clocks can be shifted. "the time format is difficult to parse, many implementation bugs were found, and it is possible to induce problems by intentionally shifting the system clock" (Expires or max-age)
- Varying on User-Agent destroys reuse. "the User-Agent request header generally has a very large number of variations, which drastically reduces the chance that the cache will be reused." (Vary)
- Use private instead of Vary: Cookie for personalized content. "you should specify Cache-Control: private instead of specifying a cookie for Vary ." (Vary)
- A 304 has no body, so it's small. "there is no response body — there's just a status code — so the transfer size is extremely small." (Validation)
- no-cache stores but always revalidates. "The no-cache directive does not prevent the storing of responses but instead prevents the reuse of responses without revalidation." (Don't cache)
- no-store doesn't remove a response already stored for that URL. "The no-store directive prevents a response from being stored, but does not delete any already-stored response for the same URL." (Don't cache)
- no-store also costs the browser's back/forward cache. "it's not recommended to grant no-store liberally, because you lose many advantages that HTTP and browsers have, including the browser's back/forward cache." (What's lost by no-store)
- The kitchen-sink header is a workaround for old proxies. "Cache-Control: no-store, no-cache, max-age=0, must-revalidate, proxy-revalidate" (Proxy caches)
- Prefer no-cache over max-age=0, must-revalidate. "there's no reason to ever use that max-age=0 and must-revalidate combination — you should instead just use no-cache ." (Force Revalidation)
- A reload sends max-age=0 with validators; a force reload sends no-cache without them. "Since that's not a conditional request with no-cache , you can be sure you'll get a 200 OK from the origin server." (Force reload)
- Chrome stopped revalidating subresources on reload instead of implementing immutable. "Note that, instead of implementing that directive, Chrome has changed its implementation so that revalidation is not performed during reloads for subresources." (Avoiding revalidation)
- A long max-age can't be taken back from intermediate caches. "There is no way to delete responses on an intermediate server that have been stored with a long max-age ." (Deleting stored responses)
- Clear-Site-Data clears browser caches only. "The Clear-Site-Data: cache header and directive value can be used to clear browser caches — but has no effect on intermediate caches." (Deleting stored responses)
- Request collapsing can reuse even max-age=0 or no-cache responses for requests arriving together; add private to stop that. "Request collapse occurs when requests are arriving at the same time, so even if max-age=0 or no-cache is given in the response, it will be reused." (Request collapse)
- Default pattern: no-cache, plus private for personalized content. "Cache-Control: no-cache, private" (Default settings)
- Cache busting: put a version or hash in the URL so it can be cached for a long time. "it is a common best practice to change the URL each time the content changes, so that the URL unit can be cached for a longer period." (Cache Busting)
- HTML (main resources) can't be cache-busted; use no-cache with validators. "For that case, no-cache would be appropriate — rather than no-store — since we don't want to store HTML, but instead just want it to always be up-to-date." (Main resources)
- public is only needed to cache responses to requests with Authorization. "The public directive should only be used if there is a need to store the response when the Authorization header is set." (Cache Busting)

## Visuals worth redrawing

- The two cache-key tables in "Vary" (URL alone, then URL plus
  Accept-Language).

## My notes

- The page says it was last modified in 2026; the "work is underway"
  note on CDN-Cache-Control is out of date (RFC 9213 was published
  in 2022).
- Its example dates are from 2022; don't copy them.
