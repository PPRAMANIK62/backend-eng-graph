---
id: cloudflare-verizon-route-leak-2019
title: How Verizon and a BGP Optimizer Knocked Large Parts of the Internet Offline Today
author: Tom Strickx (Cloudflare)
url: https://blog.cloudflare.com/how-verizon-and-a-bgp-optimizer-knocked-large-parts-of-the-internet-offline-today/
published: 2019-06-24
accessed: 2026-09-28
kind: blog
primary: true
---

## Summary

Cloudflare's same-day write-up of the 2019-06-24 route leak. A "BGP
optimizer" at a small ISP split prefixes into more-specific halves; they
leaked through a customer to Verizon, which announced them to the whole
Internet. Because more-specific routes win, traffic for Cloudflare,
Amazon and others went through networks that couldn't carry it.

## Key claims

- It started at 10:30 UTC. "Today at 10:30UTC, the Internet had a small heart attack." (opening)
- The optimizer split prefixes into more-specifics, e.g. Cloudflare's 104.20.0.0/20 into two /21s. "our own IPv4 route 104.20.0.0/20 was turned into 104.20.0.0/21 and 104.20.8.0/21." (opening)
- More-specific routes override general ones. "Specific routes override more general routes" (explanation section)
- The path: DQE (AS33154) to its customer Allegheny Technologies (AS396531) to Verizon (AS701), which told the entire Internet. "who proceeded to tell the entire Internet about these “better” routes." (explanation section)
- The networks weren't allowed to claim the best route and couldn't carry the traffic. "DQE, Allegheny and Verizon were not allowed to say they had the best route to Cloudflare, Amazon, Linode, etc..." (explanation section)
- Cloudflare lost about 15% of its global traffic at the worst point. "During the incident, we observed a loss, at the worst of the incident, of about 15% of our global traffic." (explanation section)
- Fixes: prefix limits per session, IRR-based filtering, and RPKI origin validation. "A BGP session can be configured with a hard limit of prefixes to be received." (How could this leak have been prevented?)
- RPKI filters on origin network and prefix size. "It enables filtering on origin network and prefix size." (How could this leak have been prevented?)
- RPKI lets an origin sign its prefixes with a maximum length, so longer (more specific) announcements are rejected. "The prefixes Cloudflare announces are signed for a maximum size of 20." (How could this leak have been prevented?)
- RPKI only works if receiving networks turn on origin validation. "In order for this mechanism to take action, a network needs to enable BGP Origin Validation." (How could this leak have been prevented?)

Added 2026-09-28 (audit) for `bgp`:

- The optimizer ran at an ISP in Pennsylvania. "An Internet Service Provider in Pennsylvania  (AS33154 - DQE Communications) was using a BGP optimizer in their network" (What happened?)

## Visuals worth redrawing

- The leak path diagram (DQE to Allegheny to Verizon to the Internet).

## My notes

- 2019 post; RPKI deployment has grown since, but no opened source gives current numbers.
