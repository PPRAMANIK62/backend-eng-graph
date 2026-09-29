---
id: fastly-caching
title: Caching content with Fastly
author: Fastly documentation
url: https://www.fastly.com/documentation/guides/concepts/edge-state/cache/
kind: docs
primary: true
---

## Summary

Fastly's overview of its edge cache as documented when this was written:
the readthrough cache that follows HTTP caching rules, request
collapsing, streaming misses, revalidation, purging, and the warning
that the cache is not storage.

## Key claims

- The first request at a POP goes to the backend; later ones come from cache. "The first time a cacheable resource is requested at a particular POP, the resource will be requested from your backend server and stored in cache automatically." (intro)
- Caching follows the HTTP caching standard. "HTTP caching semantics, such as the Cache-Control header, are part of the HTTP Caching standard (RFC 9111) and allow HTTP responses to include information that the Fastly cache uses to decide how they should be cached." (intro)
- Request collapsing: one backend fetch for many waiting clients. "Request collapsing allows us to identify multiple simultaneous requests for the same resource, and make just one backend fetch for it, using the resulting response to populate the cache and satisfy all waiting clients." (intro)
- Streaming miss sends the response to cache and client at the same time. "Streaming miss writes a response stream to cache and to an end user at the same time." (intro)
- Backend revalidation extends a stale object's life without resending its body. "If the backend validates that the content in the cache is still good to use, it can instruct the cache to extend the lifetime of the object in place without having to send its contents again." (intro)
- Purging removes entries before they expire. "Purging allows cache entries to be expunged ahead of their normal expiry, so that changes to the source content can be reflected at the edge immediately." (intro)
- The cache is ephemeral: things can be evicted before they expire. "All data stored in the Fastly cache is ephemeral: it will expire, and may be evicted by the platform before it expires depending on how frequently it is used." (intro)

Added for `http-caching`:

- The cache revalidates stale objects with conditional requests on its own. "if a requested object exists in the Fastly cache as a stale object, the readthrough cache will automatically issue conditional requests to a backend when possible to update (revalidate) its stored copy." (Requests for stale objects)
- Inside a stale-while-revalidate period, revalidation can happen in the background. "When within a stale-while-revalidate period, these backend revalidations may be issued asynchronously, immediately returning the stale object for client use." (Requests for stale objects)
- stale-if-error is supported too: a blocking fetch that falls back to the stale copy on failure. "The send operation performs a blocking fetch and returns the stale content to the calling application if the fetch sees a network failure." (Customizing cache interaction with the backend)

## Visuals worth redrawing

None.

## My notes

- The page pins Compute SDK versions at the top; the readthrough cache
  behaviour doesn't depend on them.
