---
id: root-servers-org
title: Root Server Technical Operations Association (root-servers.org)
author: Root server operators
url: https://root-servers.org/
published: 2026-09-28
accessed: 2026-09-28
kind: docs
primary: true
---

## Summary

The shared site of the root server operators. The front page lists the
13 root server letters (A to M), the 12 organizations that run them,
and a live count of operational instances around the world, with a
per-letter map of sites.

## Key claims

- 13 root name servers, 12 operators. "The 13 root name servers are operated by 12 independent organisations." (front page)
- The root servers are listed by letter, A to M, each with its operator and sites. (front page, Root Servers list)
- Instance count, live figure read 2026-09-28. "As of 2026-09-28T17:45:42Z, the root server system consists of 2045 operational instances operated by the 12 independent root server operators." (front page)

Added 2026-09-28 for `anycast` (FAQ page, https://root-servers.org/faq/):

- Each of the 13 identifiers is one IPv4 and one IPv6 address, no matter how many instances serve it. "There are 13 Root Server Identifiers (RSI, the letters \"A\" through \"M\"). Each RSI operates at one IPv4 and one IPv6 address." (FAQ, How many Root Server Identifiers are there?)
- The instance count changes, generally upward. "The number of root server instances changes (generally increases) over time." (FAQ, How many root servers are there?)
- Per letter, the front page lists sites; e.g. the A root (Verisign) showed "Sites: 56, Operational: 56" on 2026-09-28. (front page, A)

## Visuals worth redrawing

- The world map of instances per letter. Not needed for our articles.

## My notes

- The page doesn't say "anycast" in the text I read. That 13 names map to
  about 2,000 machines is the anycast story; link to the anycast node
  rather than claim more from this page.
- IANA's root servers page (https://www.iana.org/domains/root/servers)
  says the same thing in words: "a network of hundreds of servers in
  many countries around the world" configured "as 13 named authorities".
