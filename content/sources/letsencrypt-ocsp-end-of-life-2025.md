---
id: letsencrypt-ocsp-end-of-life-2025
title: OCSP Service Has Reached End of Life
author: Let's Encrypt
url: https://letsencrypt.org/2025/08/06/ocsp-service-has-reached-end-of-life
kind: blog
primary: true
---

## Summary

Let's Encrypt's 2025 post saying it turned off its OCSP service and now
publishes revocation only through CRLs, with its reasons: privacy and
simplicity.

## Key claims

- OCSP turned off; CRLs only from now on. "Going forward, we will publish revocation information exclusively via Certificate Revocation Lists (CRLs)." (post)
- OCSP tells the CA which site a user visits. "the Certificate Authority (CA) operating the OCSP responder immediately becomes aware of which website is being visited from that visitor's particular IP address." (post)
- CRLs don't leak that. "CRLs do not have this issue." (post)
- The scale of OCSP at its peak. "we handled approximately 340 billion OCSP requests per month." (post)

## Visuals worth redrawing

None.

## My notes

- The 2024 posts (intent, timeline) add: most OCSP clients fail open,
  Must-Staple never got wide browser support, and stapling in popular
  web servers risked downtime. Not cited; opened only.
