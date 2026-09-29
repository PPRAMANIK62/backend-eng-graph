---
id: mnot-browser-caching-2017
title: The State of Browser Caching, Revisited
author: Mark Nottingham
url: https://mnot.net/blog/2017/browser-caching
kind: blog
primary: true
---

## Summary

Mark Nottingham (an editor of the HTTP caching spec) ran HTTP caching
tests from the Web Platform Tests against Firefox, Chrome, Safari Tech
Preview and an Edge Insider build in 2017, through the Fetch API, and
wrote up where browser caches follow the spec and where they don't.
Primary for his own test results; the browsers have moved on since.

## Key claims

- Freshness is the core mechanism. "The core mechanism in HTTP caching is freshness" (Explicit Freshness)
- All tested browsers handled Expires and max-age correctly, preferring max-age. "They also correctly prefer Cache-Control: max-age over Expires when both are present." (Explicit Freshness)
- no-store and no-cache worked in all tested browsers; no need for a pile of directives. "In particular, it’s not necessary to put a salad of Cache-Control directives into your response to cache-bust ; no-store and no-cache work perfectly well." (Explicit Freshness)
- Browser caches have to account for Age because other caches sit on the path. "That means that the browser’s cache needs to take account of the Age header when calculating freshness" (Explicit Freshness)
- Heuristic freshness is what got web caching started. "Web caching never would have gotten started without it." (Heuristic Freshness)
- Caches usually base the heuristic on Last-Modified: older means longer. "if it’s a long time ago, they have higher confidence that the resource won’t change soon, so they assume a longer lifetime." (Heuristic Freshness)
- All tested browsers applied heuristic freshness to 200; which other codes varied by browser. "All tested browser caches apply heuristic freshness to 200 OK ." (Heuristic Freshness)
- All tested browsers updated stored headers from a 304. "All of the tested browsers do update stored headers upon a 304 , both in the immediate response and subsequent ones served from cache." (Validation)
- All invalidated the URL on POST, PUT and DELETE; only Firefox also invalidated Location and Content-Location. "Firefox also correctly invalidates the Location and Content-Location URLs; Safari, Edge and Chrome do not." (Invalidation)
- Caching of status codes other than 200 with explicit freshness varied widely: Chrome cached all tested, Edge only 200. "Edge only caches 200 ; other tested status codes aren’t served from cache, even with explicit freshness information." (Status Codes)
- Request directives were patchy; Chrome only honored max-age=0. "Chrome only supports max-age=0 in requests , and only with the value 0 ." (Request Cache-Control)
- no-cache allows the cache but forces validation. "no-cache means something slightly different than you might think; it allows use of the cache, but forces the request to go to the origin server to validate any stored response." (Request Cache-Control)
- Vary extends the cache key. "HTTP lets servers specify that the cache key depends on more than just the URL by using the Vary header, which lists the request headers whose values should be added to it." (Vary)
- Browsers stored only one variant at a time per URL. "all tested browser caches would only store one variant at a time" (Vary)

## Visuals worth redrawing

None.

## My notes

- These are 2017 results through Fetch; say so if citing any per-browser
  detail. Edge in 2017 was the pre-Chromium engine.
