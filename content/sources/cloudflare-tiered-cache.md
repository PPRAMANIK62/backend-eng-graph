---
id: cloudflare-tiered-cache
title: Tiered Cache
author: Cloudflare documentation
url: https://developers.cloudflare.com/cache/how-to/tiered-cache/
kind: docs
primary: true
---

## Summary

Cloudflare's docs for its cache hierarchy, as documented when this was
written: data centers near users (lower tiers) ask a few upper-tier data
centers before anyone asks the origin.

## Key claims

- Without tiers, every edge data center with a miss contacts the origin. "However, if a piece of content is not in cache, the Cloudflare edge data centers must contact the origin server to receive the cacheable content." (intro)
- Lower tiers ask upper tiers; only upper tiers ask the origin. "If the upper-tier does not have the content, only the upper-tier can ask the origin for content." (intro)
- Fewer data centers talk to the origin, so fewer origin connections. "This results in fewer open connections using server resources." (intro)
- Smart Tiered Cache picks the upper tier by measured latency to the origin. "Cloudflare can select the data center with the lowest latency to be the upper-tier for an origin." (Smart Tiered Cache)
- Changing origin addresses can move the upper tier and raise misses while it refills. "resulting in an increased MISS rate as cache is refilled in the new upper tiers." (Smart Tiered Cache)

## Visuals worth redrawing

- Users, lower-tier data centers, one upper tier, origin.

## My notes

- Fastly's equivalent is called shielding (listed in its docs menu;
  not opened).
