---
id: letsencrypt-6day-ga-2026
title: 6-day and IP Address Certificates are Generally Available
author: Let's Encrypt
url: https://letsencrypt.org/2026/01/15/6day-and-ip-general-availability
kind: blog
primary: true
---

## Summary

Let's Encrypt's 2026 post making short-lived (about six-day) and IP
address certificates generally available, why short lifetimes help,
and that the default lifetime is dropping from 90 to 45 days.

## Key claims

- Short-lived certificates last 160 hours. "These certificates are valid for 160 hours, just over six days." (post)
- You get them by choosing a profile in the ACME client. "subscribers simply need to select the 'shortlived' certificate profile in their ACME client." (post)
- Why short lifetimes help. "Short-lived certificates improve security by requiring more frequent validation and reducing reliance on unreliable revocation mechanisms." (post)
- Revocation is unreliable, so a stolen key stays usable until expiry. "Unfortunately, revocation is an unreliable system so many relying parties continue to be vulnerable until the certificate expires, a period as long as 90 days." (post)
- Short-lived certificates are opt-in. "Short-lived certificates are opt-in and we have no plan to make them the default at this time." (post)
- Default lifetime going from 90 to 45 days. "Our default certificate lifetimes will be going from 90 days down to 45 days over the next few years, as previously announced." (post)
- IP address certificates must be short-lived. "IP address certificates must be short-lived certificates" (post)

## Visuals worth redrawing

None.

## My notes

- The docs page (letsencrypt.org/docs/cert-lifetimes/) says 45 days by
  2028; not cited.
