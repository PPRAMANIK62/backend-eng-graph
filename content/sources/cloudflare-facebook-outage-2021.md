---
id: cloudflare-facebook-outage-2021
title: Understanding how Facebook disappeared from the Internet
author: Celso Martinho and Tom Strickx (Cloudflare)
url: https://blog.cloudflare.com/october-2021-facebook-outage/
published: 2021-10-04
accessed: 2026-09-28
kind: blog
primary: true
---

## Summary

Cloudflare's same-day account of the 2021-10-04 Facebook outage, from
their own BGP and DNS data. Facebook withdrew the BGP routes to the
prefixes holding its DNS servers, so resolvers everywhere couldn't reach
them and facebook.com stopped resolving. Facebook's own posts (linked,
not opened) say it began with a configuration change on their backbone.

## Key claims

- An AS originates prefixes and can also carry others' traffic. "An AS can originate prefixes (say that they control a group of IP addresses), as well as transit prefixes (say they know how to reach specific groups of IP addresses)." (Meet BGP)
- Without an announcement, nobody can reach you. "Every ASN needs to announce its prefix routes to the Internet using BGP; otherwise, no one will know how to connect and where to find us." (Meet BGP)
- At 15:58 UTC Facebook had stopped announcing routes to its DNS prefixes. "At 15:58 UTC we noticed that Facebook had stopped announcing the routes to their DNS prefixes." (Meet BGP)
- An UPDATE message can change or withdraw a prefix. "A BGP UPDATE message informs a router of any changes you’ve made to a prefix advertisement or entirely withdraws the prefix." (Route withdrawals section)
- Trouble began with a burst of Facebook routing changes around 15:40 UTC. "But at around 15:40 UTC we saw a peak of routing changes from Facebook." (Route withdrawals section)
- Public resolvers returned SERVFAIL because they couldn't reach Facebook's name servers. "1.1.1.1, 8.8.8.8, and other major public DNS resolvers started issuing (and caching) SERVFAIL responses." (DNS gets affected)
- Retries piled up: resolvers saw 30x normal query volume. "we have DNS resolvers worldwide handling 30x more queries than usual" (DNS gets affected)
- facebook.com was unavailable on 1.1.1.1 from about 15:50 to 21:20 UTC. "It stopped being available at around 15:50 UTC and returned at 21:20 UTC." (final section)
- Facebook's IP addresses outside the withdrawn prefixes stayed routed but were useless without DNS. "other Facebook IP addresses remained routed but weren’t particularly useful since without DNS Facebook and related services were effectively unavailable" (Meet BGP)

## Visuals worth redrawing

- Their six-AS diagram with a short and a long path from Start to End.
- The chart of UPDATE messages (announcements vs withdrawals) over time.

## My notes

- The page's summary metadata says "1651 UTC" but the body says 15:51 UTC; use the body.
