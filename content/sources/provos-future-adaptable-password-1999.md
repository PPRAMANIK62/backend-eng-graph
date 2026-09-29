---
id: provos-future-adaptable-password-1999
title: A Future-Adaptable Password Scheme
author: Niels Provos and David Mazières
url: https://www.usenix.org/legacy/events/usenix99/provos/provos_html/node1.html
kind: paper
primary: true
---

## Summary

The paper that introduced bcrypt (USENIX, 1999). Only the introduction
(the HTML page linked) was read: it explains why password hashing has to
get slower as hardware gets faster.

## Key claims

- Password strength doesn't grow with computing power. "Unfortunately, one security parameter--the length and entropy of user-chosen passwords--does not scale at all with computing power." (Introduction)
- Unix crypt then and later. "At the time of deployment in 1976, crypt could hash fewer than 4 passwords per second." (Introduction)
- By the time of the paper, over 200,000 per second. "Today, over 20 years later, a fast workstation with heavily optimized software can perform over 200,000 crypt operations per second." (Introduction)
- What they propose: an adjustable-cost hash. "We present two algorithms with adaptable cost--eksblowfish, a block cipher with a purposefully expensive key schedule, and bcrypt, a related hash function." (Introduction)

## Visuals worth redrawing

None.

## My notes

- "Today" in the paper means 1999.
