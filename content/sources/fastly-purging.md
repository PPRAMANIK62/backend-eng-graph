---
id: fastly-purging
title: Purging
author: Fastly documentation
url: https://www.fastly.com/documentation/guides/concepts/edge-state/cache/purging/
kind: docs
primary: true
---

## Summary

Fastly's guide to invalidating cached content as documented when this
was written: purge all, purge by URL, purge by surrogate key, soft vs
hard purges, and how long each takes.

## Key claims

- Purging a lot at once can flood the origin. "Purging a large amount of content from a high traffic service is likely to result in a rapid increase in traffic to origin." (Purge all)
- Purge all takes up to 2 minutes. "Purge-all operations take up to 2 minutes to complete." (Purge all)
- URL purges take around 150 ms. "URL purges take around 150ms to complete and support soft purging as an option, but not bulk purging." (URL purge)
- A surrogate key labels many objects so one purge hits them all. "A surrogate key purge invalidates all objects which share a specified token." (Surrogate key purge)
- Surrogate key purges also take around 150 ms. "Surrogate key purges take around 150ms to complete, and support soft purging as an option." (Surrogate key purge)
- Keys come from a Surrogate-Key response header from the origin, e.g. `Surrogate-Key: template-product product-id-724253 product-id-242129 offers`. (Adding surrogate keys)
- Fastly strips Surrogate-Key before the response reaches the user. "Fastly automatically removes any Surrogate-Key headers present on a response before delivering it to the end user (unless Fastly-Debug is included in the request)." (Adding surrogate keys)
- A soft purge marks content stale instead of making it unusable. "In contrast, a soft purge marks the content as stale." (Soft vs hard purging)

## Visuals worth redrawing

None.

## My notes

- These timings are Fastly's own claims for their network.
